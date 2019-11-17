const AppTester = require('../utils/AppTester');

let appTester;
let request;

beforeAll((done) => {
    appTester = new AppTester({onReady: done});
}, 15000);

test('Get service public key', async (done) => {
    request = appTester.getRequestSender();
    const query = {
        query: `query{
            publicKey{
              value
            }}`
    }
    const res = await request.getGraphQL(query);
    expect(res.data.publicKey.value).toBeTruthy();
    done();
});


afterAll(async (done) => {
    await appTester.close(done);
}, 10000);