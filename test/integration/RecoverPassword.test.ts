import AppTester from '../utils/AppTester';
import jwt from 'jsonwebtoken';
import config from '../../lib/config';

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

let user2 = {
    username: "username2",
    email: "test2@test.com",
    password: "password2",
    firstName: "firstname2",
    lastName: "lastname2",
    age: 23,
    gender: "Mrs",
    receiveNewsletter: true
};

let user3 = {
    username: "username3",
    email: "test3@test.com",
    password: "password3",
    firstName: "firstname3",
    lastName: "lastname3",
    age: 23,
    gender: "Mrs",
    receiveNewsletter: true
};

let user4 = {
    username: "username4",
    email: "test4@test.com",
    password: "password4",
    firstName: "firstname4",
    lastName: "lastname4",
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
            try {
                request = appTester.getRequestSender();
                await appTester.register(user);
                await appTester.register(user2);
                await appTester.register(user3);
                await appTester.register(user4);
                const res = await appTester.login(user.email, user.password);
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
    const userRetrieved = await UserModel.getUser({ username: user.username }, { verified: true });
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

test("Wrong token", async (done) => {
    const recoveryEmailQuery = {
        query: `query{
            sendPasswordRecorevyEmail(email: "${user2.email}"){
              notifications{
                type
                message
              }
            }
          }`
    }
    let res = await request.getGraphQL(recoveryEmailQuery);
    expect(res.data.sendPasswordRecorevyEmail.notifications[0].message.includes("If your email address exists in our database, you will receive a password recovery link at your email address in a few minutes")).toBeTruthy();

    let newPassword = "newPassword";
    const updatePasswordQuery = {
        query: `mutation{resetMyPassword(password:"${newPassword}" passwordRecoveryToken:"WRONGTOKEN"){
            notifications{
            type
            message
            }
        }}`
    }

    res = await request.postGraphQL(updatePasswordQuery);
    expect(res.errors[0].message.includes("Unvalid token!")).toBeTruthy();

    res = await appTester.login(user2.email, newPassword);
    expect(res.errors[0].message.includes("Wrong credentials")).toBeTruthy();

    done();
});

test("Password too short", async (done) => {
    const recoveryEmailQuery = {
        query: `query{
            sendPasswordRecorevyEmail(email: "${user3.email}"){
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
    const userRetrieved = await UserModel.getUser({ username: user3.username });
    expect(typeof userRetrieved.passwordRecoveryToken === "string").toBeTruthy();
    expect(userRetrieved.passwordRecoveryToken.length > 10).toBeTruthy();
    const updatePasswordQuery = {
        query: `mutation{resetMyPassword(password:"toto" passwordRecoveryToken:"${userRetrieved.passwordRecoveryToken}"){
            notifications{
            type
            message
            }
        }}`
    }

    res = await request.postGraphQL(updatePasswordQuery);
    expect(res.errors[0].message.includes("The password must contain at least 8 characters")).toBeTruthy();
    done();
});


test("Token too old", async (done) => {
    const recoveryEmailQuery = {
        query: `query{
            sendPasswordRecorevyEmail(email: "${user4.email}"){
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
    const userRetrieved = await UserModel.getUser({ username: user4.username });
    let oldDate = new Date()
    oldDate.setHours(oldDate.getHours() - 2);
    await UserModel.updateUser({ email: user4.email }, { "passwordRecoveryRequestDate": oldDate });

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
    expect(res.errors[0].message.includes("This link has expired, please ask a new one.")).toBeTruthy();
    done();
});

test("Acces reset password form", async (done) => {
    const res = await request.get("/form/reset/password?token=" + "ATOKEN");
    expect(res.statusCode).toBe(200);
    expect(res.text.includes("Reset your password")).toBeTruthy();
    done();
});

test("Can't access reset password form when logged in", async (done) => {
    const res = await request.get("/form/reset/password?token=" + "ATOKEN")
    .set("Authorization", "Bearer " + token).send();
    expect(res.statusCode).toBe(200);
    expect(res.text.includes("Oups, you are already logged in!")).toBeTruthy();
    done();
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);