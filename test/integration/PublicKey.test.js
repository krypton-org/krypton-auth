const AppTester = require('../utils/AppTester');

let appTester;
let request;

beforeAll((done) => {
    appTester = new AppTester({onReady: done});
}, 15000);

test('Get service public key', (done) => {
    request = appTester.getRequestSender();
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
    await appTester.close(done);
}, 10000);