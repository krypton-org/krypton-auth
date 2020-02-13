import AppTester from '../utils/AppTester';
import fs from 'fs';
import path from 'path';
let appTester;
let request;

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
        emailConfig: {
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
    });
}, 40000);

const wait = (time) => new Promise<void>((resolve) => setTimeout(resolve, time))

test('Email Logger', async (done) => {
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
    await wait(10000)
    let res = await request.getGraphQL(recoveryEmailQuery);
    fs.readFile(path.resolve(__dirname, '../../email-not-sent.log'), (err, data) => {
        if (err) throw err;
        expect(data.toString().includes("message")).toBeTruthy();
        done()
    });
}, 20000);

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);