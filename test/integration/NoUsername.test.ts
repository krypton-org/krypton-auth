import AppTester from '../utils/AppTester';

let appTester;
let request;

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

beforeAll((done) => {
    appTester = new AppTester({
        dbConfig: {
            userDB: "NoUsername"
        },
        onReady: async () => {
            try {
                request = appTester.getRequestSender();
            done();
            } catch (err) {
                done(err);
            }
        },
        hasUsername: false
    });
}, 40000);

test('Can\'t record username', async (done) => {
    //Registration
    request = appTester.getRequestSender();
    let queryRegister = {
        query: `mutation{
            register(fields: {
                username:"${user1.username}" 
                email:"${user1.email}" 
                password:"1234"
                age:${user1.age}
                receiveNewsletter:${user1.receiveNewsletter},
                gender:${user1.gender}
                firstName:"${user1.firstName}" 
                lastName:"${user1.lastName}"}){
              notifications{
                  type
                  message
              }
            }}`
    }
    let res = await request.postGraphQL(queryRegister);
    expect(res.errors[0].message).toBe('Field "username" is not defined by type UserRegisterInput. Did you mean lastName?');

    queryRegister = {
        query: `mutation{
            register(fields: {
                email:"${user1.email}" 
                password:"${user1.password}"
                age:${user1.age}
                receiveNewsletter:${user1.receiveNewsletter},
                gender:${user1.gender}
                firstName:"${user1.firstName}" 
                lastName:"${user1.lastName}"}){
              notifications{
                  type
                  message
              }
            }}`
    }
    res = await request.postGraphQL(queryRegister);
    expect(res.data.register.notifications[0].type).toBe("SUCCESS");

    //Login
    let queryLogin = {
        query: `mutation{
            login(login:"${user1.username}" password:"${user1.password}"){
                token
        }}`
    }
    res = await request.postGraphQL(queryLogin);
    expect(res.errors[0].message.includes("Wrong credentials")).toBeTruthy();

    queryLogin = {
        query: `mutation{
            login(login:"${user1.email}" password:"${user1.password}"){
                token
        }}`
    }
    res = await request.postGraphQL(queryLogin);
    expect(typeof res.data.login.token === "string").toBeTruthy();
    let token = res.data.login.token;

    //User query
    let queryMe = {
        query: `query{
            me{
             username
            }
        }`
    }
    res = await request.postGraphQL(queryMe, token);
    expect(res.errors[0].message).toBe("Cannot query field \"username\" on type \"User\". Did you mean \"lastName\"?");

    queryMe = {
        query: `query{
            me{
             email
            }
        }`
    }
    res = await request.postGraphQL(queryMe, token);
    expect(res.data.me.email).toBe(user1.email);
    done();
}, 20000);


afterAll(async (done) => {
    await appTester.close(done);
}, 40000);