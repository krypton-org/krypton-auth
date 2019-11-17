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
        extendedSchema: {
            firstName:{ 
                type: String,
                required: false,
                maxlength: 256,
                validate: {
                    validator: v => v.length >= 2,
                    message: () => "A minimum of 2 letters are required for your first name!",
                },
                isPublic: false
            },
            lastName:{ 
                type: String,
                required: false,
                maxlength: 256,
                validate: {
                    validator: v => v.length >= 2,
                    message: () => "A minimum of 2 letters are required for your last name!",
                },
                isPublic: false
            },
            gender:{ 
                type: String,
                required: true,
                enum: ["M", "Mrs", "Other"],
                isPublic: true
            },
            age:{ 
                type: Number,
                required: true,
                isPublic: true
            },
            receiveNewsletter:{ 
                type: Boolean,
                required: true,
                default: false,
                isPublic: false
            }
        },
        onReady: done});
}, 40000);

test('Get service public key', (done) => {
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
    request.post('/graphql')
        .set('Accept', 'application/json')
        .set("Content-Type", "application/json")
        .send(JSON.stringify(query))
        .end((err, res) => {
            if (err) { return done(err); }
            res = JSON.parse(res.text)
            if (res.errors) { return done(res.errors); }
            expect(res.data.register.notifications[0].type).toBe("SUCCESS");
            done();
        });
});


afterAll(async (done) => {
    await appTester.close(done);
}, 40000);