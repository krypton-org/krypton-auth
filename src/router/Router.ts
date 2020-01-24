import UserController from "../controllers/UserController";
import MiscellaneousController from "../controllers/MiscellaneousController";
import express from 'express';
import ErrorHandler from '../services/error/ErrorHandler';
import UserModel from '../model/UserModel';
import graphqlSchema from '../graphql/Schema';
import fs from 'fs';
import graphqlHTTP from 'express-graphql';
import renderGraphiQL from '../graphiql/renderGraphiQL';
import accepts from 'accepts';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import config from '../config'

const router = express.Router();

router.use(cookieParser())
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(helmet());
router.use(async (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        try {
            const user = await UserModel.verify(bearerToken, config.publicKey);
            req.user = user;
        } catch (err) {
        }
    }
    next();
});
router.use(ErrorHandler);
if (config.graphiql) {
    router.use('/graphql', async (req, res, next) => {
        const params = await (graphqlHTTP as any).getGraphQLParams(req);
        if (!params.raw && accepts(req).types(['json', 'html']) === 'html') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(renderGraphiQL(params));
        }
        else next();
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
    })
);

router.use(function (err, req, res, next) {
    if (config.errorlogFile) fs.appendFile(config.errorlogFile, JSON.stringify(err) + '\n', () => { });
    const notifications = [];
    notifications.push({ type: 'error', message: 'A mistake has happened. Sorry for the inconvenience, we are going to investigate it.' })
    res.json({ notifications: notifications });
});

router.get('/', MiscellaneousController.getIndex);
router.get('/user/email/confirmation', UserController.confirmEmail);
router.get('/form/reset/password', UserController.resetPasswordForm);

export default router;