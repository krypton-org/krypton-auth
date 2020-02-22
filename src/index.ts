import config, { Config } from './config';
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

export function GraphQLAuthService(properties?: Config): Router {
    if (properties) config.merge(properties);
    const db: typeof MongooseConnection = require('./services/db/db').default;
    const router: Router = require('./router/Router').default;
    db.init();
    return router;
}

export { Config, Address, DBConfig } from './config';