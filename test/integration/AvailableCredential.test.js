const AppTester = require('../utils/AppTester');

let appTester;
let request;

let user1 = {
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

buildUsernameAvailableQuery = (username) => {
    return {
        query: `query{
            usernameAvailable(username:"${username}"){
            isAvailable
            }
        }`
    }
}

buildEmailAvailableQuery = (email) => {
    return {
        query: `query{
            emailAvailable(email:"${email}"){
            isAvailable
            }
        }`
    }
}

beforeAll((done) => {
    appTester = new AppTester({
        dbConfig: {
            userDB: "AvailableTest"
        },
        onReady: async () => {
            try {
                request = appTester.getRequestSender();
                await appTester.register(user1);
                await appTester.register(user2);
                done();
            } catch (err) {
                done(err);
            }
        }
    });
}, 40000);

test("Username availability", async (done) => {
    let res = await request.getGraphQL(buildUsernameAvailableQuery("availableUsername"));
    expect(res.data.usernameAvailable.isAvailable).toBeTruthy();
    res = await request.getGraphQL(buildUsernameAvailableQuery(user1.username));
    expect(res.data.usernameAvailable.isAvailable).toBeFalsy();
    res = await request.getGraphQL(buildUsernameAvailableQuery(user2.username));
    expect(res.data.usernameAvailable.isAvailable).toBeFalsy();
    done()
});

test("Email availability", async (done) => {
    let res = await request.getGraphQL(buildEmailAvailableQuery("available.email@mail.com"));
    expect(res.data.emailAvailable.isAvailable).toBeTruthy();
    res = await request.getGraphQL(buildEmailAvailableQuery(user1.email));
    expect(res.data.emailAvailable.isAvailable).toBeFalsy();
    res = await request.getGraphQL(buildEmailAvailableQuery(user2.email));
    expect(res.data.emailAvailable.isAvailable).toBeFalsy();
    done()
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);