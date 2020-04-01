/**
 * Holding the service config
 * @module config
 */

import { EventEmitter } from 'events';
import { Request } from 'express';
import fs from 'fs';
import { Algorithm } from 'jsonwebtoken';
import { Transport } from 'nodemailer';
import path from 'path';
import SocketIO from 'socket.io';
import Url from 'url-parse';
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
 * Properties for configuring Krypton Authentication.
 */
export interface Config {
    /** JSON Web Token signing algorithm. The default value is ``RS256``. */
    algorithm?: Algorithm;
    /**
     * Time until the authentication token expires in milliseconds.
     * The default value is ``15 * 60 * 1000`` (15 minutes).
     * Call the ``refreshToken`` mutation to renew it.
     */
    authTokenExpiryTime?: number;
    /**
     * MongoDB server address.
     * Example: ``mongodb://user:password@host.com:27017/DBname``.
     * The default value is ``mongodb://localhost:27017/users``.
     */
    dbAddress?: string;
    eventEmitter?: EventEmitter;
    /** Custom user model, see :ref:`extended-schema`. */
    extendedSchema?: object;
    /**
     * Enable or disable GraphiQL IDE. The default value is `true`.
     * In the page header, you will find an input field to include your auth token and be able to make authenticated requests.
     *
     * **Note:** Include your auth token directly, no need to precede it with ``Bearer``.
     */
    graphiql?: boolean;
    /**
     * Public URL of the service.
     *
     * **Very important for use in production:** when users receive emails to reset their password or to confirm their account, the links will be pointing to the ``host`` of the service. The default value is ``null``. When ``null``, Krypton Authentication uses the address located in ``req.headers.host`` that can correspond to the machine ``localhost``.
     */
    host?: string;
    /**
     * Sender address displayed in emails sent to users. The default value is ``undefined``.
     * ::
     *     app.use(kryptonAuth({ mailFrom: '"Fred Foo 👻" <foo@example.com>' }));
     *     // or
     *     app.use(kryptonAuth({
     *         mailFrom: {
     *              name: "Fred Foo 👻";
     *              address: "foo@example.com";
     *          }
     *     }));
     */
    mailFrom?: string | Address;
    /**
     * A `Nodemailer configuration <https://nodemailer.com/smtp/#examples>`_ used to send administration emails to users. The default value is ``undefined``.
     * ::
     *    const nodemailerConfig = {
     *         host: "smtp.example.email",
     *         port: 587,
     *         secure: false, // true for 465, false for other ports
     *         auth: {
     *             user: credentials.user,
     *             pass: credentials.pass
     *        }
     *    };
     *
     *    app.use('/auth', kryptonAuth({ nodemailerConfig }));
     *
     * If left ``undefined`` a Nodemailer test account is set automatically. It will print URL links on the command line to let you preview the emails that would have normally been sent.
     * ::
     *     Message sent: <365ea109-f645-e3a1-5e08-48e4c8a37bcb@JohannC>
     *     Preview URL: https://ethereal.email/message/Xklk07cTigz7mlaKXkllHsRk0gyz7kuxAAAAAWLgnFDcJwUFl8MZ-h1shKs
     */
    nodemailerConfig?: any;
    /**
     * The filepath to the `EJS <https://ejs.co/>`_ template file of notification page.
     * This library include a simple one located in `./nodes_module/krypton-auth/lib/templates/pages/Notification.ejs <https://github.com/JohannC/krypton-auth/blob/master/lib/templates/pages/Notification.ejs>`_.
     * You can create another, just gives the file path to the `EJS <https://ejs.co/>`_ file you wish to send. Here are the locals you can use inside the template:
     *
     * * ``notifications``: ``Array`` of ``Object`` notification. Each notification object contains two properties:
     *     * ``type``: ``String Enum`` either equal to ``success`` - ``warning`` - ``error`` - ``info``
     *     * ``message``: ``String`` property containing the notificaiton message
     */
    notificationPageTemplate?: string;
    /**
     * The callback that will be executed when service is launched and ready. The default value is: ``() => console.log("Krypton Authentication is ready.");``.
     */
    onReady?: () => void;
    /**
     * The private key of the service. If both privateKey and privateKeyFilePath are undefined, it will create one under ``your-app/private-key.txt`` all along with the public key. You can retrieve the pair of keys created for re-use afterward.
     */
    privateKey?: string;
    /**
     * The file path to the private key of the service. If both privateKey and privateKeyFilePath are undefined, it will create one under ``your-app/private-key.txt`` all along with the public key. You can retrieve the pair of keys created for re-use afterward.
     */
    privateKeyFilePath?: string;
    /**
     * The public key of the service. If both publicKey and publicKeyFilePath are undefined, it will create one under ``your-app/public-key.txt`` all along with the private key. You can retrieve the pair of keys created for re-use afterward.
     */
    publicKey?: string;
    /**
     * The file path to the public key of the service. If both publicKey and publicKeyFilePath are undefined, it will create one under ``your-app/public-key.txt`` all along with the private key. You can retrieve the pair of keys created for re-use afterward.
     */
    publicKeyFilePath?: string;
    /**
     * The time until the refresh token expires in milliseconds. If a user is inactive during this period he will have to login in order to get a new refresh token. The default value is ``7 * 24 * 60 * 60 * 1000`` (7 days).
     *
     * **Note:** before the refresh token has expired, you can call the :ref:`refreshToken <refresh-authentication-tokens>` mutation. Both the auth token and the refresh token will be renewed and your user won't face any service interruption.
     */
    refreshTokenExpiryTime?: number;
    /**
     * The file path to the `EJS <https://ejs.co/>`_ template file of the email to reset forgotten password.
     * This library include a simple one located in `./nodes_module/krypton-auth/lib/templates/emails/ResetPassword.ejs <https://github.com/JohannC/krypton-auth/blob/master/lib/templates/emails/ResetPassword.ejs>`_.
     * You can create another, just gives the file path to the `EJS <https://ejs.co/>`_ file you wish to send. Here are the locals you can use inside the template:
     *
     * * ``user`` - The current user: ``<p>Hi <%= user.fistName %></p>``
     * * ``link`` - The link to the reset form: ``Click here: <a href="<%= link %>"><%= link %>``
     */
    resetPasswordEmailTemplate?: string;
    /**
     * The file path to the `EJS <https://ejs.co/>`_ template file of the reset password form.
     * This library include a simple one located in `./nodes_module/krypton-auth/lib/templates/forms/ResetPassword.ejs <https://github.com/JohannC/krypton-auth/blob/master/lib/templates/forms/ResetPassword.ejs>`_.
     * You can create another, just gives the file path to the `EJS <https://ejs.co/>`_ file you wish to send.
     * Here are the locals you can use inside the template:
     *
     * * ``link``: The link of the API: ``xhr.open("POST", '<%= link %>')``
     * * ``token``: The reset password token to include in the GraphQL :ref:`resetMyPassword <reset-password>` mutation (example below)
     *
     * ::
     *
     *     const xhr = new XMLHttpRequest();
     *     xhr.responseType = 'json';
     *     xhr.open("POST", '<%= link %>');
     *     xhr.setRequestHeader("Content-Type", "application/json");
     *     const mutation = {
     *         query: `mutation{resetMyPassword(password:"${formData.get("password")}" passwordRecoveryToken:<%= token %>){
     *             notifications{
     *                 type
     *                 message
     *             }
     *          }}`
     *       }
     *     xhr.send(JSON.stringify(mutation));
     */
    resetPasswordFormTemplate?: string;
    /**
     * The filepath to the `EJS <https://ejs.co/>`_ template file of the email to verify user account.
     * This library include a simple one located in `./nodes_module/krypton-auth/lib/templates/emails/VerifyEmail.ejs <https://github.com/JohannC/krypton-auth/blob/master/lib/templates/emails/VerifyEmail.ejs>`_.
     * You can create another, just gives the file path to the `EJS <https://ejs.co/>`_ file you wish to send.
     * Here are the locals you can use inside the template:
     *
     * * ``user`` - The current user: ``<p>Hi <%= user.firstName %></p>``
     * * ``link`` - The verification link: ``Click here: <a href="<%= link %>"><%= link %>``
     */
    verifyEmailTemplate?: string;
}

export class DefaultConfig implements Config, ReadyStatus {
    public algorithm = 'RS256' as Algorithm;
    public authTokenExpiryTime = 15 * 60 * 1000;
    public dbAddress = 'mongodb://localhost:27017/users';
    public emailConfig: undefined;
    public extendedSchema = {};
    public graphiql = true;
    public host = undefined;
    public hostURLObject = undefined;
    public isAgendaReady: boolean = false;
    public isMongooseReady: boolean = false;
    public isTestEmailReady: boolean = false;
    public nodemailerConfig: any;
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
    public clientIdToSocket: Map<string, SocketIO.Socket>;

    /**
     * Called by Krypton Authentication once it is launched
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
    };

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
        if (this.isAgendaReady && this.isMongooseReady && (this.nodemailerConfig || this.isTestEmailReady)) {
            console.log('Connection to MongoDB established \u2705');
            console.log('Krypton Authentication is ready \u2705');
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
     * Returns the complete router adress of Krypton Authentication
     * @param  {Request} req
     * @returns The the complete router of the service
     */
    public getRouterAddress = (req: Request): string => {
        return config.hostURLObject
            ? config.hostURLObject.href + req.baseUrl
            : req.protocol + '://' + req.get('host') + req.baseUrl;
    };

    /**
     * Returns the domain of Krypton Authentication to set the domain parameter into cookies
     * @param  {Request} req
     * @returns The domain of the service
     */
    public getDomainAddress = (): string => {
        return config.hostURLObject ? config.hostURLObject.hostname : null;
    };

    /**
     * Merging user options and default properties
     * @param  {Config} options?
     * @returns {void}
     */
    public merge(options?: Config): void {
        if (options.publicKey === undefined || options.privateKey === undefined) {
            if (options.publicKeyFilePath !== undefined || options.privateKeyFilePath !== undefined) {
                if (fs.existsSync(options.publicKeyFilePath) && fs.existsSync(options.privateKeyFilePath)) {
                    options.publicKey = fs.readFileSync(options.publicKeyFilePath).toString();
                    options.privateKey = fs.readFileSync(options.privateKeyFilePath).toString();
                } else {
                    const { publicKey, privateKey } = this.createAndSaveKeyPair(
                        options.publicKeyFilePath,
                        options.privateKeyFilePath,
                    );
                    options.publicKey = publicKey;
                    options.privateKey = privateKey;
                }
            } else if (fs.existsSync(DEFAULT_PUBLIC_KEY_FILE) && fs.existsSync(DEFAULT_PRIVATE_KEY_FILE)) {
                options.publicKey = fs.readFileSync(DEFAULT_PUBLIC_KEY_FILE).toString();
                options.privateKey = fs.readFileSync(DEFAULT_PRIVATE_KEY_FILE).toString();
            } else {
                const { publicKey, privateKey } = this.createAndSaveKeyPair(
                    DEFAULT_PUBLIC_KEY_FILE,
                    DEFAULT_PRIVATE_KEY_FILE,
                );
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

        this.dbAddress = this.getValidMongoDBUrl(this.dbAddress);

        if (this.host) {
            this.host = this.getValidhttpUrl(this.host);
            this.hostURLObject = Url(this.host);
        }
    }

    /**
     * Creates the public and private key pair and saves them in the file paths provided
     * @private
     * @param {string} publicKeyFilePath
     * @param {string} privateKeyFilePath
     * @returns {{ publicKey: string, privateKey: string }}
     * @memberof DefaultConfig
     */
    private createAndSaveKeyPair(
        publicKeyFilePath: string,
        privateKeyFilePath: string,
    ): { publicKey: string; privateKey: string } {
        const { publicKey, privateKey } = generateKeys();
        fs.writeFileSync(privateKeyFilePath, privateKey);
        fs.writeFileSync(publicKeyFilePath, publicKey);
        return { publicKey, privateKey };
    }

    private getValidMongoDBUrl(url: string): string {
        if (url.match(/mongodb(?:\+srv)?:\/\/.*/) !== null) {
            return url;
        } else {
            return 'mongodb://' + url;
        }
    }

    private getValidhttpUrl(url: string): string {
        url = url.trim().replace(/\s/g, '');

        if (/\/$/.test(url)) {
            url = url.slice(0, -1);
        }

        if (/^(:\/\/)/.test(url)) {
            return `http${url}`;
        }
        if (!/^(f|ht)tps?:\/\//i.test(url)) {
            return `http://${url}`;
        }

        return url;
    }
}

/* Exporting an instance of Config that acts like singleton */
const config = new DefaultConfig();

export default config;
