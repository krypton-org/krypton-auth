const AppTester = require('../utils/AppTester');
const pkg = require('../../package.json');


let appTester;
let request;

beforeAll((done) => {
    appTester = new AppTester({
        dbConfig: {
            userDB: "IndexTest"
        },
        onReady: done
    });
    request = appTester.getRequestSender();

}, 40000);

test("Access index page", async (done) => {
    res = await request.get("/");
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.text).notifications[0].message).toBe('Welcome to GraphQL Auth Service - version '+pkg.version);
    done();
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);