import { generateKeyPairSync } from 'crypto';

const generateKeys = (): { publicKey: string, privateKey: string } => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        }
    });
    return { publicKey, privateKey };
}

export { generateKeys };