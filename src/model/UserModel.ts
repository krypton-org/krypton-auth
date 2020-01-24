import { model, Schema, Document, Model } from 'mongoose';
import jwt from 'jsonwebtoken';
import config from '../config';
import * as PasswordEncryption from '../services/crypto/PasswordEncryption';
import {
    UserNotFound,
    WrongPasswordError,
    WrongTokenError,
    EncryptionFailedError
} from '../services/error/ErrorTypes';

const computeUserToken = (user: any, privateKey: string, expiresIn: number): Promise<string | never> => {
    return new Promise((resolve, reject) => {
        jwt.sign(user, privateKey, { expiresIn: expiresIn + "ms", algorithm: config.algorithm, }, async (err, token) => {
            if (err) {
                reject(new WrongTokenError(err.message));;
            } else {
                resolve(token);
            }
        });
    });
}

import { UserSchema, internalFields } from './UserSchema';

const noninternalFieldsFilter: string = "-" + internalFields.join(" -");

const internalFieldsMap: Map<string, boolean> = new Map();
internalFields.map(x => internalFieldsMap.set(x, true));

const User: Schema = new Schema(UserSchema);

User.statics.userExists = function (filter: any): Promise<boolean> {
    return this.findOne(filter)
        .then((result) => !!result);
};

User.statics.getUser = function (filter: any): Promise<any | never> {
    return this.findOne(filter)
        .then(user => {
            if (user == null) {
                throw new UserNotFound('User not found!');
            }
            return user;
        });
};

User.statics.getUserNonInternalFields = function (filter: any): Promise<any | never> {
    return this.findOne(filter).select(noninternalFieldsFilter).lean()
        .then(user => {
            if (user == null) {
                throw new UserNotFound('User not found!');
            }
            return user;
        });
};

User.statics.createUser = function (data: any): Promise<any | never> {
    let UserModel = model('user', User);
    return PasswordEncryption.hashAndSalt(data.password)
        .then((results) => {
            let user: any = new UserModel();
            Object.keys(data).map(prop => {
                if (prop !== "password") {
                    if (internalFieldsMap.has(prop)) {
                        user[prop] = data[prop];
                    } else {
                        user[prop] = escapeHtml(data[prop]);
                    }
                }
            });
            user.password = results.hash;
            user.passwordSalt = results.salt;
            return user.save();
        }, (err) => {
            throw new EncryptionFailedError("Password encryption failed :" + err)
        });
};

User.statics.isPasswordValid = function (filter: any, password: string): Promise<boolean> {
    let user;
    return this.getUser(filter)
        .then(userFound => {
            user = userFound;
            return PasswordEncryption.hash(password, user.passwordSalt);
        })
        .then(results => {
            return results.hash === user.password;
        });
}

User.statics.sign = async function (filter: any, password: string, privateKey: string): Promise<{ user: any, token: string, expiryDate: Date } | never> {
    const isPasswordValid = await this.isPasswordValid(filter, password);
    if (!isPasswordValid) throw new WrongPasswordError('Wrong credentials!')
    const user = await this.getUserNonInternalFields(filter);
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + config.authTokenExpiryTime);
    const token = await computeUserToken(user, privateKey, config.authTokenExpiryTime);
    return { user, token, expiryDate };
};

User.statics.refreshAuthToken = async function (filter: any, privateKey: string): Promise<{ token: string, expiryDate: Date }> {
    const user = await this.getUserNonInternalFields(filter);
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + config.authTokenExpiryTime);
    const token = await computeUserToken(user, privateKey, config.authTokenExpiryTime);
    return { token, expiryDate };
}

User.statics.verify = function (token: string, publicKey: string): Promise<object | string | never> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, publicKey, { algorithms: [config.algorithm] }, async (err, userDecrypted) => {
            if (err) {
                reject(new WrongTokenError('User not found, please log in!'));
            } else {
                resolve(userDecrypted)
            }
        });
    });
};

User.statics.updateUser = async function (filter: any, data: any): Promise<void | never> {
    if (data.password) {
        try {
            const results = await PasswordEncryption.hashAndSalt(data.password);
            data = {
                ...data,
                password: results.hash,
                passwordSalt: results.salt
            };
        } catch (err) {
            throw new EncryptionFailedError("Password encryption failed :" + err);
        }
    }
    Object.keys(data).map(prop => {
        if (!internalFieldsMap.has(prop)) {
            data[prop] = escapeHtml(data[prop]);
        }
    });
    await this.updateOne(filter, data, { runValidators: true });
};

User.statics.removeUser = function (filter: any): Promise<void> {
    return this.deleteOne(filter);
};

function escapeHtml(unsafe: string): string {
    if (typeof unsafe !== "string") return unsafe;
    else return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


export interface UserModel extends Model<any> {
    userExists(filter: any): Promise<boolean>
    getUser(filter: any): Promise<any | never>
    getUserNonInternalFields(filter: any): Promise<any | never>
    createUser(data: any): Promise<any | never>
    isPasswordValid(filter: any, password: string): Promise<boolean>
    sign(filter: any, password: string, privateKey: string): Promise<{ user: any, token: string, expiryDate: Date } | never>
    refreshAuthToken(filter: any, privateKey: string): Promise<{ token: string, expiryDate: Date }>
    verify(token: string, publicKey: string): Promise<{ user: any } | never>
    updateUser(filter: any, data: any): Promise<void | never>;
    removeUser(filter: any): Promise<void>
}

const UserModel = model<Document, UserModel>("User", User);

export default UserModel;