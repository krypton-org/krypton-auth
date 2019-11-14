const AppTester = require('../../utils/app-tester.js');
const User = require('../../../bundles/UserspaceBundle/model/UserModel.js');
let appTester;
let request;

let testUser = {
    username: "MathewH", 
    email: "mathew.hussey@test.com", 
    password: "password", 
    confirm_password: "password",
    first_name: "Mathew",
    last_name: "Hussey",
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


test('Impossible to establish a new password if link expired after 60 minuts', (done) => {
    request.post('/register').send(testUser)
    .then((response) => {
        expect(response.header.location).toBe("/login");
        expect(response.statusCode).toBe(302);
        return request.post('/password_reset').send({email: testUser.email});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/login");
        let oldDate = new Date()
        oldDate.setHours(oldDate.getHours()-1);
        return User.updateUser({email: testUser.email}, {"extras.passwordRecoveryRequestDate":oldDate});
    })
    .then(() => {
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
        return request.post("/password_renew").send({password: newPassword, confirm_password: newPassword, token: passwordRecoveryToken});
    })
    .then((response) => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/password_reset");
        return request.post('/login').send({username: testUser.email, password: testUser.password})
    })
    .then((response) => {
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

afterAll((done) =>{
    User.removeUser({email: testUser.email})
    .then(() => {
        appTester.disconnectDB(done);
    })
});