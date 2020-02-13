import AppTester from '../utils/AppTester';
import nodemailer from 'nodemailer';

let appTester;

beforeAll((done) => {
    appTester = new AppTester({
        dbConfig: {
            userDB: "TestFakeEMailAccount",
        },
        emailConfig: undefined,
        onReady: async () => {
            done();
        }
    });
}, 40000);

const wait = (time) => new Promise<void>((resolve) => setTimeout(resolve, time))

test('Update email of a verified user', async (done) => {
    const Mailer = require('../../src/services/mailer/Mailer').default;
    const config = require('../../src/config').default;
    await wait(10000)
    const infos = await Mailer.send({
        locals: {
            link: test,
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

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);