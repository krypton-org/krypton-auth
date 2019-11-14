const AppTester = require('../../utils/app-tester.js');
const User = require('../../../bundles/UserspaceBundle/model/UserModel.js');

let appTester;
let request;

let testUser1 = {
    username: "rihanna", 
    email: "rihanna@test.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "rihanna",
    last_name: "theone",
    conditions: true
};

let testUser2 = {
    username: "Beyonce", 
    email: "beyonce@test.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "beyonce",
    last_name: "runtheworld",
    conditions: true
};

let emailDesired = "rihanna2@test.com";

beforeAll((done) => { 
    appTester = new AppTester({useMockAuthentificaiton: false});
    request = appTester.getRequestSender();

    test('Email test options pass to global object', (done) => {
        expect(global.userspaceMailOptions).toBeTruthy();
        done();
    });

    appTester.connectDB(done);
});

test('Email modification of an user registered', (done) => {
    //register first test user
    request.post('/register').send(testUser1)
    .then((response) => {
        expect(response.header.location).toBe("/login");
        expect(response.statusCode).toBe(302);
        //register second test user
        return request.post('/register').send(testUser2);
    })
    .then((response) => {
        expect(response.header.location).toBe("/login");
        expect(response.statusCode).toBe(302);
        //Test user can't modify his email if not logged in
        return request.post('/modify-email').send({email: emailDesired});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/login");
        //log in with first user
        return request.post('/login').send({username: testUser1.email, password: testUser1.password})
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location.includes("dashboard")).toBeTruthy();
        //confirm email of test user 1
        return User.getUser({email: testUser1.email});
    })
    .then((user) => {
        expect(user).toBeTruthy();
        expect(user.extras.verified).toBeFalsy();
        expect(user.extras.verificationToken).toBeTruthy();
        return request.get("/confirm_email?token="+user.extras.verificationToken);
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location.includes("dashboard")).toBeTruthy();
        //check user email confirmed
        return User.getUser({email: testUser1.email});
    })
    .then((user) => {
        expect(user).toBeTruthy();
        expect(user.extras.verified).toBeTruthy();
        expect(user.extras.verificationToken).toBe(null);
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        //Test user can't register a wrong email
        return request.post('/modify-email').send({email: "wrongemail"});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes(testUser1.email)).toBeTruthy();
        //Test can't change his email by the same email
        return request.post('/modify-email').send({email: testUser1.email});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes(testUser1.email)).toBeTruthy();
        expect(response.text.includes("This is the same email as the previous one")).toBeTruthy();
        //Test can't register email of another user
        return request.post('/modify-email').send({email: testUser2.email});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes(testUser1.email)).toBeTruthy();
        //Test can modify his email 
        return request.post('/modify-email').send({email: emailDesired});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes(emailDesired)).toBeTruthy();
        //test this new email has to be confirmed
        return User.getUser({email: emailDesired});
    })
    .then((user) => {
        expect(user).toBeTruthy();
        expect(user.extras.verified).toBeFalsy();
        expect(user.extras.verificationToken).toBeTruthy();
        //test user can connect with his new email
        return request.get("/logout");            
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/");
        return request.post('/login').send({username: emailDesired, password: testUser1.password})
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location.includes("dashboard")).toBeTruthy();
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);            
        done();
    })
}, 100000);



afterAll((done) =>{    
    User.removeUser({email: emailDesired})
    .then(() => {
        return User.removeUser({email: testUser1.email});
    })
    .then(() => {
        return User.removeUser({email: testUser2.email});
    })
    .then(() => {
        appTester.disconnectDB(done);
    });
});