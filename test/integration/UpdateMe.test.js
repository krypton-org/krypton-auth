const AppTester = require('../utils/AppTester');
const jwt = require('jsonwebtoken');
const config = require('../../lib/config')

let appTester;
let request;
let token
let user = {
    username: "username",
    email: "test@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "M",
    receiveNewsletter: true
};

beforeAll((done) => {
    appTester = new AppTester({
        dbConfig: {
            userDB: "UpdateMeTest"
        },
        onReady: async () => {
            request = appTester.getRequestSender();
            const registerQuery = {
                query: `mutation{
                    register(fields: {
                        username:"${user.username}" 
                        email:"${user.email}" 
                        password:"${user.password}"
                        age:${user.age}
                        receiveNewsletter:${user.receiveNewsletter},
                        gender:${user.gender}
                        firstName:"${user.firstName}" 
                        lastName:"${user.lastName}"}){
                    notifications{
                        type
                        message
                    }
                    }}`
            }
            let res = await request.postGraphQL(registerQuery);
            const loginQuery = {
                query:  `mutation{
                    login(login:"${user.email}" password:"${user.password}"){
                    token
                }}`
            }
            res = await request.postGraphQL(loginQuery);
            if (res.errors) done(res.errors);
            token = res.data.login.token;
            done();
        }
    });
}, 40000);

test('Update usersname - email - password', async (done) => {

    const query = {
        query: `mutation{
            updateMe(fields:{username:"OtherUsername" email: "Otheremail@mail.com" password: "tototototo" previousPassword:"${user.password}"}){
              user{
                username
                verified
                _id
                email
              }
              token
              notifications{
                type
                message
              }
            }
          }`
    }
    let res = await request.postGraphQL(query, token);
    expect(res.data.updateMe.notifications[0].type).toBe("SUCCESS");
    expect(typeof res.data.updateMe.token === "string").toBeTruthy();
    expect(res.data.updateMe.token.length > 10).toBeTruthy();
    expect(res.data.updateMe.user.email).toBe("Otheremail@mail.com");
    expect(res.data.updateMe.user.username).toBe("OtherUsername");

    let loginQuery = {
        query:  `mutation{
            login(login:"${user.email}" password:"${user.password}"){
            token
        }}`
    }
    res = await request.postGraphQL(loginQuery);
    expect(res.errors[0].message.includes("Wrong credentials")).toBeTruthy();

    loginQuery = {
        query:  `mutation{
            login(login:"Otheremail@mail.com" password:"tototototo"){
            token
        }}`
    }
    res = await request.postGraphQL(loginQuery);
    expect(typeof res.data.login.token === "string").toBeTruthy();
    expect(res.data.login.token.length > 10).toBeTruthy();
    jwt.verify(res.data.login.token, config.publicKey, { algorithm: 'RS256' }, async (err, userDecrypted) => {
        if (err) {
            done(new Error('Wrong token'));
        } else {
            expect(typeof userDecrypted._id === "string").toBeTruthy();
            expect(userDecrypted._id.length > 5).toBeTruthy();
            expect(userDecrypted.email).toBe("Otheremail@mail.com");
            expect(userDecrypted.username).toBe("OtherUsername");
            expect(userDecrypted.verified).toBe(false);
            expect(userDecrypted.age).toBe(user.age);
            expect(userDecrypted.receiveNewsletter).toBe(user.receiveNewsletter);
            expect(userDecrypted.gender).toBe(user.gender);
            expect(userDecrypted.firstName).toBe(user.firstName);
            expect(userDecrypted.lastName).toBe(user.lastName);
            done();
        }
    });
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);