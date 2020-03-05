/**
 * Module defining functions for Public & Private keys generation.
 * @module services/crypto/RSAKeysGeneration
 */

import { generateKeyPairSync } from 'crypto';

/**
 * Generating rsa public and private keys.
 * @returns {{ publicKey: string; privateKey: string }}
 */
const generateKeys = (): { publicKey: string; privateKey: string } => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: {
            format: 'pem',
            type: 'pkcs8',
        },
        publicKeyEncoding: {
            format: 'pem',
            type: 'spki',
        },
    });
    return { publicKey, privateKey };
};

export { generateKeys };
