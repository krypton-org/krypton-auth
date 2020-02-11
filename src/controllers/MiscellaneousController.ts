/**
 * Serving service index page.
 * @module controllers/MiscellaneousController
 */

import { NextFunction, Request, Response } from 'express';

/**
 * Returning the index page
 * @param  {Request} req
 * @param  {Response} res
 * @param  {NextFunction} next
 * @renders index page
 */
export const getIndex = (req: Request, res: Response, next: NextFunction): void => {
    const notifications = [];
    notifications.push({ type: 'success', message: 'Welcome to GraphQL Auth Service' });
    res.json({ notifications });
};
