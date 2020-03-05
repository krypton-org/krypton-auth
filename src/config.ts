/**
 * Holding the service config
 * @module config
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import { Algorithm } from 'jsonwebtoken';
import { Transporter } from 'nodemailer';
import path from 'path';
import SocketIO from 'socket.io';
import { generateKeys } from './crypto/RSAKeysGeneration';
const DEFAULT_PUBLIC_KEY_FILE = __dirname.includes('node_modules')
    ? path.resolve(__dirname, '../../../public-key.txt')
    : path.resolve(__dirname, '../public-key.txt');
const DEFAULT_PRIVATE_KEY_FILE = __dirname.includes('node_modules')
    ? path.resolve(__dirname, '../../../private-key.txt')
    : path.resolve(__dirname, '../private-key.txt');

/**
 * Internal, used in {@link Config#serviceReady}
 */
interface ReadyStatus {
    isAgendaReady?: boolean;
    isMongooseReady?: boolean;
    isTestEmailReady?: boolean;
}

/**
 * Email adress composed of its name and its email adress: '"Fred Foo" <foo@example.com>'.
 */
export interface Address {
    name: string;
    address: string;
}

/**
 * Properties to configure GraphQL Auth Service
 */
export interface Config {
    algorithm?: Algorithm;
    authTokenExpiryTime?: number;
    dbAddress?: string;
    eventEmitter?: EventEmitter;
    extendedSchema?: object;
    graphiql?: boolean;
    hasUsername?: boolean;
    host?: string;
    mailFrom?: string | Address;
    mailTransporter?: Transporter;
    notificationPageTemplate?: string;
    onReady?: () => any;
    privateKey?: string;
    privateKeyFilePath?: string;
    publicKey?: string;
    publicKeyFilePath?: string;
    refreshTokenExpiryTime?: number;
    resetPasswordEmailTemplate?: string;
    resetPasswordFormTemplate?: string;
    verifyEmailTemplate?: string;
}

export class DefaultConfig implements Config, ReadyStatus {
    public algorithm = 'RS256' as Algorithm;
    public authTokenExpiryTime = 15 * 60 * 1000;
    public dbAddress = 'mongodb://localhost:27017/users';
    public emailConfig: undefined;
    public extendedSchema = {};
    public graphiql = true;
    public hasUsername = true;
    public host = undefined;
    public isAgendaReady: boolean = false;
    public isMongooseReady: boolean = false;
    public isTestEmailReady: boolean = false;
    public mailTransporter: undefined;
    public mailFrom: undefined;
    public notificationPageTemplate = path.resolve(__dirname, '../lib/templates/pages/Notification.ejs');
    public privateKey = undefined;
    public privateKeyFilePath = undefined;
    public publicKey = undefined;
    public publicKeyFilePath = undefined;
    public refreshTokenExpiryTime = 7 * 24 * 60 * 60 * 1000;
    public resetPasswordEmailTemplate = path.resolve(__dirname, '../lib/templates/emails/ResetPassword.ejs');
    public resetPasswordFormTemplate = path.resolve(__dirname, '../lib/templates/forms/ResetPassword.ejs');
    public verifyEmailTemplate = path.resolve(__dirname, '../lib/templates/emails/VerifyEmail.ejs');
    public eventEmitter = undefined;
    public io: SocketIO.Server;
    public clientIdToSocket: Map<string, SocketIO.Socket>

    /**
     * Called by GraphQL Auth Service once it is launched
     */
    public onReady = () => {
        // Something to do
    };

    /**
     * Setting SocketIO server to push email notifications to GraphiQL IDE
     * @param  {SocketIO.Server} io
     * @returns {void}
     */
    public setSocketIO = (io: SocketIO.Server): void => {
        this.io = io;
    }

    /**
     * Called by Mongoose and Agenda when connection established with MongoDB.
     * When both calls has been made it calls {@link Config#onReady}
     * @param  {ReadyStatus} status
     * @returns {void}
     */
    public serviceReady = (status: ReadyStatus): void => {
        if (status.isAgendaReady) {
            this.isAgendaReady = true;
        }
        if (status.isMongooseReady) {
            this.isMongooseReady = true;
        }
        if (status.isTestEmailReady) {
            this.isTestEmailReady = true;
            console.log('Testing email credentials obtained \u2705');
        }
        if (this.isAgendaReady && this.isMongooseReady && (this.mailTransporter || this.isTestEmailReady)) {
            console.log('Connection to MongoDB established \u2705');
            console.log('GraphQL Auth Service is ready \u2705');
            this.onReady();
        }
    };

    /**
     * Called by Mongoose when connection with MongoDB failed.
     * @param  {Error} err
     * @returns {void}
     */
    public dbConnectionFailed = (err: Error): void => {
        console.log('Connection to MongoDB failed \u274C');
        if (config.eventEmitter) {
            config.eventEmitter.emit('error', err);
        }
    };

    /**
     * Merging user options and default properties
     * @param  {Config} options?
     * @returns {void}
     */
    public merge(options?: Config): void {
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

        // Merge taking place here
        Object.keys(options).map(
            function(prop) {
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

        if (!this.hasMongoProtocol(this.dbAddress)) {
            this.dbAddress = 'mongodb://' + this.dbAddress;
        }

        const levels = {
            email: 0,
            error: 1,
        };
    }

    private hasMongoProtocol(url: string): boolean {
        return url.match(/mongodb(?:\+srv)?:\/\/.*/) !== null;
    }
}

/* Exporting an instance of Config that acts like singleton */
const config = new DefaultConfig();

export default config;
