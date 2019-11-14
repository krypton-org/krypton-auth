const AppTester = require('../../utils/app-tester.js')

describe('Test MyOwnBundle API', () => {
    
    let appTester = new AppTester({useMockAuthentificaiton: true});
    let request = appTester.getRequestSender();

    test('Public tab reached', (done) => {
        request.get('/mypublictab').then((response) => {
            expect(response.statusCode).toBe(200)
            done();
        });
    });
    
    test('Private tab not reached if not logged in', (done) => {
        request.get('/myprivatetab').then((response) => {
            expect(response.statusCode).toBe(302)
           done();
        });
    });
    
    test('Private tab reached if loggged int', (done) => {
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
        appTester.loginMockUser(mockUser)
        .then(() => {
            return request.get('/myprivatetab');
        })
        .then((response) => {
            expect(response.statusCode).toBe(200);
            return appTester.logoutMockUser();
        })
        .then(() =>{
            done();
        })
        
        
    });
});