/**
 * Express middleware to handle {@link module:error/ErrorTypes.OperationalError} in production when not catched by express-graphql.
 * @module error/ErrorHandler
 */
import { NextFunction, Request, Response } from 'express';
import OperationalError from './ErrorTypes';

/**
 * Express middleware rendering {@link module:error/ErrorTypes.OperationalError} error message to client, avoiding server crash for those king of error.
 * @param  {Error} err
 * @param  {Request} req
 * @param  {Response} res
 * @param  {NextFunction} next
 * @renders JSON object containing the error to display.
 */
export default (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const notifications = [];
    if (err instanceof OperationalError) {
        notifications.push({ type: err.type, message: err.message });
        res.json({ notifications });
    } else {
        next(err);
    }
};
