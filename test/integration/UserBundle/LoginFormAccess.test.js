const AppTester = require('../../utils/app-tester.js');
const User = require('../../../bundles/UserspaceBundle/model/UserModel.js');

let appTester;
let request;

let testUser = {
    username: "goldenhaircut", 
    email: "donal.trump@test.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "Don",
    last_name: "Trumpito",
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

describe('Test access to the login form when connected and not connected', () => {
    test('Login form accessible when not connected', (done) => {
        request.get("/login")
        .then((response) => {
            expect(response.statusCode).toBe(200);
            done();
        })
    });

    test('Login form not accessible not connected', (done) => {
        request.post('/register').send(testUser)
        .then((response) => {
            expect(response.header.location).toBe("/login");
            expect(response.statusCode).toBe(302);
            return request.post('/login').send({username: testUser.email, password: testUser.password})
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location.includes("dashboard")).toBeTruthy();
            return request.get('/login');
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
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