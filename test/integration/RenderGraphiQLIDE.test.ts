import AppTester from '../utils/AppTester';
const pkg = require('../../package.json');


let appTester;
let request;

beforeAll((done) => {
    appTester = new AppTester({
        dbConfig: {
            userDB: "IndexTest"
        },
        graphiql: true,
        onReady: done
    });
    request = appTester.getRequestSender();
}, 40000);

test("Access GraphIQL IDE", async (done) => {
    const res = await request.get("/graphql").set("Accept", "text/html");
    expect(res.statusCode).toBe(200);
    expect(res.text.includes("GraphiQLAuthToken")).toBeTruthy();
    done();
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);