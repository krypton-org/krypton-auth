const AppTester = require('../../utils/app-tester.js');
const User = require('../../../bundles/UserspaceBundle/model/UserModel.js');

let appTester;
let request;

let testUser = {
    username: "rfa111", 
    email: "rfa111@test.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "John",
    last_name: "Travolta",
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

describe('Test access to the register form when connected and not connected', () => {
    test('Login form accessible when not connected', (done) => {
        request.get("/register")
        .then((response) => {
            expect(response.statusCode).toBe(200);
            done();
        })
    });

    test("Login form not accessible and can't send post request to register a user when connected", (done) => {
        request.post('/register').send(testUser)
        .then((response) => {
            expect(response.header.location).toBe("/login");
            expect(response.statusCode).toBe(302);
            return request.post('/login').send({username: testUser.email, password: testUser.password})
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/dashboard");
            return request.get('/register');
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/dashboard");
            return request.post('/register').send({
                username: "rfa222", 
                email: "rfa222@test", 
                password: "password", 
                confirm_password: "password",
                first_name: "rfaaa",
                last_name: "rfaaa",
                conditions: false
            })
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/dashboard");
            return request.get('/dashboard');
        })
        .then((response) => {
            expect(response.statusCode).toBe(200);
            expect(response.text.includes("To register a new account you need to deconnect yourself")).toBeTruthy();
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