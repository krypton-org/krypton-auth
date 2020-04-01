import AppTester from '../utils/AppTester';


let appTester;
let request;

beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/IndexTest",
        graphiql: true,
        onReady: done
    });
    request = appTester.getRequestSender();
}, 40000);

test("Access GraphIQL IDE", async (done) => {
    const res = await request.get("/").set("Accept", "text/html");
    expect(res.statusCode).toBe(200);
    expect(res.text.includes("GraphiQLAuthToken")).toBeTruthy();
    done();
});

test('No IO Server set as nodemailerConfig provided', async (done) => {
    const config = require('../../src/config').default;
    let res = await request.get("/").set("Accept", "text/html");
    expect(res.statusCode).toBe(200);
    expect(config.io).toBeFalsy();
    done();
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);