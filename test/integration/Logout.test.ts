import AppTester from '../utils/AppTester';

let appTester;
let request;
let user = {
    email: "test@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "M",
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

const buildLogoutQuery = () => {
    return {
        query: `mutation{
            logout
          }`
    }
}

beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/LogoutTest",
        onReady: async () => {
            try{
                request = appTester.getRequestSender();
                await appTester.register(user);
                done();
            } catch (err) {
                done(err);
            }
        }
    });
}, 40000);

test('Can actually log-out', async (done) => {
    let res = await appTester.login(user.email, user.password);
    const refreshToken = res.cookies.refreshToken;
    const token = res.data.login.token;
    res = await request.postGraphQL(buildLogoutQuery(), token, refreshToken);
    expect(res.data.logout).toBeTruthy();
    let resRefresh = await request.postGraphQL(buildRefreshTokenQuery(), token, refreshToken);
    expect(resRefresh.errors[0].type).toBe('UnauthorizedError');
    done();
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);