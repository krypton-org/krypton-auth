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
    gender: "Mrs",
    receiveNewsletter: true
};

beforeAll((done) => {
    appTester = new AppTester({
        dbConfig: {
            userDB: "RecoverTest"
        },
        onReady: async () => {
            try{
                request = appTester.getRequestSender();
                await appTester.register(user);
                res = await appTester.login(user.email, user.password);
                token = res.data.login.token;
                done();
            } catch (err) {
                done(err);
            }
        }
    });
}, 40000);

test("Can't get recovery pawwsord when logged in", async (done) => {
    const query = {
        query: `query{
            sendPasswordRecorevyEmail(email: "${user.email}"){
              notifications{
                type
                message
              }
            }
          }`
    }
    let res = await request.getGraphQL(query, token);
    expect(res.errors[0].message.includes("Oups, you are already logged in")).toBeTruthy();
    done()
});

test("Ask password recovery for unknown email address", async (done) => {
    const query = {
        query: `query{
            sendPasswordRecorevyEmail(email: "unknown@email.com"){
              notifications{
                type
                message
              }
            }
          }`
    }
    let res = await request.getGraphQL(query);
    expect(res.data.sendPasswordRecorevyEmail.notifications[0].message.includes("If your email address exists in our database, you will receive a password recovery link at your email address in a few minutes")).toBeTruthy();
    done();
});

test("Change password with recorevy token", async (done) => {
    const recoveryEmailQuery = {
        query: `query{
            sendPasswordRecorevyEmail(email: "${user.email}"){
              notifications{
                type
                message
              }
            }
          }`
    }
    let res = await request.getGraphQL(recoveryEmailQuery);
    expect(res.data.sendPasswordRecorevyEmail.notifications[0].message.includes("If your email address exists in our database, you will receive a password recovery link at your email address in a few minutes")).toBeTruthy();
    const UserModel = require('../../lib/model/UserModel');
    const userRetrieved = await UserModel.getUser({username: user.username}, {verified: true});
    expect(typeof userRetrieved.passwordRecoveryToken === "string").toBeTruthy();
    expect(userRetrieved.passwordRecoveryToken.length > 10).toBeTruthy();
    let newPassword = "newPassword"; 
    const updatePasswordQuery = {
        query: `mutation{resetMyPassword(password:"${newPassword}" passwordRecoveryToken:"${userRetrieved.passwordRecoveryToken}"){
            notifications{
            type
            message
            }
        }}`
    }

    res = await request.postGraphQL(updatePasswordQuery);
    expect(res.data.resetMyPassword.notifications[0].message.includes("Your password is updated")).toBeTruthy();

    res = await appTester.login(user.email, user.password);
    expect(res.errors[0].message.includes("Wrong credentials")).toBeTruthy();

    res = await appTester.login(user.email, newPassword);
    expect(typeof res.data.login.token === "string").toBeTruthy();
    expect(res.data.login.token.length > 10).toBeTruthy();
    done();

});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);