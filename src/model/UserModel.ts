/**
 * Module returning the Mongoose model built with the UserSchema importer from {@link module:Model/UserSchema}
 * @module model/UserModel
 */
import jwt from 'jsonwebtoken';
import { Document, model, Model, Schema } from 'mongoose';
import config from '../config';
import * as PasswordEncryption from '../crypto/PasswordEncryption';
import { EncryptionFailedError, TokenEncryptionError, UnauthorizedError, UserNotFoundError } from '../error/ErrorTypes';
import { internalFields, UserSchema } from './UserSchema';

export interface IUserModel extends Model<any> {
    /**
     * Retruns true if a user exists in the database according to `filter`.
     * @param  {any} filter
     * @returns {Promise<boolean>} Promise to the boolean result
     */
    userExists(filter: any): Promise<boolean>;

    /**
     * Fetch user according to `filter`.
     * @throws {UnauthorizedError}
     * @param  {any} filter
     * @returns {Promise<any>} Promise to the user fetched
     */
    getUser(filter: any): Promise<any>;

    /**
     * Return private and public user fields, user selected by `filter`.
     * @throws {UnauthorizedError}
     * @param  {any} filter
     * @returns {Promise<any>}
     */
    getUserNonInternalFields(filter: any): Promise<any>;

    /**
     * Create user from `data`.
     * @throws {EncryptionFailedError} Password encryption failed
     * @param  {any} data
     * @returns {Promise<void>}
     */
    createUser(data: any): Promise<any>;

    /**
     * Returns true if `password` is valid for the user selected by `filter`.
     * @param  {any} filter
     * @param  {string} password
     * @returns {Promise<boolean>} Promise to the result
     */
    isPasswordValid(filter: any, password: string): Promise<boolean>;

    /**
     * Sign-in user selected by `filter`.
     * @throws {UserNotFoundError}
     * @throws {TokenEncryptionError}
     * @param  {any} filter
     * @param  {string} password
     * @param  {string} privateKey
     * @returns {Promise<{ user: any; token: string; expiryDate: Date }>} Promise to the `user` data, authentication `token` and its `expiryDate`
     */
    sign(filter: any, password: string, privateKey: string): Promise<{ user: any; token: string; expiryDate: Date }>;

    /**
     * Returns a new authentication token. Should be called only after checking that user refresh token set on cookies is valid.
     * @throws {TokenEncryptionError}
     * @param  {any} filter
     * @param  {string} privateKey
     * @returns {Promise<{ token: string; expiryDate: Date }>}
     */
    refreshAuthToken(filter: any, privateKey: string): Promise<{ expiryDate: Date; token: string; user: any }>;

    /**
     * Decrypt user authentication token with the `publicKey`. If the operation works, it means that only the private key could issue the token and thus that the user is authentified.
     * Returns the user data decrypted.
     * @throws {UnauthorizedError} - token not valid
     * @param  {string} token
     * @param  {string} publicKey
     * @returns {Promise<object | string>} Promise to the user data decrypted
     */
    verify(token: string, publicKey: string): Promise<object | string>;

    /**
     * @throws {EncryptionFailedError}
     * Update user data selected by `filter`.
     * @param  {any} filter
     * @param  {any} data
     * @returns {Promise<void>}
     */
    updateUser(filter: any, data: any): Promise<void>;

    /**
     * Remove user selected by `filter`.
     * @param  {any} filter
     * @returns {Promise<void>}
     */
    removeUser(filter: any): Promise<void>;
}

/**
 * Compute users JsonWebTokens encoding the `user` data with the `privateKey`. This authentication token will be valid for `expiresIn` number of milliseconds.
 * @throws {TokenEncryptionError}
 * @param  {any} user
 * @param  {string} privateKey
 * @param  {number} expiresIn
 * @returns {Promise<string>} Promise to the token.
 */
const computeUserToken = (user: any, privateKey: string, expiresIn: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        jwt.sign(user, privateKey, { expiresIn: expiresIn + 'ms', algorithm: config.algorithm }, async (err, token) => {
            if (err) {
                reject(new TokenEncryptionError(err.message));
            } else {
                resolve(token);
            }
        });
    });
};

const noninternalFieldsFilter: string = '-' + internalFields.join(' -');

const internalFieldsMap: Map<string, boolean> = new Map();
internalFields.map(x => internalFieldsMap.set(x, true));

const User: Schema = new Schema(UserSchema);

/** @see {@link IUserModel#userExists} */
User.statics.userExists = function(filter: any): Promise<boolean> {
    return this.findOne(filter).then(result => !!result);
};

/** @see {@link IUserModel#getUser} */
User.statics.getUser = function(filter: any): Promise<any> {
    return this.findOne(filter).then(user => {
        if (user == null) {
            throw new UnauthorizedError('User not found.');
        }
        return user;
    });
};

/** @see {@link IUserModel#getUserNonInternalFields} */
User.statics.getUserNonInternalFields = function(filter: any): Promise<any> {
    return this.findOne(filter)
        .select(noninternalFieldsFilter)
        .lean()
        .then(user => {
            if (user == null) {
                throw new UnauthorizedError('User not found.');
            }
            return user;
        });
};

/** @see {@link IUserModel#createUser} */
User.statics.createUser = async function(data: any): Promise<void> {
    const UserInstance = model('user', User);
    return PasswordEncryption.hashAndSalt(data.password).then(
        results => {
            const user: any = new UserInstance();
            Object.keys(data).map(prop => {
                if (prop !== 'password') {
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
        },
        err => {
            throw new EncryptionFailedError('Password encryption failed :' + err);
        },
    );
};
/** @see {@link IUserModel#isPasswordValid} */
User.statics.isPasswordValid = function(filter: any, password: string): Promise<boolean> {
    let user;
    return this.getUser(filter)
        .then(userFound => {
            user = userFound;
            return PasswordEncryption.hash(password, user.passwordSalt);
        })
        .then(results => {
            return results.hash === user.password;
        });
};

/** @see {@link IUserModel#sign} */
User.statics.sign = async function(
    filter: any,
    password: string,
    privateKey: string,
): Promise<{ expiryDate: Date; token: string; user: any }> {
    const isPasswordValid = await this.isPasswordValid(filter, password);
    if (!isPasswordValid) {
        throw new UserNotFoundError('Wrong credentials.');
    }
    const user = await this.getUserNonInternalFields(filter);
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + config.authTokenExpiryTime);
    const token = await computeUserToken(user, privateKey, config.authTokenExpiryTime);
    return { user, token, expiryDate };
};

/** @see {@link IUserModel#refreshAuthToken} */
User.statics.refreshAuthToken = async function(
    filter: any,
    privateKey: string,
): Promise<{ expiryDate: Date; token: string; user: any }> {
    const user = await this.getUserNonInternalFields(filter);
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + config.authTokenExpiryTime);
    const token = await computeUserToken(user, privateKey, config.authTokenExpiryTime);
    return { expiryDate, token, user };
};

/** @see {@link IUserModel#verify} */
User.statics.verify = function(token: string, publicKey: string): Promise<object | string> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, publicKey, { algorithms: [config.algorithm] }, async (err, userDecrypted) => {
            if (err) {
                reject(new UnauthorizedError('User not found, please log in.'));
            } else {
                resolve(userDecrypted);
            }
        });
    });
};

/** @see {@link IUserModel#updateUser} */
User.statics.updateUser = async function(filter: any, data: any): Promise<void> {
    if (data.password) {
        try {
            const results = await PasswordEncryption.hashAndSalt(data.password);
            data = {
                ...data,
                password: results.hash,
                passwordSalt: results.salt,
            };
        } catch (err) {
            throw new EncryptionFailedError('Password encryption failed :' + err);
        }
    }
    Object.keys(data).map(prop => {
        if (!internalFieldsMap.has(prop)) {
            data[prop] = escapeHtml(data[prop]);
        }
    });
    await this.updateOne(filter, data, { runValidators: true });
};

/** @see {@link IUserModel#removeUser} */
User.statics.removeUser = function(filter: any): Promise<void> {
    return this.deleteOne(filter);
};

/**
 * Escape unsafe string from HTML injection to protect users from XSS attacks.
 * @param  {string} unsafe
 * @returns {string} Safe string
 */
function escapeHtml(unsafe: string): string {
    if (typeof unsafe !== 'string') {
        return unsafe;
    } else {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

const UserModel = model<Document, IUserModel>('User', User);

export default UserModel;
