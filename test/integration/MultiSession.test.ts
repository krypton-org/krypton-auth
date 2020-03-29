import AppTester from '../utils/AppTester';

let appTester;
let request;
let refreshTokenExpiryTime = 20 * 1000

let user1 = {
    email: "test@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "Mrs",
    receiveNewsletter: true
};

let user2 = {
    email: "test2@test.com",
    password: "password2",
    firstName: "firstname2",
    lastName: "lastname2",
    age: 23,
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

const buildRefreshTokenQuery = () => {
    return {
        query: `mutation{
            refreshToken{
                expiryDate
                token
            }
        }`
    }
}

const buildGetMeQuery = () => {
    return {
        query: `query{
            me{
                email
            }
        }`
    }
}

const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));


beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/MultiSession",
        onReady: async () => {
            try {
                request = appTester.getRequestSender();
                await appTester.register(user1);
                await appTester.register(user2);
                await appTester.register(user3);
                done();
            } catch (err) {
                done(err);
            }
        },
        refreshTokenExpiryTime,
    });
}, 40000);

test("User can have 2 sessions", async (done) => {
    // Session 1
    let resLogin1 = await appTester.login(user1.email, user1.password);
    expect(resLogin1.data.login.token).not.toBeUndefined();
    expect(resLogin1.cookies.refreshToken).not.toBeUndefined();
    let token1 = resLogin1.data.login.token;
    let refreshToken1 = resLogin1.cookies.refreshToken;
    // Session 2
    let resLogin2 = await appTester.login(user1.email, user1.password);
    expect(resLogin2.data.login.token).not.toBeUndefined();
    expect(resLogin2.cookies.refreshToken).not.toBeUndefined();
    let token2 = resLogin2.data.login.token;
    let refreshToken2 = resLogin2.cookies.refreshToken;

    // Check sessions are different
    expect(refreshToken1).not.toBe(refreshToken2);
    // Perform authenticated request with session 1
    let resAuth1 = await request.postGraphQL(buildGetMeQuery(), token1, refreshToken1);
    expect(resAuth1.data.me.email).toBe(user1.email);
    // Perform authenticated request with session 2
    let resAuth2 = await request.postGraphQL(buildGetMeQuery(), token2, refreshToken2);
    expect(resAuth2.data.me.email).toBe(user1.email);
    // Update user with session 1
    const query1 = {
        query: `mutation{
            updateMe(fields:{age: ${35}}){
              token
            }
          }`
    }
    let resUpdate1 = await request.postGraphQL(query1, token1, refreshToken1);
    expect(resUpdate1.data.updateMe.token).not.toBeUndefined();
    refreshToken1 = resUpdate1.cookies.refreshToken;
    token1 = resUpdate1.data.updateMe.token;

    // Update user with session 2
    const query2 = {
        query: `mutation{
            updateMe(fields:{gender: M}){
              token
            }
          }`
    }
    let resUpdate2 = await request.postGraphQL(query2, token2, refreshToken2);
    expect(resUpdate2.data.updateMe.token).not.toBeUndefined();
    refreshToken2 = resUpdate2.cookies.refreshToken;
    token2 = resUpdate2.data.updateMe.token;

    await wait(1000);
    // Refresh token with session 1
    let resRefresh1 = await request.postGraphQL(buildRefreshTokenQuery(), null, refreshToken1);
    expect(new Date(resRefresh1.data.refreshToken.expiryDate) > new Date(resLogin1.data.login.expiryDate)).toBeTruthy();

    // Refresh token with session 2
    let resRefresh2 = await request.postGraphQL(buildRefreshTokenQuery(), null, refreshToken2);
    expect(new Date(resRefresh2.data.refreshToken.expiryDate) > new Date(resLogin2.data.login.expiryDate)).toBeTruthy();

    done();
}, 40000);

test("Remove previous session on relog-in", async (done) => {
    const Sessions = require('../../src/model/SessionModel').default;

    // Session 1
    let resLogin1 = await appTester.login(user2.email, user2.password);
    expect(resLogin1.data.login.token).not.toBeUndefined();
    const refreshToken1 = resLogin1.cookies.refreshToken;

    // Session 2 including refresh token of session 1
    let loginQuery = {
        query: `mutation{
        login(email:"${user2.email}" password:"${user2.password}"){
        token
        expiryDate
        user {
            _id
        }
    }}`
    }
    let resLogin2 = await request.postGraphQL(loginQuery, null, refreshToken1);
    expect(resLogin2.data.login.token).not.toBeUndefined();
    expect(resLogin2.data.login.user._id).not.toBeUndefined();

    // Has removed session 1
    const nbSessions = await Sessions.find({userId: resLogin2.data.login.user._id}).count();
    expect(nbSessions).toBe(1);

    done();
}, 40000);

test("Remove outdated session on (re)log-in", async (done) => {
    const Sessions = require('../../src/model/SessionModel').default;

    // Session 1
    let resLogin1 = await appTester.login(user3.email, user3.password);
    expect(resLogin1.data.login.token).not.toBeUndefined();

    // Wait session 1 to be outdated
    await wait(refreshTokenExpiryTime + 500);

    // Re log-in
    let loginQuery = {
        query: `mutation{
        login(email:"${user3.email}" password:"${user3.password}"){
        token
        expiryDate
        user {
            _id
        }
    }}`
    }
    let resLogin2 = await request.postGraphQL(loginQuery);
    expect(resLogin2.data.login.token).not.toBeUndefined();
    expect(resLogin2.data.login.user._id).not.toBeUndefined();

    // Has removed outdated session
    const nbSessions = await Sessions.find({userId: resLogin2.data.login.user._id}).count();
    expect(nbSessions).toBe(1);

    done();
}, 40000);

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);