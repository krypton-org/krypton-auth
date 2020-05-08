import AppTester from '../utils/AppTester';
import jwt from 'jsonwebtoken';
import config from '../../src/config';

let appTester;
let request;
let token1;
let expiryDate1;
let token2;
let token3;
let token4;
let refreshToken1;
let refreshToken2;
let refreshToken3;
let refreshToken4;
let user1 = {
    email: "test@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "M",
    receiveNewsletter: true
};

let user2 = {
    email: "test2@test.com",
    password: "password2",
    firstName: "firstname2",
    lastName: "lastname2",
    age: 24,
    gender: "Mrs",
    receiveNewsletter: true
};

let user3 = {
    email: "test3@test.com",
    password: "password3",
    firstName: "firstname3",
    lastName: "lastname3",
    age: 24,
    gender: "Mrs",
    receiveNewsletter: true
};

let user4 = {
    email: "test4@test.com",
    password: "password4",
    firstName: "firstname4",
    lastName: "lastname4",
    age: 28,
    gender: "Mrs",
    receiveNewsletter: true
};

let updates = {
    email: "otheremail@mail.com",
    password: "tototototo"
}

const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));


beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/UpdateMeTest",
        onReady: async () => {
            try {
                request = appTester.getRequestSender();
                let res = await appTester.register(user1);
                res = await appTester.register(user2);
                res = await appTester.register(user3);
                res = await appTester.register(user4);
                res = await appTester.login(user1.email, user1.password);
                token1 = res.data.login.token;
                expiryDate1 = new Date(res.data.login.expiryDate);
                refreshToken1 = res.cookies.refreshToken;
                res = await appTester.login(user2.email, user2.password);
                token2 = res.data.login.token;
                refreshToken2 = res.cookies.refreshToken;

                res = await appTester.login(user4.email, user4.password);
                token4 = res.data.login.token;
                refreshToken4 = res.cookies.refreshToken;

                done();
            } catch (err) {
                done(err);
            }
        }
    });
}, 40000);

test('Update usersname - email - password', async (done) => {

    const query = {
        query: `mutation{
            updateMe(fields:{email: "${updates.email}" password: "${updates.password}" previousPassword:"${user1.password}"}){
              token,
              expiryDate
              user{
                email_verified
                _id
                email
              }
            }
          }`
    }
    await wait(1000);
    let res = await request.postGraphQL(query, token1, refreshToken1);
    expect(res.data.updateMe.token).not.toBe(token1);
    expect(new Date(res.data.updateMe.expiryDate).getTime()).toBeGreaterThan(expiryDate1.getTime());
    expect(res.cookies.refreshToken).not.toBe(refreshToken1);
    
    expect(res.data.updateMe.user.email).toBe("otheremail@mail.com");

    res = await appTester.login(user1.email, user1.password)
    expect(res.errors[0].message.includes("Wrong credentials")).toBeTruthy();
    expect(res.errors[0].type).toBe('UserNotFoundError');

    res = await appTester.login(updates.email, updates.password);
    expect(typeof res.data.login.token === "string").toBeTruthy();
    expect(res.data.login.token.length > 10).toBeTruthy();
    token1 = res.data.login.token
    jwt.verify(res.data.login.token, config.publicKey, { algorithms: ['RS256'] }, async (err, userDecrypted: any) => {
        if (err) {
            done(new Error('Wrong token'));
        } else {
            expect(typeof userDecrypted._id === "string").toBeTruthy();
            expect(userDecrypted._id.length > 5).toBeTruthy();
            expect(userDecrypted.email).toBe(updates.email);
            expect(userDecrypted.email_verified).toBe(false);
            expect(userDecrypted.age).toBe(user1.age);
            expect(userDecrypted.receiveNewsletter).toBe(user1.receiveNewsletter);
            expect(userDecrypted.gender).toBe(user1.gender);
            expect(userDecrypted.firstName).toBe(user1.firstName);
            expect(userDecrypted.lastName).toBe(user1.lastName);
            done();
        }
    });
});

test('Wrong previous password', async (done) => {

    const query = {
        query: `mutation{
            updateMe(fields:{password: "newpassword" previousPassword:"wrongpassword"}){
              token
            }
          }`
    }
    let res = await request.postGraphQL(query, token2, refreshToken2);
    expect(res.errors[0].message.includes("Your previous password is wrong!")).toBeTruthy();
    expect(res.errors[0].type).toBe('WrongPasswordError');

    let loginQuery = {
        query: `mutation{
            login(email:"${user2.email}" password:"newpassword"){
            token
        }}`
    }
    res = await request.postGraphQL(loginQuery);
    expect(res.errors[0].message.includes("Wrong credentials")).toBeTruthy();
    expect(res.errors[0].type).toBe('UserNotFoundError');
    done();
});

test('Password too short', async (done) => {

    const query = {
        query: `mutation{
            updateMe(fields:{password: "toto" previousPassword:"${user2.password}"}){
              token
            }
          }`
    }

    let res = await request.postGraphQL(query, token2, refreshToken2);
    expect(res.errors[0].message.includes("The password must contain at least 8 characters")).toBeTruthy();
    expect(res.errors[0].type).toBe('UserValidationError');

    let loginQuery = {
        query: `mutation{
            login(email:"${user2.email}" password:"toto"){
                token
        }}`
    }
    res = await request.postGraphQL(loginQuery);
    expect(res.errors[0].message.includes("Wrong credentials")).toBeTruthy();
    expect(res.errors[0].type).toBe('UserNotFoundError');
    done();
});

test('Email already exists', async (done) => {

    const query = {
        query: `mutation{
            updateMe(fields:{email: "${user2.email}"}){
              token
            }
          }`
    }

    let res = await request.postGraphQL(query, token4, refreshToken4);
    expect(res.errors[0].message.includes("Email already exists")).toBeTruthy();
    expect(res.errors[0].type).toBe('EmailAlreadyExistsError');
    done();
});

test('Wrong gender', async (done) => {

    const query = {
        query: `mutation{
            updateMe(fields:{gender: Mutant}){
              token
            }
          }`
    }
    let res = await request.postGraphQL(query, token4, refreshToken4);
    expect(res.errors[0].message.includes("found Mutant")).toBeTruthy();
    expect(res.errors[0].type).toBe('GraphQLError');
    done();
});

test('Update email of a email_verified user', async (done) => {
    const UserModel = require('../../src/model/UserModel').default;
    await UserModel.updateUser({ email: user3.email }, { email_verified: true });
    let loginRes = await appTester.login(user3.email, user3.password);
    token3 = loginRes.data.login.token;
    refreshToken3 = loginRes.cookies.refreshToken;
    const newEmail = "yoyo@whatever.com";
    const query = {
        query: `mutation{
            updateMe(fields:{email: "${newEmail}"}){
              token
              user{
                email_verified
              }
            }
          }`
    }

    let updateRes = await request.postGraphQL(query, token3, refreshToken3);
    expect(updateRes.data.updateMe.user.email_verified).toBeFalsy();

    done();
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);