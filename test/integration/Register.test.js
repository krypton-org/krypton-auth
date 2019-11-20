const AppTester = require('../utils/AppTester');

let appTester;
let request;

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
            userDB: "RegisterTest"
        },
        onReady: done});
}, 40000);

test('Password to small', async (done) => {
    request = appTester.getRequestSender();
    const query = {
        query: `mutation{
            register(fields: {
                username:"${user.username}" 
                email:"${user.email}" 
                password:"1234"
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
    const res = await request.postGraphQL(query);
    expect(res.errors[0].message).toBe("The password must contain at least 8 characters!");
    done();
});

test('Email invalid', async (done) => {
    request = appTester.getRequestSender();
    const query = {
        query: `mutation{
            register(fields: {
                username:"${user.username}" 
                email:"wrong.email.com" 
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
    const res = await request.postGraphQL(query);
    expect(res.errors[0].message.includes("This email address is not valid!")).toBeTruthy();
    done();
});

test('Username contains unauthorized characters', async (done) => {
    request = appTester.getRequestSender();
    const query = {
        query: `mutation{
            register(fields: {
                username:"Yo^^^^" 
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
    const res = await request.postGraphQL(query);
    expect(res.errors[0].message.includes("A username may only contain letters, numbers, dashes, dots and underscores")).toBeTruthy();
    done();
});

test('Username to small', async (done) => {
    request = appTester.getRequestSender();
    const query = {
        query: `mutation{
            register(fields: {
                username:"Yo" 
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
    const res = await request.postGraphQL(query);
    expect(res.errors[0].message.includes("The username must contains more than 4 characters!")).toBeTruthy();
    done();
});

test('Register a correct user', async (done) => {
    request = appTester.getRequestSender();
    const query = {
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
    const res = await request.postGraphQL(query);
    if (res.errors) { return done(res.errors); }
    expect(res.data.register.notifications[0].type).toBe("SUCCESS");
    done();
}, 10000);

test('Username already exists', async (done) => {
    request = appTester.getRequestSender();
    const query = {
        query: `mutation{
            register(fields: {
                username:"${user.username}" 
                email:"other.email@mail.com" 
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
    const res = await request.postGraphQL(query);
    expect(res.errors[0].message).toBe("Username already exists");
    done();
});

test('Email already exists', async (done) => {
    request = appTester.getRequestSender();
    const query = {
        query: `mutation{
            register(fields: {
                username:"other_username" 
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
    const res = await request.postGraphQL(query);
    expect(res.errors[0].message).toBe("Email already exists");
    done();
});


afterAll(async (done) => {
    await appTester.close(done);
}, 40000);