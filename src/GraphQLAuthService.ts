declare function require(moduleName: string): any;
import config, { ConfigProperties } from './config';
import { Express } from 'express';
import MongooseConnection from "./services/db/db";
import Router from "./router/Router";


declare global {
    namespace Express {
        export interface Request {
            user: any;
        }
    }
}

/**
 * Mount GraphQL Auth Service on the Express app passed and configure it with properties.
 * @param {Express app} app Express app instance
 * @param {ConfigProperties} properties GraphQL Auth Service config
 * @api public
 */
function GraphQLAuthService(app: Express, properties: ConfigProperties): Express {
    if (properties) config.set(properties);
    const db: typeof MongooseConnection = require('./services/db/db').default;
    const router : typeof Router = require('./router/Router').default;
    db.init();
    app.use(router);
    return app
};

export default GraphQLAuthService;
