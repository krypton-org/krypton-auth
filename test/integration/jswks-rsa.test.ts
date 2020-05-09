import express from 'express';
import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import http from 'http';
import supertest from 'supertest';
import AppTester from '../utils/AppTester';


let thirdPartyRequest;
let kryptonRequest;
let token;
let appTester;
const PORT = 14506;
let user = {
    email: "test@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "M",
    receiveNewsletter: true
};

const setJWKSConsumerServer = () => {
    const thirdPartyApp = express();
    thirdPartyApp.use(jwt({
        secret: jwksRsa.expressJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 150,
            jwksUri: 'http://localhost:' + PORT + '/.well-known/jwks.json'
        }),
        algorithms: ['RS256']
    }));
    thirdPartyApp.get('/', (req, res) => {
        return res.json(req.user);
    })
    thirdPartyApp.use(function (err, req, res, next) {
        console.log(err);
    });
    
    thirdPartyRequest = supertest(thirdPartyApp);
}

beforeAll(async (done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/JWK",
        onReady: async () => {
            try {
                setJWKSConsumerServer()
                kryptonRequest = appTester.getRequestSender();
                await appTester.register(user);
                const res = await appTester.login(user.email, user.password);
                token = res.data.login.token;
                done();
            } catch (err) {
                done(err);
            }
        }
    }, PORT);
}, 40000);

test('Authentication on a third party server works with jwks-rsa', async (done) => {
    const res = await thirdPartyRequest.get("/").set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    const user = JSON.parse(res.text);
    expect(user._id).not.toBeUndefined();
    done();
});

test('Krypton sending publickey as a valid JWK endpoint', async (done) => {
    const res = await kryptonRequest.get("/.well-known/jwks.json");
    const jwks = JSON.parse(res.text);
    expect(jwks.keys[0].kty).toBe('RSA');
    expect(jwks.keys[0].n).not.toBeUndefined();
    done();
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);