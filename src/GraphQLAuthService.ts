import { Express } from 'express';
import config, { IConfigProperties } from './config';
import Router from './router/Router';
import MongooseConnection from './services/db/db';

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
 * @api public
 */
function GraphQLAuthService(app: Express, properties: IConfigProperties): Express {
    if (properties){
        config.merge(properties);
    } 
    const db: typeof MongooseConnection = require('./services/db/db').default;
    const router: typeof Router = require('./router/Router').default;
    db.init();
    app.use(router);
    return app;
}

export default GraphQLAuthService;
