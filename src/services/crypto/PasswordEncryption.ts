/**
 * Module defining functions for password encryption.
 * @module services/crypto/PasswordEncryption
 */

import crypto from 'crypto';
const SALT_LENGTH = 64; // Length of the salt, in bytes
const HASH_LENGTH = 64; // Length of the hash, in bytes
const HASH_ITERATIONS = 128;

/**
 * Function generating random salt, destinated to encrypt the `password`. Returning the encrypted `password` hash and salt.
 * @param  {string} password
 * @returns {Promise<{ salt: string; hash: string }>} Promise to the password encrypted hash and salt
 */
export const hashAndSalt = (password: string): Promise<{ salt: string; hash: string }> => {
    const salt = crypto.randomBytes(SALT_LENGTH);
    return hash(password, salt);
};

/**
 * Encrypting `password` with the given `salt`. Returning hash and salt.
 * @param  {string} password
 * @param  {Buffer} salt
 * @returns {Promise<{ salt: string; hash: string }>} Promise to the password encrypted hash and salt
 */
export const hash = (password: string, salt: Buffer): Promise<{ salt: string; hash: string }> => {
    if (typeof salt === 'string') {
        salt = new Buffer(salt, 'base64');
    }
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, HASH_ITERATIONS, HASH_LENGTH, 'sha512', function(err, hash) {
            if (err) {
                reject(err);
                return;
            }
            resolve({
                salt: salt.toString('base64'),
                hash: hash.toString('base64'),
            });
        });
    });
};
