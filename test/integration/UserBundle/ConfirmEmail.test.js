const AppTester = require('../../utils/app-tester.js');
const User = require('../../../bundles/UserspaceBundle/model/UserModel.js');
let appTester;
let request;

let testUser = {
    username: "JohnDoen", 
    email: "john.doen@test.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "John",
    last_name: "Doe",
    conditions: true
};

beforeAll((done) => {

    appTester = new AppTester({useMockAuthentificaiton: false});
    request = appTester.getRequestSender();
    
    test('Email test options pass to global object', (done) => {
        expect(global.userspaceMailOptions).toBeTruthy();
        done();
    });

    appTester.connectDB(done);
});

describe("User can confirm his email and re-ask for the confirmation email", () => {

    test("Test user can't send again the email to confirm his email if not logged in", (done) => {
        request.get("/send_confirmation_email")
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/login");
            done();
        })
    });

    test('Test to resend-confirmation email and to validate email', (done) => {
        let verificationToken;
        request.post('/register').send(testUser)
        .then((response) => {
            expect(response.header.location).toBe("/login");
            expect(response.statusCode).toBe(302);
            return request.post('/login').send({username: testUser.email, password: testUser.password})
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("dashboard")).toBeTruthy();
            return User.getUser({email: testUser.email});
        })
        .then((user) => {
            expect(user).toBeTruthy();
            expect(user.extras.verified).toBeFalsy();
            verificationToken = user.extras.verificationToken;
            expect(verificationToken).toBeTruthy();
            expect(verificationToken.length).toBeGreaterThan(10);
            return request.get("/send_confirmation_email");
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/dashboard");
            return request.get("/dashboard");
        })
        .then((response) => {
            expect(response.statusCode).toBe(200);
            expect(response.text.includes("You will receive a confirmation link at your email address in a few minutes.")).toBeTruthy();
            return request.get("/confirm_email?token="+"wrongtoken");
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/");
            return request.get("/confirm_email?token="+verificationToken);
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/dashboard");
            return request.get("/dashboard");
        })
        .then((response) => {
            expect(response.statusCode).toBe(200);
            expect(response.text.includes("Your email adress is now confirmed")).toBeTruthy();
            return request.get("/confirm_email?token="+verificationToken);
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/"); 
            done();
        });      
    }, 100000);
});

afterAll((done) =>{
    User.removeUser({email: testUser.email})
    .then(() => {
        appTester.disconnectDB(done);
    })
});