const AppTester = require('../../utils/app-tester.js');
const User = require('../../../bundles/UserspaceBundle/model/UserModel.js');

let appTester;
let request;

let testUser1 = {
    username: "johnsmith", 
    email: "john@smith.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "john",
    last_name: "smith",
    conditions: true
};

let testUser2 = {
    username: 'alicesmith', 
    email: 'alice.smith@test.com', 
    password: "password", 
    confirm_password: "password",
    first_name: "john",
    last_name: "smith",
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


describe('Test login with good credentials', () => {
    test('Register - login -logout ', (done) => {
        request.post('/register').send(testUser1)
        .then((response) => {
            expect(response.header.location).toBe("/login");
            expect(response.statusCode).toBe(302);
            //login with email
            return request.post('/login').send({username: testUser1.email, password: testUser1.password})
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("dashboard")).toBeTruthy();
            return request.get('/logout');
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe('/');
            //login with username
            return request.post('/login').send({username: testUser1.username, password: testUser1.password})
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("dashboard")).toBeTruthy();
            return request.get('/logout');
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe('/');
            return request.get('/dashboard');
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            return request.post('/login').send({username: testUser1.email, password: testUser1.password})
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("dashboard")).toBeTruthy();
            return User.removeUser({email: testUser1.email});
        })
        .then(() => {
            return request.get('/dashboard');
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            done();
        });
    }, 100000);
});

describe('Test login with bad credentials', () => {

    test('Register - login with wrong email - login with wrong password ', (done) => {
        request.post('/register').send(testUser2)
        .then((response) => {
            expect(response.header.location).toBe("/login");
            expect(response.statusCode).toBe(302);
            return request.post('/login').send({username: 'badadress@test.com', password: testUser2.password});
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("login")).toBeTruthy();
            return request.post('/login').send({username: testUser2.email, password: 'badpassword'})
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("login")).toBeTruthy();
            done();
        })
    }, 100000);
});

afterAll((done) =>{
    User.removeUser({email: testUser1.email})
    .then(() => {
        return User.removeUser({email: testUser2.email});
    })
    .then(() => {
        appTester.disconnectDB(done);
    })
});