import AppTester from '../utils/AppTester';
import nodemailer from 'nodemailer';
import { parse } from 'cookie';

let appTester;
let request;

beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/TestFakeEMailAccount",
        mailTransporter: undefined,
        onReady: async () => {
            request = appTester.getRequestSender();
            done();
        }
    });
}, 40000);

const wait = (time) => new Promise<void>((resolve) => setTimeout(resolve, time))

test('Nodemailer send preview link with a test account', async (done) => {
    const send = require('../../src/mailer/Mailer').default;
    const config = require('../../src/config').default;
    await wait(10000);
    const infos = await send({
        locals: {
            link: "test",
            user: { firstName: "name" },
        },
        recipient: "test@test.com",
        subject: 'Activate your account',
        template: config.verifyEmailTemplate,
    });
    
    expect(infos.messageId).toBeTruthy();
    expect(nodemailer.getTestMessageUrl(infos)).toBeTruthy();
    done();
}, 20000);

test('Start IO Server to send mock email notification', async (done) => {
    const config = require('../../src/config').default;
    let res = await request.get("/").set("Accept", "text/html");
    expect(res.statusCode).toBe(200);
    expect(res.text.includes("GraphiQLAuthToken")).toBeTruthy();
    expect(config.io).toBeTruthy();
    const cookies = parse(res.headers['set-cookie'][0])
    expect(cookies.clientId).toBeTruthy();
    done();
});

test('Prints preview link on the command line', async (done) => {
    const agenda = require('../../src/agenda/agenda').default;
    const config = require('../../src/config').default;
    await wait(10000);
    let outputData = "";
    const storeLog = inputs => (outputData += inputs);
    const originalLoggerFct = console["log"]
    console["log"] = jest.fn(storeLog);
    agenda.now('email', {
        locals: {
            link: "test",
            user: { firstName: "John" },
        },
        recipient: "test@test.com",
        subject: 'Activate your account',
        template: config.verifyEmailTemplate,
    });
    await wait(15000);
    expect(outputData.includes("Preview URL")).toBeTruthy();
    outputData = "";
    agenda.now('email', {
        locals: {
        },
        recipient: "test@test.com",
        subject: 'Activate your account',
        template: config.verifyEmailTemplate,
    });
    await wait(15000);
    console["log"] = originalLoggerFct
    expect(outputData.includes("Preview URL")).toBeFalsy();
    done();
}, 70000);


afterAll(async (done) => {
    await appTester.close(done);
}, 40000);