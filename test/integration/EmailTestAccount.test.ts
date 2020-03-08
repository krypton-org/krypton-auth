import AppTester from '../utils/AppTester';
import nodemailer from 'nodemailer';

let appTester;

beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/TestFakeEMailAccount",
        mailTransporter: undefined,
        onReady: async () => {
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
            user: { username: "username" },
        },
        recipient: "test@test.com",
        subject: 'Activate your account',
        template: config.verifyEmailTemplate,
    });
    
    expect(infos.messageId).toBeTruthy();
    expect(nodemailer.getTestMessageUrl(infos)).toBeTruthy();
    done();
}, 20000);

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
            user: { username: "username" },
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