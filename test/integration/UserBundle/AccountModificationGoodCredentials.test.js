const AppTester = require('../../utils/app-tester.js');
const User = require('../../../bundles/UserspaceBundle/model/UserModel.js');

let appTester;
let request;

let testUser = {
    username: "bobsmith", 
    email: "bob@smith.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "bob",
    last_name: "smith",
    conditions: true
};

let testUserDesired1 = {
    username: "bobbysmith", 
    email: "bobby@smith.com", 
    password: "password2", 
    first_name: "bobby",
    last_name: "smoothy",
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

describe('Test account modification with bad credentials', () => {  
    test('Modify : username - email - password - firstname - lastname  ', (done) => {
        testUser.email = testUserDesired1.email;
        request.post('/register').send(testUser)
        .then((response) => {
            expect(response.header.location).toBe("/login");
            expect(response.statusCode).toBe(302);
            return request.post('/login').send({username: testUser.email, password: testUser.password})
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("dashboard")).toBeTruthy();
            return request.get('/settings');
        })
        .then((response) => {
            expect(response.statusCode).toBe(200);
            return request.post('/modify-username').send({username: testUserDesired1.username});
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            return request.post('/modify-email').send({email: testUserDesired1.email});
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            return request.post('/modify-firstname').send({first_name: testUserDesired1.first_name});
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            return request.post('/modify-lastname').send({last_name: testUserDesired1.last_name});
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            return request.get('/settings');
        })
        .then((response) => {
            expect(response.statusCode).toBe(200);
            expect(response.text.includes(testUserDesired1.username)).toBeTruthy();
            expect(response.text.includes(testUserDesired1.email)).toBeTruthy();
            expect(response.text.includes(testUserDesired1.first_name)).toBeTruthy();
            expect(response.text.includes(testUserDesired1.last_name)).toBeTruthy();
            userToDelete = testUser.email;
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