const User = require('../../../bundles/UserspaceBundle/model/UserModel');
const db = require('../../../config/db');

let user = { 
    username: "BobDylan",
    email: "bob@dylan.com",
    password: "password",
    extras: {
        lastName: "bob",
        firstName: "dylan",
        verificationToken: "gnagnagna"
    }
};

beforeAll((done) => {
    db.init(done);
});

test('Prevent user registration when conditions not accepted', (done) => {
    User.createUser(user)
    .then(() => {
        return User.userExists({email:"bob@dylan.com"});
    })
    .then(userExists => {
        expect(userExists).toBeTruthy();
        return User.getUser({email:"bob@dylan.com"});        
    })
    .then(userReturned => {
        expect(userReturned.username).toBe(user.username);
        expect(userReturned.email).toBe(user.email);
        expect(userReturned.extras.lastName).toBe(user.extras.lastName);
        expect(userReturned.extras.firstName).toBe(user.extras.firstName);
        expect(userReturned.extras.verificationToken).toBe(user.extras.verificationToken);
        expect(userReturned.password).not.toBe(user.password);
        expect(typeof userReturned.password).toBe("string");
        expect(typeof userReturned.passwordSalt).toBe("string");
        expect(userReturned.password).not.toBe("");
        expect(userReturned.passwordSalt).not.toBe("");
        expect(userReturned.password).not.toBe(userReturned.passwordSalt);
        return User.updateUser({email: "bob@dylan.com"}, {"extras.firstName": "Marc"})
    })
    .then(() => {
        return User.getUser({email:"bob@dylan.com"});
    })
    .then(userReturned => {
        expect(userReturned.extras.firstName).toBe("Marc");
        return User.isPasswordValid({email:"bob@dylan.com"}, user.password);
    })
    .then(isPasswordValid => {
        expect(isPasswordValid).toBeTruthy();
        return User.isPasswordValid({email:"bob@dylan.com"}, "wrongpassword");
    })
    .then(isPasswordValid => {
        expect(isPasswordValid).toBeFalsy()
        return User.authenticate({email:"bob@dylan.com"}, user.password);
    })
    .then(user => {
        expect(typeof user.token).toBe("string");
        expect(user.token).not.toBe("");
        return User.removeUser({email:"bob@dylan.com"});
    })
    .then(() => {
        return User.userExists({email:"bob@dylan.com"});
    })
    .then(userExists => {
        expect(userExists).toBeFalsy();
        done();
    })
});

afterAll((done) => {
    User.remove({email:"bob@dylan.com"})
    .then(() => {
        db.close(done);
    });
});

