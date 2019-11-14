const AppTester = require('../../utils/app-tester.js');
const User = require('../../../bundles/UserspaceBundle/model/UserModel.js');

let testUser = {
    username: "snoopdogg", 
    email: "snoop@dogg.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "Snoop",
    last_name: "Dogg",
    conditions: true
};

let badInputs = {
    username: "s$$,;", 
    email: "snoopdogg.com", 
    first_name: "$",
    last_name: "55",
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
            return request.post('/modify-username').send({username: badInputs.username});
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            return request.post('/modify-email').send({email: badInputs.email});
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            return request.post('/modify-firstname').send({first_name: badInputs.first_name});
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            return request.get('/settings');
        })
        .then((response) => {
            expect(response.statusCode).toBe(200);
            expect(response.text.includes(testUser.username)).toBeTruthy();
            expect(response.text.includes(testUser.email)).toBeTruthy();
            expect(response.text.includes(testUser.first_name)).toBeTruthy();
            expect(response.text.includes(testUser.last_name)).toBeTruthy();
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
