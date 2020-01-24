import path from 'path';
import { generateKeys } from './services/crypto/RSAKeysGeneration';
import fs from 'fs';
import { Algorithm } from 'jsonwebtoken';

const DEFAULT_PUBLIC_KEY_FILE = path.resolve(__dirname, '../public-key.txt');
const DEFAULT_PRIVATE_KEY_FILE = path.resolve(__dirname, '../private-key.txt');

export interface DBConfig {
    address: string,
    port: string,
    agendaDB: string,
    userDB: string
}

interface DBReadyStatus {
    isAgendaReady?: boolean,
    isMongooseReady?: boolean
}

export interface ConfigProperties {
    hasUsername?: boolean,
    dbConfig?: DBConfig
    publicKey?: string,
    publicKeyFilePath?: string,
    privateKey?: string,
    privateKeyFilePath?: string,
    emailNotSentLogFile?: string,
    verifyEmailTemplate?: string,
    resetPasswordEmailTemplate?: string,
    resetPasswordFormTemplate?: string,
    notificationPageTemplate?: string,
    errorlogFile?: string,
    extendedSchema?: Object,
    refreshTokenExpiryTime?: number,
    authTokenExpiryTime?: number,
    algorithm?: Algorithm,
    emailConfig: any;
    graphiql?: boolean,
    host?: string,
    onReady?: () => void
}

export class Config implements ConfigProperties {
    hasUsername = true;
    dbConfig = {
        address: 'localhost',
        port: '27017',
        agendaDB: 'agenda',
        userDB: 'users'
    };
    emailNotSentLogFile = path.resolve(__dirname, './email-not-sent.log');
    verifyEmailTemplate = path.resolve(__dirname, './templates/emails/VerifyEmail.ejs');
    resetPasswordEmailTemplate = path.resolve(__dirname, './templates/emails/ResetPassword.ejs');
    resetPasswordFormTemplate = path.resolve(__dirname, './templates/forms/ResetPassword.ejs');
    notificationPageTemplate = path.resolve(__dirname, './templates/pages/Notification.ejs');
    errorlogFile = path.resolve(__dirname, './errors.log');
    extendedSchema = {};
    refreshTokenExpiryTime = 7 * 24 * 60 * 60 * 1000;
    authTokenExpiryTime = 15 * 60 * 1000;
    algorithm = 'RS256' as Algorithm ;
    graphiql = true;
    publicKey = undefined;
    publicKeyFilePath = undefined;
    privateKey = undefined;
    host = undefined;
    privateKeyFilePath = undefined;
    emailConfig: undefined;
    onReady = () => console.log("GraphQL-Auth-Service is ready!");

    private isAgendaReady: boolean = false;
    private isMongooseReady: boolean = false;
    serviceReady = (status: DBReadyStatus): void => {
        if (status.isAgendaReady) this.isAgendaReady = true;
        if (status.isMongooseReady) this.isMongooseReady = true;
        if (this.isAgendaReady && this.isMongooseReady) this.onReady()
    }

    set(options?: ConfigProperties) {
        if (options.publicKey === undefined || options.privateKey === undefined) {
            if (options.publicKeyFilePath !== undefined || options.privateKeyFilePath !== undefined) {
                options.publicKey = fs.readFileSync(options.publicKeyFilePath).toString();
                options.privateKey = fs.readFileSync(options.privateKeyFilePath).toString();
                // fs.stat(DEFAULT_PRIVATE_KEY_FILE, function (err, stats) { 
                //     if ((0 + 0o077) & stats.mode > 0) console.log(`The permissions of your private key are too open!\nYou should set it 400 (only user read) with chmod!`);
                // });

            } else if (fs.existsSync(DEFAULT_PUBLIC_KEY_FILE) && fs.existsSync(DEFAULT_PRIVATE_KEY_FILE)) {
                options.publicKey = fs.readFileSync(DEFAULT_PUBLIC_KEY_FILE).toString();
                options.privateKey = fs.readFileSync(DEFAULT_PRIVATE_KEY_FILE).toString();
                // fs.stat(DEFAULT_PRIVATE_KEY_FILE, function (err, stats) { 
                //     if ((0 + 0o077) & stats.mode > 0) console.log(`The permissions of your private key are too open!\nYou should set it 400 (only user read) with chmod!`);
                // });
            } else {
                const { publicKey, privateKey } = generateKeys();
                fs.writeFileSync(DEFAULT_PRIVATE_KEY_FILE, privateKey);
                fs.chmodSync(DEFAULT_PRIVATE_KEY_FILE, 0o400)
                fs.writeFileSync(DEFAULT_PUBLIC_KEY_FILE, publicKey);
                options.publicKey = publicKey;
                options.privateKey = privateKey;
            }
        };

        Object.keys(options).map(function(prop){
            if (typeof (this[prop]) === "object" && typeof (options[prop]) !== "string") {
                this[prop] = {
                    ...this[prop], ...options[prop]
                }
            } else {
                this[prop] = options[prop];
            }
        }.bind(this));
    }
};

const config = new Config();

export default config;