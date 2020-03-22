import AppTester from '../utils/AppTester';

let appTester;
let request;
let token1;

let user1 = {
    username: "username",
    email: "test@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "M",
    receiveNewsletter: true
};

const buildGetMeQuery = () => {
    return {
        query: `query{
            me{
                username
                email
            }
        }`
    }
}


beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/GetCurrentUserData",
        onReady: async () => {
            try {
                request = appTester.getRequestSender();
                let res = await appTester.register(user1);
                
                res = await appTester.login(user1.email, user1.password);
                token1 = res.data.login.token;

                done();
            } catch (err) {
                done(err);
            }
        }
    });
});

test('Get current user data', async (done) => {

    let res = await request.postGraphQL(buildGetMeQuery(), token1);

    expect(res.data.me.username).toBe(user1.username);
    expect(res.data.me.email).toBe(user1.email);

    done();
});

test('Wrong token', async (done) => {

    let res = await request.postGraphQL(buildGetMeQuery());

    expect(res.errors[0].type).toBe('UserNotFound');

    done();
});


afterAll(async (done) => {
    await appTester.close(done);
}, 40000);