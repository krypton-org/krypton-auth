import AppTester from '../utils/AppTester';
import { parse } from 'cookie';
import ioClient from 'socket.io-client';


let appTester;
let request;
let token
let user = {
    username: "username",
    email: "test@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "M",
    receiveNewsletter: true
};

beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/SendNotification",
        onReady: async () => {
            try{
                request = appTester.getRequestSender();
                await appTester.register(user);
                const res = await appTester.login(user.email, user.password);
                token = res.data.login.token;
                done();
            } catch (err) {
                done(err);
            }
        },
        graphiql: true
    });
}, 40000);

test('Send mock email notification', async (done) => {
    const config = require('../../src/config').default;

    let res = await request.get("/").set("Accept", "text/html");
    expect(res.statusCode).toBe(200);
    expect(res.text.includes("GraphiQLAuthToken")).toBeTruthy();
    expect(config.io).toBeTruthy();
    const cookies = parse(res.headers['set-cookie'][0])
    expect(cookies.clientId).toBeTruthy();
    done();
});


afterAll(async (done) => {
    await appTester.close(done);
}, 40000);