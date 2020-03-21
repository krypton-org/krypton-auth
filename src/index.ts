import { Router } from 'express';
import config, { Config } from './config';
import MongooseConnection from './db/db';

declare function require(moduleName: string): any;

declare global {
    namespace Express {
        export interface Request {
            user: any;
        }
    }
}

/**
 * Return Krypton Authentication, an Express Router.
 * @param {Config} properties GraphQL Auth Service config
 * @returns {Router}
 * @api public
 */
export = function(properties?: Config): Router {
    if (!properties) {
        properties = {};
    }
    config.merge(properties);

    const db: typeof MongooseConnection = require('./db/db').default;
    const router: Router = require('./router/Router').default;
    db.init();
    return router;
};
