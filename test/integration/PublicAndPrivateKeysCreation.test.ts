import defaultConfig, { Properties } from '../../src/config';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const access = promisify(fs.access);
const readFile = promisify(fs.readFile);
const deleteFile = promisify(fs.unlink);

const DEFAULT_PUBLIC_KEY_FILE_PATH = path.resolve(__dirname, '../../public-key.txt');
const DEFAULT_PRIVATE_KEY_FILE_PATH = path.resolve(__dirname, '../../private-key.txt');

test('Create, save and reuse public & private key pair in default file location', async (done) => {
    //Cleaning files
    try {
        await deleteFile(DEFAULT_PUBLIC_KEY_FILE_PATH);
        await deleteFile(DEFAULT_PRIVATE_KEY_FILE_PATH);
    } catch (err) {
        //File already deleted
    }

    //Config with no privateKeyFilePath & prublicKeyFilePath shouls create them in their default location
    const properties: Properties = {
    }
    defaultConfig.set(properties);
    expect(await access(DEFAULT_PUBLIC_KEY_FILE_PATH, fs.constants.F_OK)).toBeUndefined();
    expect(await access(DEFAULT_PRIVATE_KEY_FILE_PATH, fs.constants.F_OK)).toBeUndefined();

    const publicKey = fs.readFileSync(DEFAULT_PUBLIC_KEY_FILE_PATH).toString();
    const privateKey = fs.readFileSync(DEFAULT_PRIVATE_KEY_FILE_PATH).toString();

    //Config with no privateKeyFilePath & prublicKeyFilePath shouls reuse them if already present
    defaultConfig.set(properties);
    expect(await access(DEFAULT_PUBLIC_KEY_FILE_PATH, fs.constants.F_OK)).toBeUndefined();
    expect(await access(DEFAULT_PRIVATE_KEY_FILE_PATH, fs.constants.F_OK)).toBeUndefined();
    expect(fs.readFileSync(DEFAULT_PUBLIC_KEY_FILE_PATH).toString()).toBe(publicKey);
    expect(fs.readFileSync(DEFAULT_PRIVATE_KEY_FILE_PATH).toString()).toBe(privateKey);

    //Cleaning files
    await deleteFile(DEFAULT_PUBLIC_KEY_FILE_PATH);
    await deleteFile(DEFAULT_PRIVATE_KEY_FILE_PATH);
    done();
});

test('Create, save and reuse public & private key pair in file location provided', async (done) => {
    const properties: Properties = {
        publicKeyFilePath: path.resolve(__dirname, '../../not-the-default-file-path-public-key.txt'),
        privateKeyFilePath: path.resolve(__dirname, '../../not-the-default-file-path-private-key.txt')
    }

    //Cleaning files
    try {
        await deleteFile(properties.publicKeyFilePath);
        await deleteFile(properties.privateKeyFilePath);
    } catch (err) {
        //File already deleted
    }

    //Shouls create public & private keys in the location set in properties
    defaultConfig.set(properties)
    expect(await access(properties.publicKeyFilePath, fs.constants.F_OK)).toBeUndefined();
    expect(await access(properties.privateKeyFilePath, fs.constants.F_OK)).toBeUndefined();
    const publicKey = fs.readFileSync(properties.publicKeyFilePath).toString();
    const privateKey = fs.readFileSync(properties.privateKeyFilePath).toString();

    //Shouls reuse public & private keys in the location set in properties
    defaultConfig.set({})
    expect(await access(properties.publicKeyFilePath, fs.constants.F_OK)).toBeUndefined();
    expect(await access(properties.privateKeyFilePath, fs.constants.F_OK)).toBeUndefined();
    expect(fs.readFileSync(properties.publicKeyFilePath).toString()).toBe(publicKey);
    expect(fs.readFileSync(properties.privateKeyFilePath).toString()).toBe(privateKey);

    //Cleaning files
    await deleteFile(properties.publicKeyFilePath);
    await deleteFile(properties.privateKeyFilePath);
    done();
});

test('Use  public & private key pair provided directly in option', async (done) => {
    const properties: Properties = {
        privateKey: 'privatekeytest',
        publicKey: 'publickeytest'
    }
    defaultConfig.set(properties)
    expect(defaultConfig.privateKey).toBe(properties.privateKey);
    expect(defaultConfig.publicKey).toBe(properties.publicKey);
    done();
});