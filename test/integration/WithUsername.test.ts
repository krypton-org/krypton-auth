import AppTester from '../utils/AppTester';

let appTester: AppTester;
let request;

let user1 = {
    username: "username", 
    email: "test@test.com", 
    password: "password", 
};

let user2 = {
    username: "username2",
    email: "test2@test.com",
    password: "password2",
};

let user3= {
    username: "username3",
    email: "test3@test.com",
    password: "password3",
};

let user4= {
    username: "username4",
    email: "test4@test.com",
    password: "password4",
};

let user5= {
    username: "username4",
    email: "test4@test.com",
    password: "password4",
};

let updates = {
    username: "otherUsername",
    email: "otheremail@mail.com",
    password: "tototototo"
}

const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/WithUsername",
        onReady: async () => {
            try {
                request = appTester.getRequestSender();
                done();
            } catch (err) {
                done(err);
            }
        },
        extendedSchema: {
            username: {
                isPublic: true,
                maxlength: 128,
                required: true,
                type: String,
                unique: true,
                validate: {
                    message: props => {
                        if (props.value.length < 4) {
                            return 'The username must contains more than 4 characters!';
                        } else {
                            return 'A username may only contain letters, numbers, dashes, dots and underscores !';
                        }
                    },
                    validator: v => /^[a-zA-Z0-9\-_.]{4,}$/.test(v),
                },
            }
        }
    });
}, 40000);

test('Register a correct user', async (done) => {
    request = appTester.getRequestSender();
    const query = {
        query: `mutation{
            register(fields: {
                username:"${user1.username}" 
                email:"${user1.email}" 
                password:"${user1.password}"})
            }`
    }
    const res = await request.postGraphQL(query);
    if (res.errors) { return done(res.errors); }
    expect(res.data.register).toBeTruthy();
    done();
}, 10000);


test('Username contains unauthorized characters', async (done) => {
    request = appTester.getRequestSender();
    const query = {
        query: `mutation{
            register(fields: {
                username:"Yo^^^^" 
                email:"${user1.email}" 
                password:"${user1.password}"})
            }`
    }
    const res = await request.postGraphQL(query);
    expect(res.errors[0].message.includes("A username may only contain letters, numbers, dashes, dots and underscores")).toBeTruthy();
    expect(res.errors[0].type).toBe('UserValidationError');
    done();
});

test('Username to small', async (done) => {
    request = appTester.getRequestSender();
    const query = {
        query: `mutation{
            register(fields: {
                username:"Yo" 
                email:"${user1.email}" 
                password:"${user1.password}"})
            }`
    }
    const res = await request.postGraphQL(query);
    expect(res.errors[0].message.includes("The username must contains more than 4 characters!")).toBeTruthy();
    expect(res.errors[0].type).toBe('UserValidationError');
    done();
});

test('Username already exists', async (done) => {
    request = appTester.getRequestSender();
    const query1 = {
        query: `mutation{
            register(fields: {
                username:"${user4.username}" 
                email:"${user4.email}" 
                password:"${user4.password}"})
            }`
    }
    let res = await request.postGraphQL(query1);
    const query2 = {
        query: `mutation{
            register(fields: {
                username:"${user4.username}" 
                email:"another.email@mail.com" 
                password:"${user4.password}"})
            }`
    }
    res = await request.postGraphQL(query2);
    expect(res.errors[0].message.includes("duplicate key")).toBeTruthy();
    expect(res.errors[0].type).toBe('UserValidationError');
    done();
});

test('Update usersname - email - password', async (done) => {
    await appTester.register(user3);
    const loginRes = await appTester.login(user3.email, user3.password);
    const expiryDate = new Date(loginRes.data.login.expiryDate);
    const token = loginRes.data.login.token;
    const refreshToken = loginRes.cookies.refreshToken;

    const query = {
        query: `mutation{
            updateMe(fields:{username:"${updates.username}" email: "${updates.email}" password: "${updates.password}" previousPassword:"${user3.password}"}){
              token,
              expiryDate
              user{
                username
                verified
                _id
                email
              }
            }
          }`
    }
    await wait(1000);
    let res = await request.postGraphQL(query, token, refreshToken);
    expect(res.data.updateMe.token).not.toBe(token);
    expect(new Date(res.data.updateMe.expiryDate).getTime()).toBeGreaterThan(expiryDate.getTime());
    expect(res.cookies.refreshToken).not.toBe(refreshToken);
    expect(res.data.updateMe.user.email).toBe("otheremail@mail.com");
    expect(res.data.updateMe.user.username).toBe("otherUsername");
    done();
});

test('Username too short', async (done) => {
    const resReg = await appTester.register(user2);
    const loginRes = await appTester.login(user2.email, user2.password);
    const token = loginRes.data.login.token;
    const refreshToken = loginRes.cookies.refreshToken;

    const query = {
        query: `mutation{
            updateMe(fields:{username: "Yo"}){
              token
            }
          }`
    }

    let res = await request.postGraphQL(query, token, refreshToken);
    expect(res.errors[0].message.includes("The username must contains more than 4 characters!")).toBeTruthy();
    expect(res.errors[0].type).toBe('UserValidationError');
    done();
});

test('Username already exists', async (done) => {
    await appTester.register(user2);
    await appTester.register(user5);
    const loginRes = await appTester.login(user5.email, user5.password);
    const token = loginRes.data.login.token;
    const refreshToken = loginRes.cookies.refreshToken;


    const query = {
        query: `mutation{
            updateMe(fields:{username: "${user2.username}"}){
              token
            }
          }`
    }

    let res = await request.postGraphQL(query, token, refreshToken);
    expect(res.errors[0].message.includes("duplicate key")).toBeTruthy();
    expect(res.errors[0].type).toBe('UserValidationError');
    done();
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);