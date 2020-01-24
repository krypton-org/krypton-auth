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

let user2 = {
    username: "username2",
    email: "test2@test.com",
    password: "password2",
    firstName: "firstname2",
    lastName: "lastname2",
    age: 24,
    gender: "Mrs",
    receiveNewsletter: true
};

let user3= {
    username: "username3",
    email: "test3@test.com",
    password: "password3",
    firstName: "firstname3",
    lastName: "lastname3",
    age: 24,
    gender: "Mrs",
    receiveNewsletter: true
};

let user4= {
    username: "username4",
    email: "test4@test.com",
    password: "password4",
    firstName: "firstname4",
    lastName: "lastname4",
    age: 24,
    gender: "Mrs",
    receiveNewsletter: true
};

beforeAll(async (done) => {
    appTester = new AppTester({
        dbConfig: {
            userDB: "RegisterTest"
        },
        onReady: async () => {
            try{
                request = appTester.getRequestSender();
                const res = await appTester.register(user2);
                done();
            } catch (err) {
                done(err);
            }
        }});
}, 40000);

test('Password to small', async (done) => {
    request = appTester.getRequestSender();
    const query = {
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
    const res = await request.postGraphQL(query);
    expect(res.errors[0].message).toBe("The password must contain at least 8 characters!");
    done();
});

test('Email invalid', async (done) => {
    request = appTester.getRequestSender();
    const query = {
        query: `mutation{
            register(fields: {
                username:"${user1.username}" 
                email:"wrong.email.com" 
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
    const res = await request.postGraphQL(query);
    expect(res.errors[0].message.includes("The username must contains more than 4 characters!")).toBeTruthy();
    done();
});

test('Register a correct user', async (done) => {
    request = appTester.getRequestSender();
    const query = {
        query: `mutation{
            register(fields: {
                username:"${user1.username}" 
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
    const res = await request.postGraphQL(query);
    if (res.errors) { return done(res.errors); }
    expect(res.data.register.notifications[0].type).toBe("SUCCESS");
    done();
}, 10000);

test('Username already exists', async (done) => {
    request = appTester.getRequestSender();
    const query1 = {
        query: `mutation{
            register(fields: {
                username:"${user4.username}" 
                email:"${user4.email}" 
                password:"${user4.password}"
                age:${user4.age}
                receiveNewsletter:${user4.receiveNewsletter},
                gender:${user4.gender}
                firstName:"${user4.firstName}" 
                lastName:"${user4.lastName}"}){
              notifications{
                  type
                  message
              }
            }}`
    }
    let res = await request.postGraphQL(query1);
    const query2 = {
        query: `mutation{
            register(fields: {
                username:"${user4.username}" 
                email:"other.email@mail.com" 
                password:"${user4.password}"
                age:${user4.age}
                receiveNewsletter:${user4.receiveNewsletter},
                gender:${user4.gender}
                firstName:"${user4.firstName}" 
                lastName:"${user4.lastName}"}){
              notifications{
                  type
                  message
              }
            }}`
    }
    res = await request.postGraphQL(query2);
    expect(res.errors[0].message).toBe("Username already exists");
    done();
});

test('Email already exists', async (done) => {
    request = appTester.getRequestSender();
    const query1 = {
        query: `mutation{
            register(fields: {
                username:"${user3.username}" 
                email:"${user3.email}" 
                password:"${user3.password}"
                age:${user3.age}
                receiveNewsletter:${user3.receiveNewsletter},
                gender:${user3.gender}
                firstName:"${user3.firstName}" 
                lastName:"${user3.lastName}"}){
              notifications{
                  type
                  message
              }
            }}`
    }
    let res = await request.postGraphQL(query1);
    const query2 = {
        query: `mutation{
            register(fields: {
                username:"other_username" 
                email:"${user3.email}" 
                password:"${user3.password}"
                age:${user3.age}
                receiveNewsletter:${user3.receiveNewsletter},
                gender:${user3.gender}
                firstName:"${user3.firstName}" 
                lastName:"${user3.lastName}"}){
              notifications{
                  type
                  message
              }
            }}`
    }
    res = await request.postGraphQL(query2);
    expect(res.errors[0].message).toBe("Email already exists");
    done();
});


afterAll(async (done) => {
    await appTester.close(done);
}, 40000);