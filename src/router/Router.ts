/**
 * Module returning the Mongoose schema merging the default one with the fields provided by the package user through the `extendedSchema` property.
 * @module router/Router
 */

import accepts from 'accepts';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import fs from 'fs';
import helmet from 'helmet';
import config from '../config';
import * as MiscellaneousController from '../controllers/MiscellaneousController';
import * as UserController from '../controllers/UserController';
import renderGraphiQL from '../graphiql/renderGraphiQL';
import graphqlSchema from '../graphql/Schema';
import UserModel from '../model/UserModel';
import ErrorHandler from '../services/error/ErrorHandler';
import { Router } from 'express';

const router : Router = express.Router();

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
        } catch (err) {}
    }
    next();
});
router.use(ErrorHandler);
if (config.graphiql) {
    router.use('/graphql', async (req, res, next) => {
        const params = await (graphqlHTTP as any).getGraphQLParams(req);
        params.query = defaultQuery() 
        if (!params.raw && accepts(req).types(['json', 'html']) === 'html') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(renderGraphiQL(params));
        } else {
            next();
        }
    });
}

router.use(
    '/graphql',
    graphqlHTTP(async (req, res) => {
        return {
            schema: graphqlSchema,
            graphiql: false,
            context: { req, res },
        };
    }),
);

router.get('/', MiscellaneousController.getIndex);
router.get('/user/email/confirmation', UserController.confirmEmail);
router.get('/form/reset/password', UserController.resetPasswordForm);

router.use(function(err, req, res, next) {
    config.logger.error(err);
    const notifications = [];
    notifications.push({
        type: 'error',
        message: 'A mistake has happened. Sorry for the inconvenience, we are going to investigate it.',
    });
    res.json({ notifications });
});

function defaultQuery(){ return `# Welcome to GraphiQL
#
# Welcome to GraphQL Auth Service
#
# You can use this GraphiQL IDE to test some GraphQL queries.
#
#
# To register:
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
# To log-in:
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
