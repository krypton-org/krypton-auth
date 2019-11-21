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
    expect(res.text.includes('Welcome to GraphQL-Authentification-Service version '+pkg.version)).toBeTruthy();
    done();
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);