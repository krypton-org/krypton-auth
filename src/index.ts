import config, { IConfigProperties } from './config';
import MongooseConnection from './services/db/db';
import { Router } from 'express';

declare function require(moduleName: string): any;

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
 * @param {IConfigProperties} properties GraphQL Auth Service config
 * @returns {Router}
 * @api public
 */
function GraphQLAuthService(properties: IConfigProperties): Router {
    if (properties) {
        config.merge(properties);
    }
    //Object.freeze(config);
    const db: typeof MongooseConnection = require('./services/db/db').default;
    const router: Router = require('./router/Router').default;
    db.init();
    return router;
}

export default GraphQLAuthService;
