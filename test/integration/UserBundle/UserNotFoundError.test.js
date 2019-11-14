const AppTester = require('../../utils/app-tester.js');
const User = require('../../../bundles/UserspaceBundle/model/UserModel.js');

let appTester;
let request;

let testUser = {
    username: "usernotfound", 
    email: "usernotfound@test.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "usernot",
    last_name: "found",
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

let desiredEmail = "modifyemail100@test.com"

test('UserNotFound Error to be handled', (done) => {
    //ModifyEmail
    request.post('/register').send(testUser)
    .then((response) => {
        expect(response.header.location).toBe("/login");
        expect(response.statusCode).toBe(302);
        return request.post('/login').send({username: testUser.email, password: testUser.password})
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/dashboard");
        return User.removeUser({email: testUser.email});
    })
    .then(() => {
        return request.post('/modify-email').send({email: desiredEmail});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/login");
        return request.get('/login');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes("User not found"));
        //Modify Username
        return request.post('/register').send(testUser)
    })
    .then((response) => {
        expect(response.header.location).toBe("/login");
        expect(response.statusCode).toBe(302);
        return request.post('/login').send({username: testUser.email, password: testUser.password})
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/dashboard");
        return User.removeUser({email: testUser.email});
    })
    .then(() => {
        return request.post('/modify-username').send({username: "usernotfound11"});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/login");
        return request.get('/login');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes("User not found"));
        //Modify password
        return request.post('/register').send(testUser);
    })
    .then((response) => {
        expect(response.header.location).toBe("/login");
        expect(response.statusCode).toBe(302);
        return request.post('/login').send({username: testUser.email, password: testUser.password})
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/dashboard");
        return User.removeUser({email: testUser.email});
    })
    .then(() => {
        return request.post('/modify-password').send({old_password: testUser.password, password: "password2", confirm_password: "password2"});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/login");
        return request.get('/login');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes("User not found"));
        //Modify first name
        return request.post('/register').send(testUser);
    })
    .then((response) => {
        expect(response.header.location).toBe("/login");
        expect(response.statusCode).toBe(302);
        return request.post('/login').send({username: testUser.email, password: testUser.password})
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/dashboard");
        return User.removeUser({email: testUser.email});
    })
    .then(() => {
        return request.post('/modify-firstname').send({first_name: "newfirstname"});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/login");
        return request.get('/login');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes("User not found"));
        //Modify last name
        return request.post('/register').send(testUser);
    })
    .then((response) => {
        expect(response.header.location).toBe("/login");
        expect(response.statusCode).toBe(302);
        return request.post('/login').send({username: testUser.email, password: testUser.password})
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/dashboard");
        return User.removeUser({email: testUser.email});
    })
    .then(() => {
        return request.post('/modify-lastname').send({last_name: "newlastname"});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/login");
        return request.get('/login');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes("User not found"));
        //Modify Delete account
        return request.post('/register').send(testUser);
    })
    .then((response) => {
        expect(response.header.location).toBe("/login");
        expect(response.statusCode).toBe(302);
        return request.post('/login').send({username: testUser.email, password: testUser.password})
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/dashboard");
        return User.removeUser({email: testUser.email});
    })
    .then(() => {
        return request.post('/delete-account').send({password: testUser.password});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/login");
        return request.get('/login');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes("User not found"));
        //Password forgotten
        return request.post('/register').send(testUser);
    })
    .then((response) => {
        expect(response.header.location).toBe("/login");
        expect(response.statusCode).toBe(302);
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
        return User.removeUser({email: testUser.email});
    })
    .then(() => {
        return request.post("/password_renew").send({password: newPassword, confirm_password: newPassword, token: passwordRecoveryToken});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/login");
        return request.get('/login');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes("User not found"));
        done();
    });
}, 100000);

afterAll((done) =>{    
    User.removeUser({email: testUser.email})
    .then(() => {
        appTester.disconnectDB(done);
    });
});