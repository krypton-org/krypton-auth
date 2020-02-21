import AppTester from '../utils/AppTester';
import EventEmitter from 'events'
let appTester;
let request;
const eventEmitter = new EventEmitter();

let user = {
    username: "username",
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
        dbConfig: {
            userDB: "Logger",
        },
        mailTransporter: {
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
            sendPasswordRecorevyEmail(email: "${user.email}"){
              notifications{
                type
                message
              }
            }
          }`
    }
    eventEmitter.on('email-error', (data) => {
        expect(data.locals.user.username).toBe(user.username);
        expect(data.recipient).toBe(user.email);
        done();
    })
    await request.getGraphQL(recoveryEmailQuery);
}, 20000);

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);