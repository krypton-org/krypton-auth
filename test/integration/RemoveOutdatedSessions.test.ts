import AppTester from '../utils/AppTester';
import generateToken from '../../src/crypto/TokenGenerator'

let appTester;
let request;
let user = {
    email: "test@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "Mrs",
    receiveNewsletter: true
};

let id1, sessionCount = 0;

const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/RemoveOutdatedSessions",
        onReady: async () => {
            try{
                request = appTester.getRequestSender();
                await appTester.register(user);
                done();
            } catch (err) {
                done(err);
            }
        }
    });
}, 40000);


async function createSession (userId, expiryDate){
    const Session = require('../../src/model/SessionModel').default;
    const refreshToken = generateToken(64);
    const instance = new Session({userId, expiryDate, refreshToken});
    await instance.save();
}

test("Agenda remove outdated sessions", async (done) => {
    const Session = require('../../src/model/SessionModel').default;

    //Login and create a new session
    let res = await appTester.login(user.email, user.password);
    id1 = res.data.login.user._id;
    sessionCount += 1;
    expect(await Session.count()).toBe(sessionCount);

    // Create 2 outdated sessions
    for (let i = 0; i < 2; i++) {
        await createSession(id1, new Date(0))  
    } 
    sessionCount += 2;
    expect(await Session.count()).toBe(sessionCount);

    //Login, create a new session and cleanup outdated ones
    res = await appTester.login(user.email, user.password);
    sessionCount -= 2;
    sessionCount += 1;
    expect(await Session.count()).toBe(sessionCount);

    // Create 4 outdated sessions
    for (let i = 0; i < 4; i++) {
        await createSession(id1, new Date(0))  
    } 
    sessionCount += 4;
    expect(await Session.count()).toBe(sessionCount);

    // Create 2 ongoing sessions
    for (let i = 0; i < 2; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        await createSession(id1, date);
    }
    sessionCount += 2;
    expect(await Session.count()).toBe(sessionCount);
    const agenda = require('../../src/agenda/agenda').default;
    const removeOutdatedSessionsJobLabel = require('../../src/jobs/RemoveOutdatedSessions').JOB_NAME;
    await agenda.now(removeOutdatedSessionsJobLabel);
    await wait(15000)
    sessionCount -= 4;
    expect(await Session.count()).toBe(sessionCount);
    done();
}, 40000);

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);