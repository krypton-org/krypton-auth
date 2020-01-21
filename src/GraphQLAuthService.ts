import fs from 'fs';
import { generateKeys } from './service/crypto/RSAKeysGeneration';
import path from 'path';
import graphqlHTTP from 'express-graphql';
import renderGraphiQL from './graphiql/renderGraphiQL';
import accepts from 'accepts';
import cookieParser from 'cookie-parser';
import serviceConfig, { Config } from './config';
import { Express } from 'express';

import db from './service/db/db';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import Router from './router/Router';
import ErrorHandler from './service/error/ErrorHandler';
import UserModel from './model/UserModel';
import graphqlSchema from './graphql/Schema';

declare global {
    namespace Express {
        export interface Request {
            user: any;
        }
    }
}

const DEFAULT_PUBLIC_KEY_FILE = path.resolve(__dirname, './public-key.txt');
const DEFAULT_PRIVATE_KEY_FILE = path.resolve(__dirname, './private-key.txt');

const config : Config = new DefaultConfig();

/**
 * Mount the GraphQL Auth Service on the Express app passed in argument.
 * @param {Express app} app Express app instance
 * @param {Config} options GraphQL Auth Service config
 * @api public
 */
function mount(app: Express, options: Config): Express {
    if (!options) options = config;

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
    
    Object.keys(options).map(prop => {
        if (typeof (config[prop]) === "object" && typeof (options[prop]) !== "string") {
            config[prop] = {
                ...config[prop], ...options[prop]
            }
        } else {
            config[prop] = options[prop];
        }
    });
    //export config;

    db.init();
    app.use(cookieParser())
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(helmet());
    app.use(async (req, res, next) => {
        const bearerHeader = req.headers['authorization'];
        if (typeof bearerHeader !== 'undefined') {
            const bearer = bearerHeader.split(' ');
            const bearerToken = bearer[1];
            try {
                const user = await UserModel.verify(bearerToken, serviceConfig.publicKey);
                req.user = user;
            } catch (err) {
            }
        }
        next();
    });
    app.use(Router);
    app.use(ErrorHandler);
    if (serviceConfig.graphiql) {
        app.use('/graphql', async (req, res, next) => {
            const params = await (graphqlHTTP as any).getGraphQLParams(req);
            if (!params.raw && accepts(req).types(['json', 'html']) === 'html') {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.send(renderGraphiQL(params));
            }
            else next();
        });
    }

    app.use(
        '/graphql',
        graphqlHTTP(async (req, res) => {
            return {
                schema: graphqlSchema,
                graphiql: false,
                context: { req, res },
            };
        })
    );

    app.use(function (err, req, res, next) {
        if (options.errorlogFile) fs.appendFile(serviceConfig.errorlogFile, JSON.stringify(job.attrs.data) + '\n', () => { });
        const notifications = [];
        notifications.push({ type: 'error', message: 'A mistake has happened. Sorry for the inconvenience, we are going to investigate it.' })
        res.json({ notifications: notifications });
    });

    return app;
};

exports default mount;
