const AppTester = require('../../utils/app-tester.js');
const {EmailNotSentError} = require('../../../bundles/UserspaceBundle/service/error/ErrorTypes')
let appTester;
const UserspaceMailer = require('../../../bundles/UserspaceBundle/service/mailer/UserspaceMailer');
const path = require('path');

beforeAll((done) => {

    appTester = new AppTester({useMockAuthentificaiton: false});
    appTester.connectDB(done);
});

describe("Test EmailNotSentError handling", () => {
    test("Wrong email", async (done) => {
        const params = {
            email: "wrongemail.fr", 
            subject: 'test', 
            template: path.resolve(__dirname,'../../../bundles/UserspaceBundle/views/emails/','confirm_email.ejs'),
            locals: {
                confirmationToken: "truc",
                host: "127.0.0.1"
            },
            error: {
                redirection: '/login',
                flashMessage: {type: "error", message:"Confirmation email not sent, an error has occured."}
            }
        }
        UserspaceMailer.send(params)
        .catch(err => {
            expect(err instanceof EmailNotSentError).toBeTruthy();
            expect(err.redirection).toBe('/login');
            expect(err.flashMessage.type).toBe("error");
            expect(err.flashMessage.message).toBe("Confirmation email not sent, an error has occured.");
            done();
        })
    }, 50000);

    test("Wrong email", async (done) => {
        const params = {
            email: "good@email.com", 
            subject: 'test', 
            template: 'wrong template file',
            locals: {
                confirmationToken: "truc",
                host: "127.0.0.1"
            },
            error: {
                redirection: '/login',
                flashMessage: {type: "error", message:"Confirmation email not sent, an error has occured."}
            }
        }
        UserspaceMailer.send(params)
        .catch(err => {
            expect(err).toBeTruthy();
            expect(err instanceof EmailNotSentError).toBeFalsy();
            done();
        })
    }, 50000);
});

afterAll((done) =>{
    appTester.disconnectDB(done);
});