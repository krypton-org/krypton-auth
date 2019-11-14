const PasswordEncryption = require('../../../../bundles/UserspaceBundle/service/crypto/PasswordEncryption');

    
test("Test error thrown by Password encryption service", (done) => {
    //Work with string only
    PasswordEncryption.hash(8,3)
    .catch(err => {
        expect(err).toBeTruthy();
        done();
    })
}, 50000);

test("Test hash different for same password if different salt", (done) => {
    let hash1;
    let hash2;
    PasswordEncryption.hash("secret", "salt1111")
    .then(result => {
        expect(result.hash).toBeTruthy();
        expect(result.salt).toBeTruthy();
        hash1 = result.hash;
        return PasswordEncryption.hash("secret", "salt2222");
    })
    .then(result => {
        expect(result.hash).toBeTruthy();
        expect(result.salt).toBeTruthy();
        hash2 = result.hash;
        expect(hash1 === hash2).toBeFalsy();
        done();
    })
}, 50000);

test("Test hash similar for same password and same salt", (done) => {
    let hash1;
    let hash2;
    PasswordEncryption.hash("secret", "salt1111")
    .then(result => {
        expect(result.hash).toBeTruthy();
        expect(result.salt).toBeTruthy();
        hash1 = result.hash;
        return PasswordEncryption.hash("secret", "salt1111");
    })
    .then(result => {
        expect(result.hash).toBeTruthy();
        expect(result.salt).toBeTruthy();
        hash2 = result.hash;
        expect(hash1 === hash2).toBeTruthy();
        done();
    })
}, 50000);
