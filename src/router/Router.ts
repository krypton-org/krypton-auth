/**
 * Module returning the Mongoose schema merging the default one with the fields provided by the package user through the `extendedSchema` property.
 * @module router/Router
 */

import accepts from 'accepts';
import bodyParser from 'body-parser';
import { parse } from 'cookie';
import cookieParser from 'cookie-parser';
import express, { Router } from 'express';
import graphqlHTTP from 'express-graphql';
import generateToken from '../crypto/TokenGenerator';
import helmet from 'helmet';
import config from '../config';
import * as UserController from '../controller/UserController';
import renderGraphiQL from '../graphiql/renderGraphiQL';
import graphqlSchema from '../graphql/Schema';
import UserModel from '../model/UserModel';
import ErrorHandler from '../error/ErrorHandler';
import socketIo from 'socket.io';
import { NextFunction, Request, Response } from 'express';
import OperationalError from '../error/ErrorTypes';

const router: Router = express.Router();

router.use(cookieParser());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(helmet());
router.use(async (req, res, next) => {
    const bearerHeader = req.headers.authorization;
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        try {
            const user = await UserModel.verify(bearerToken, config.publicKey);
            req.user = user;
        } catch (err) {
            // Do nothing user has to log-in or refresh his auth token.
        }
    }
    next();
});

router.get('/user/email/confirmation', UserController.confirmEmail);
router.get('/form/reset/password', UserController.resetPasswordForm);

if (config.graphiql) {
    router.use('/', async (req: Request, res: Response, next: NextFunction) => {
        if (!config.io && !config.mailTransporter) {
            // @ts-ignore
            config.io = socketIo(req.socket.server);
            config.clientIdToSocket = new Map<string, SocketIO.Socket>();
            config.io.on('connection', socket => {
                const cookies = parse(socket.handshake.headers.cookie);
                const clientId = cookies.clientId;
                config.clientIdToSocket.set(clientId, socket);
                socket.on('disconnect', () => {
                    if (config.clientIdToSocket.has(clientId)) {
                        config.clientIdToSocket.delete(clientId);
                    }
                });
            });
        }
        if (!req.cookies.clientId) {
            res.cookie('clientId', generateToken(32), { httpOnly: true });
        }
        const params = await (graphqlHTTP as any).getGraphQLParams(req);
        params.query = defaultQuery();
        if (!params.raw && accepts(req).types(['json', 'html']) === 'html') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(renderGraphiQL(params));
        } else {
            next();
        }
    });
}

router.use(
    '/',
    graphqlHTTP(async (req, res) => {
        return {
            context: { req, res },
            graphiql: false,
            schema: graphqlSchema,
            customFormatErrorFn: (err: Error) => {
                // @ts-ignore
                let operationalError = err.originalError;
                if (operationalError instanceof OperationalError) {
                    return {
                        message: operationalError.message,
                        type: operationalError.type,
                        statusCode: operationalError.statusCode,
                    };
                } else {
                    // @ts-ignore
                    err.type = err.constructor.name;
                    return err;
                }
            },
        };
    }),
);

router.use(ErrorHandler);

function defaultQuery() {
    return `# Welcome to GraphQL Auth Service
#
# You can use GraphiQL IDE to test GraphQL queries.
#
# If 'extendedSchema' option is undefined and 'hasUsername' option is NOT set to false:
# Use this query to register.
#
# mutation{
#   register(fields:{username:"yourname", email: "your@mail.com" password:"yourpassword"}){
#     notifications{
#       type
#       message
#     }
#   }
# }
#
# Use this query to log-in.
#
# mutation{
#   login(login: "your@mail.com", password:"yourpassword"){
#     token
#     expiryDate
#   }   
# }
#
# Keyboard shortcuts:
#
#  Prettify Query:  Shift-Ctrl-P (or press the prettify button above)
#
#     Merge Query:  Shift-Ctrl-M (or press the merge button above)
#
#       Run Query:  Ctrl-Enter (or press the play button above)
#
#   Auto Complete:  Ctrl-Space (or just start typing)
#

`;
}

export default router;
