import config, { ConfigProperties } from './config';
import { Express } from 'express';

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
async function GraphQLAuthService(app: Express, properties: ConfigProperties): Promise<void> {
    if (properties) config.set(properties);
    const db: any = await import('./service/db/db');
    const Router: any = await import('./router/Router');
    db.init();
    app.use(Router);
};

export default GraphQLAuthService;
