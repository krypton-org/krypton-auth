const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config')
const Schema = mongoose.Schema;
const PasswordEncryption = require('../service/crypto/PasswordEncryption');
const {
    UserNotFound,
    WrongPasswordError,
    WrongTokenError,
    EncryptionFailedError
} = require('../service/error/ErrorTypes');

const computeUserToken = (user, privateKey, expiresIn) => {
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

const { UserSchema, internalFields } = require('./UserSchema');

const noninternalFieldsFilter = "-" + internalFields.join(" -");

const internalFieldsMap = new Map();
internalFields.map(x => internalFieldsMap.set(x, true));

const User = new Schema(UserSchema);

User.statics.userExists = function (filter) {
    return this.findOne(filter)
        .then((result) => !!result);
};

User.statics.getUser = function (filter) {
    return this.findOne(filter)
        .then(user => {
            if (user == null) {
                throw new UserNotFound('User not found!');
            }
            return user;
        });
};

User.statics.getUserNonInternalFields = function (filter) {
    return this.findOne(filter).select(noninternalFieldsFilter).lean()
        .then(user => {
            if (user == null) {
                throw new UserNotFound('User not found!');
            }
            return user;
        });
};

User.statics.createUser = function (data) {
    let UserModel = new mongoose.model('user', User);
    return PasswordEncryption.hashAndSalt(data.password)
        .then((results) => {
            let user = new UserModel();
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

User.statics.isPasswordValid = function (filter, password) {
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

User.statics.sign = async function (filter, password, privateKey) {
    const isPasswordValid = await this.isPasswordValid(filter, password);
    if (!isPasswordValid) throw new WrongPasswordError('Wrong credentials!')
    const user = await this.getUserNonInternalFields(filter);
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + config.authTokenExpiryTime);
    const token = await computeUserToken(user, privateKey, config.authTokenExpiryTime);
    return { user, token, expiryDate };
};

User.statics.refreshAuthToken = async function (filter, privateKey) {
    const user = await this.getUserNonInternalFields(filter);
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + config.authTokenExpiryTime);
    const token = await computeUserToken(user, privateKey, config.authTokenExpiryTime);
    return { token, expiryDate };
}

User.statics.verify = function (token, publicKey) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, publicKey, { algorithm: config.algorithm }, async (err, userDecrypted) => {
            if (err) {
                reject(new WrongTokenError('User not found, please log in!'));
            } else {
                resolve(userDecrypted)
            }
        });
    });
};

User.statics.updateUser = async function (filter, data) {
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

User.statics.removeUser = function (filter) {
    return this.deleteOne(filter);
};

function escapeHtml(unsafe) {
    if (typeof unsafe !== "string") return unsafe;
    else return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

module.exports = mongoose.model('user', User);