const AppTester = require('../../utils/app-tester.js')

describe('Test MainBundle API', () => {
    
    let appTester = new AppTester({useMockAuthentificaiton: true});
    let request = appTester.getRequestSender();

    test('Index reached', (done) => {
        request.get('/').then((response) => {
            expect(response.statusCode).toBe(200)
            done();
        });
    });
    
    test('Dashboard not reached if not logged in', (done) => {
        request.get('/dashboard').then((response) => {
            expect(response.statusCode).toBe(302)
           done();
        });
    });

    test('Legal reached', (done) => {
        request.get('/legal').then((response) => {
            expect(response.statusCode).toBe(200)
            done();
        });
    });

    test('Dashboard reached if logged in with user email confirmed true & false', (done) => {
        const mockUser = {
            id: 'abcd',
            username : "test", 
            email : "test@test.com", 
            extras: {
                firstName: "test", 
                lastName:"test",
                verified: true
            }
        };
        appTester.loginMockUser(mockUser).then(() => {
            return request.get('/dashboard');
        })
        .then((response) => {
            expect(response.statusCode).toBe(200);
            return appTester.logoutMockUser();
        })
        .then(() =>{
            return request.get('/dashboard');
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            mockUser.extras.verified = false;
            return appTester.loginMockUser(mockUser);
            ///done();
        })
        .then(() => {
            return request.get('/dashboard');
        })
        .then((response) => {
            expect(response.text.includes('/send_confirmation_email')).toBeTruthy();
            expect(response.statusCode).toBe(200);
            return appTester.logoutMockUser();
        })
        .then(() =>{
            return request.get('/dashboard');
        })
        .then((response) => {
            expect(response.statusCode).toBe(302);
            done();
        })    
        
    });
});