import AppTester from '../utils/AppTester';
import { EventEmitter } from 'events';
let appTester;
let request;
const eventEmitter = new EventEmitter();

let user = {
    email: "test@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "Mrs",
    receiveNewsletter: true
};

beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/Logger",
        nodemailerConfig: {
            host: 'wrong',
            port: 587,
            auth: {
                user: 'wrong',
                pass: 'wrong'
            }
        },
        onReady: async () => {
            try {
                request = appTester.getRequestSender();
                await appTester.register(user);
                done();
            } catch (err) {
                done(err);
            }
        },
        eventEmitter
    });
}, 40000);

test('Email Error - Event Emitting', async (done) => {
    const recoveryEmailQuery = {
        query: `query{
            sendPasswordRecoveryEmail(email: "${user.email}")
          }`
    }
    eventEmitter.on('email-error', (data) => {
        expect(data.locals.user.email).toBe(user.email);
        expect(data.recipient).toBe(user.email);
        done();
    })
    await request.getGraphQL(recoveryEmailQuery);
}, 20000);

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);