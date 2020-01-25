import { generateKeyPairSync } from 'crypto';

const generateKeys = (): { publicKey: string; privateKey: string } => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            format: 'pem',
            type: 'spki',
        },
        privateKeyEncoding: {
            format: 'pem',
            type: 'pkcs8',
        },
    });
    return { publicKey, privateKey };
};

export { generateKeys };
