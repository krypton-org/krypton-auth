const AppTester = require('../../utils/app-tester.js');
const User = require('../../../bundles/UserspaceBundle/model/UserModel.js');

let appTester;
let request;

let testUser1 = {
    username: "mutest1", 
    email: "mutest1@test.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "mutest",
    last_name: "mutest",
    conditions: true
};

let testUser2 = {
    username: "mutest2", 
    email: "mutest2@test.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "mutest",
    last_name: "mutest",
    conditions: true
};


let usernameDesired = "mutest3";

beforeAll((done) => { 
    appTester = new AppTester({useMockAuthentificaiton: false});
    request = appTester.getRequestSender();

    test('Email test options pass to global object', (done) => {
        expect(global.userspaceMailOptions).toBeTruthy();
        done();
    });

    appTester.connectDB(done);
});

test('Username modification of a registered user', (done) => {
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
        //Test user can't modify his username if not logged in
        return request.post('/modify-username').send({username: usernameDesired});
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
        //confirm username did not change
        return request.get("/settings");
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes(testUser1.username)).toBeTruthy();
        //Test user can't register a wrong username
        return request.post('/modify-username').send({username: "ufds fdsh fsd "});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes(testUser1.username)).toBeTruthy();
        //Test can't change his username by the same username
        return request.post('/modify-username').send({username: testUser1.username});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes(testUser1.username)).toBeTruthy();
        expect(response.text.includes("This is the same username as the previous one")).toBeTruthy();
        //Test can't register username of another user
        return request.post('/modify-username').send({username: testUser2.username});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes(testUser1.username)).toBeTruthy();
        //Test can modify his username 
        return request.post('/modify-username').send({username: usernameDesired});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        return request.get('/settings');
    })
    .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.includes(usernameDesired)).toBeTruthy();            
        done();
    })
}, 100000);




afterAll((done) =>{    
    User.removeUser({email: testUser1.email})
    .then(() => {
        return User.removeUser({email: testUser2.email});
    })
    .then(() => {
        appTester.disconnectDB(done);
    });
});