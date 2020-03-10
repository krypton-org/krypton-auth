import express from 'express';
import OperationalError from '../../src/error/ErrorTypes';
import ErrorHandler from '../../src/error/ErrorHandler';
import supertest from 'supertest';

test('Catch operationnal errors', async (done) => {
    const app = express();
    const msg = "An error occured!"
    app.get('/', (req, res, next) => { throw new OperationalError(msg) });
    app.use(ErrorHandler);
    const request = supertest(app);
    //@ts-ignore
    let res = await request.get('/');
    const errors = JSON.parse(res.text).notifications;
    expect(errors[0].message).toBe(msg);
    expect(errors[0].type).toBe(OperationalError.constructor.name);
    done();
});