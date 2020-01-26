/**
 * Holding the service config
 * @module config
 */

import fs from 'fs';
import { Algorithm } from 'jsonwebtoken';
import path from 'path';
import { generateKeys } from './services/crypto/RSAKeysGeneration';

const DEFAULT_PUBLIC_KEY_FILE = path.resolve(__dirname, '../public-key.txt');
const DEFAULT_PRIVATE_KEY_FILE = path.resolve(__dirname, '../private-key.txt');

/**
 * Mongo connection configuration
 */
export interface DBConfig {
    address: string;
    port: string;
    agendaDB: string;
    userDB: string;
}

/**
 * Internal, used in {@link Config#serviceReady}
 */
interface DBReadyStatus {
    isAgendaReady?: boolean;
    isMongooseReady?: boolean;
}

/**
 * Properties to configure GraphQL Auth Service
 */
export interface IConfigProperties {
    algorithm?: Algorithm;
    authTokenExpiryTime?: number;
    dbConfig?: DBConfig;
    emailConfig: any;
    emailNotSentLogFile?: string;
    errorlogFile?: string;
    extendedSchema?: Object;
    graphiql?: boolean;
    hasUsername?: boolean;
    host?: string;
    notificationPageTemplate?: string;
    onReady?: () => void;
    privateKey?: string;
    privateKeyFilePath?: string;
    publicKey?: string;
    publicKeyFilePath?: string;
    refreshTokenExpiryTime?: number;
    resetPasswordEmailTemplate?: string;
    resetPasswordFormTemplate?: string;
    verifyEmailTemplate?: string;
}

export class Config implements IConfigProperties {

    public algorithm = 'RS256' as Algorithm;
    public authTokenExpiryTime = 15 * 60 * 1000;
    public dbConfig = {
        address: 'localhost',
        agendaDB: 'agenda',
        port: '27017',
        userDB: 'users',
    };
    public emailConfig: undefined;
    public emailNotSentLogFile = path.resolve(__dirname, './email-not-sent.log');
    public errorlogFile = path.resolve(__dirname, './errors.log');
    public extendedSchema = {};
    public graphiql = true;
    public hasUsername = true;
    public host = undefined;
    private isAgendaReady: boolean = false;
    private isMongooseReady: boolean = false;
    public notificationPageTemplate = path.resolve(__dirname, './templates/pages/Notification.ejs');
    public onReady = () => console.log('GraphQL-Auth-Service is ready!');
    public privateKey = undefined;
    public privateKeyFilePath = undefined;
    public publicKey = undefined;
    public publicKeyFilePath = undefined;
    public refreshTokenExpiryTime = 7 * 24 * 60 * 60 * 1000;
    public resetPasswordEmailTemplate = path.resolve(__dirname, './templates/emails/ResetPassword.ejs');
    public resetPasswordFormTemplate = path.resolve(__dirname, './templates/forms/ResetPassword.ejs');
    public verifyEmailTemplate = path.resolve(__dirname, './templates/emails/VerifyEmail.ejs');

    /**
     * Called by Mongoose and Agenda when connection established with MongoDB. 
     * When both calls has been made it calls {@link Config#onReady}
     * @param  {DBReadyStatus} status
     * @returns {void}
     */
    public serviceReady = (status: DBReadyStatus): void => {
        if (status.isAgendaReady) { this.isAgendaReady = true; }
        if (status.isMongooseReady) { this.isMongooseReady = true; }
        if (this.isAgendaReady && this.isMongooseReady) { this.onReady(); }
    };

    /**
     * Merging user options and default properties
     * @param  {IConfigProperties} options?
     * @returns {void}
     */
    public merge(options?: IConfigProperties): void {
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
                fs.chmodSync(DEFAULT_PRIVATE_KEY_FILE, 0o400);
                fs.writeFileSync(DEFAULT_PUBLIC_KEY_FILE, publicKey);
                options.publicKey = publicKey;
                options.privateKey = privateKey;
            }
        }

        //Merge taking place here
        Object.keys(options).map(
            function (prop) {
                if (typeof this[prop] === 'object' && typeof options[prop] !== 'string') {
                    this[prop] = {
                        ...this[prop],
                        ...options[prop],
                    };
                } else {
                    this[prop] = options[prop];
                }
            }.bind(this),
        );
    }
}

const config = new Config();

export default config;
