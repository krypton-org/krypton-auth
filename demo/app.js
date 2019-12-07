const GraphQLAuthService = require('../index');
const port = process.env.PORT || 80;


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
    },
    dbOptions = {
        address: 'user:password@host.com', //Mongo adress, 'localhost' by default
        port: '27017', //Mongo port, '27017' by default 
        agendaDB: 'agenda', //DB name for the email processing queue, 'agenda' by default
        userDB: 'users' //DB name where will be stored the users, 'users' by default
    },
    graphiql: true
};

const app = GraphQLAuthService(options);


app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${port}`)
})

