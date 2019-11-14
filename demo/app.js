const RESTAuthentificationBackend = require('../index');
const port = process.env.PORT || 80;

const dbOptions = {
    hostname: "dbuser:dbpassword@host.com",
    port: "19150",
    database: "user_management"
};


//Enter your email options for the userspace from where will be sent the emails
//Check nodemailer confirguration for more options (https://nodemailer.com)
const options = {
    emailConfig: {
        from: 'myemail@myhost.com', //email address
        host: 'smtp.myhost.com', // hostname 
        secureConnection: true, // use SSL 
        port: 465, // port for secure SMTP 
        auth: {
            user: 'username', //email login
            pass: 'mypassword' //email password
        }
    }
};

const app = RESTAuthentificationBackend(options);


app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${port}`)
})

