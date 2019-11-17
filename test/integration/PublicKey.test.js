const AppTester = require('../utils/AppTester');

let appTester;
let request;

beforeAll(async (done) => {
    appTester = new AppTester();
    request = appTester.getRequestSender();
    setTimeout(() => done(), 10000)
}, 15000);

test('Get service public key', (done) => {
    const query = {
        query: `query{
            publicKey{
              value
            }}`
    }
    request.get('/graphql')
        .set('Accept', 'application/json')
        .set("Content-Type", "application/json")
        .send(JSON.stringify(query))
        .end((err, res) => {
            if (err) { return done(err); }
            expect(JSON.parse(res.text).data.publicKey.value).toBeTruthy();
            done();
        });
});


afterAll(async (done) => {
    await appTester.disconnectDB(done);
}, 10000);