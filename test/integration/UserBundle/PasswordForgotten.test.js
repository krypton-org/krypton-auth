const AppTester = require('../../utils/app-tester.js');
const User = require('../../../bundles/UserspaceBundle/model/UserModel.js');
let appTester;
let request;

let testUser = {
    username: "kimk", 
    email: "kim.kardashian@test.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "Kim",
    last_name: "Kardashian",
    conditions: true
};

let newPassword = "password2";
let passwordRecoveryToken;

beforeAll((done) => {

    appTester = new AppTester({useMockAuthentificaiton: false});
    request = appTester.getRequestSender();
    
    test('Email test options pass to global object', (done) => {
        expect(global.userspaceMailOptions).toBeTruthy();
        done();
    });

    appTester.connectDB(done);
});

describe('User can reset password forgotten', () => {

    test('Test access to the password reset form', (done) => {
        request.get("/password_reset")
        .then((response) => {
            expect(response.statusCode).toBe(200);
            done();
        })
    });

    test('Test access to the password renew form', (done) => {
        request.get("/password_renew")
        .then((response) => {
            expect(response.statusCode).toBe(200);
            done();
        })
    });
    
    test("Password can not be reseted from unexisting email in the database", (done) => {
        let wrongEmail = "wrong.email@test.com";
        return request.post('/password_reset').send({email: wrongEmail})
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/login");
            return User.userExists({email: wrongEmail});
        })
        .then(exists => {
            expect(exists).toBeFalsy();
            done();
        })
    });

    test('Establishing a new password', (done) => {
        request.post('/register').send(testUser)
        .then((response) => {
            expect(response.header.location).toBe("/login");
            expect(response.statusCode).toBe(302);
            return request.post('/login').send({username: testUser.email, password: testUser.password})
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/dashboard");
            //Test can't ask for reset password if logged in
            return request.post('/password_reset').send({email: testUser.username});

        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/dashboard");
            return request.get('/dashboard');
        })
        .then((response) => {
            expect(response.statusCode).toBe(200);
            expect(response.text.includes('Oups, you are already logged in')).toBeTruthy();
            return request.get('/logout');
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            return request.post('/password_reset').send({email: testUser.username});
        })
        .then((response) => {
            //Test redirection to password reset form if user does not enter a valid email
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("password_reset")).toBeTruthy();
            return request.post('/password_reset').send({email: testUser.email});
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/login");
            return User.getUser({email: testUser.email});
        })
        .then((user) => {
            expect(user).toBeTruthy();
            passwordRecoveryToken = user.extras.passwordRecoveryToken;
            expect(passwordRecoveryToken).toBeTruthy();
            return request.get("/password_renew?token="+passwordRecoveryToken);
        })
        .then((response) => {
            expect(response.statusCode).toBe(200);
            return request.post('/login').send({username: testUser.email, password: testUser.password})
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/dashboard");
            //Test can't change password if logged in
            return request.post("/password_renew").send({password: newPassword, confirm_password: newPassword, token: passwordRecoveryToken});
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/dashboard");
            return request.get('/dashboard');
        })
        .then((response) => {
            expect(response.statusCode).toBe(200);
            expect(response.text.includes('Oups, you are already logged in')).toBeTruthy();
            return request.get('/logout');
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            //Test reject password when user enter two different ones and redirect user to the same form with token included
            return request.post("/password_renew").send({password: newPassword, confirm_password: "differentpassword", token: passwordRecoveryToken});
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("password_renew?token")).toBeTruthy();
            expect(response.header.location.includes(passwordRecoveryToken)).toBeTruthy();
            //Test reject password when user enter a wrong password and redirect user to the same form with token included
            return request.post("/password_renew").send({password: "aa", confirm_password: "aa", token: passwordRecoveryToken});
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("password_renew?token")).toBeTruthy();
            expect(response.header.location.includes(passwordRecoveryToken)).toBeTruthy();
            //Test can change password
            return request.post("/password_renew").send({password: newPassword, confirm_password: newPassword, token: passwordRecoveryToken});
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/login");
            return request.post('/login').send({username: testUser.email, password: newPassword})
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("dashboard")).toBeTruthy();
            return request.get("/password_reset");
        })
        .then((response) => {
            //Can't access to password_reset form when connected
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("dashboard")).toBeTruthy();
            return request.get("/password_renew");
        })
        .then((response) => {
            //Can't access to password_reset form when connected
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("dashboard")).toBeTruthy();
            return request.get("/logout");            
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/");
            done();
        })
    }, 100000);
});

afterAll((done) =>{
    User.removeUser({email: testUser.email})
    .then(() => {
        appTester.disconnectDB(done);
    })
});