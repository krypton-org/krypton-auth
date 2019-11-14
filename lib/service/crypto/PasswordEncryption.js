const crypto = require('crypto');
const SALT_LENGTH = 64; // Length of the salt, in bytes
const HASH_LENGTH = 64; // Length of the hash, in bytes
const HASH_ITERATIONS = 128;

const hashAndSalt = (password) => {
        let salt = crypto.randomBytes(SALT_LENGTH) 
        return hash(password, salt);
};

const hash = (password, salt) => {
    if(typeof salt === "string")
        salt = new Buffer(salt, 'base64');
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, HASH_ITERATIONS, HASH_LENGTH, 'sha512', function(err, hash) {
            if (err) {
                reject(err);
                return;
            }
            resolve({
                salt: salt.toString('base64'),
                hash: hash.toString('base64')
            });
        });
    });
};

module.exports = { hash, hashAndSalt }