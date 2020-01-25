import AppTester from '../utils/AppTester';

let appTester;
let request;

beforeAll((done) => {
    appTester = new AppTester({onReady: done});
}, 40000);

test('Get service public key', async (done) => {
    request = appTester.getRequestSender();
    const query = {
        query: `query{
            publicKey
        }`
    }
    const res = await request.getGraphQL(query);
    expect(res.data.publicKey).toBeTruthy();
    done();
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);