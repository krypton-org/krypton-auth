const AppTester = require('../../utils/app-tester.js');
const User = require('../../../bundles/UserspaceBundle/model/UserModel.js');

let appTester;
let request;

let testUser = {
    username: "mfntest1", 
    email: "mfntest1@test.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "mfntest",
    last_name: "mfntest",
    conditions: true
};


let firstNameDesired = "Jojojo";

beforeAll((done) => { 
    appTester = new AppTester({useMockAuthentificaiton: false});
    request = appTester.getRequestSender();

    test('Email test options pass to global object', (done) => {
        expect(global.userspaceMailOptions).toBeTruthy();
        done();
    });

    appTester.connectDB(done);
});

test('First name modification of a registered user', (done) => {
    //register first test user
    request.post('/register').send(testUser)
    .then((response) => {
        expect(response.header.location).toBe("/login");
        expect(response.statusCode).toBe(302);
        //Test user can't modify his first name if not logged in
        return request.post('/modify-firstname').send({first_name: firstNameDesired});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/login");
        //log in with first user
        return request.post('/login').send({username: testUser.email, password: testUser.password})
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location.includes("dashboard")).toBeTruthy();
        //confirm email of test user 1
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes(testUser.first_name)).toBeTruthy();
        //Test user can't modify his first name with a wrong one
        return request.post('/modify-firstname').send({first_name: "818"});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes(testUser.first_name)).toBeTruthy();
        //Test can't change his email by the same first name
        return request.post('/modify-firstname').send({first_name: testUser.first_name});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes(testUser.first_name)).toBeTruthy();
        expect(response.text.includes("This is the same first name as the previous one")).toBeTruthy();
        //Test can modify his first name 
        return request.post('/modify-firstname').send({first_name: firstNameDesired});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes(firstNameDesired)).toBeTruthy();       
        done();
    });
}, 100000);




afterAll((done) =>{    
    User.removeUser({email: testUser.email})
    .then(() => {
        appTester.disconnectDB(done);
    });
});