const mongoose = require('mongoose');
const config = require('../../config');

module.exports.init = (cb) => {
    let connectionString = 'mongodb://' +
        config.dbConfig.address + ':' +
        config.dbConfig.port + '/' +
        config.dbConfig.userDB;

    mongoose.set('useUnifiedTopology', true);
    // Create the database connection
    mongoose.connect(connectionString, { useNewUrlParser: true });

    // Get Mongoose to use the global promise library
    mongoose.Promise = global.Promise;

    // CONNECTION EVENTS
    // When successfully connected
    mongoose.connection.on('connected', function () {
        console.log('Mongoose default connection open to ' + connectionString);
        config.serviceReady({isMongooseReady: true});
        if(cb) cb();
    });

    // If the connection throws an error
    mongoose.connection.on('error', function (err) {
        console.log('Mongoose default connection error: ' + err);
    });

    // When the connection is disconnected
    mongoose.connection.on('disconnected', function () {
        console.log('Mongoose default connection disconnected');
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', function () {
        mongoose.connection.close(function () {
            console.log('Mongoose default connection disconnected through app termination');
            process.exit(0);
        });
    });
}

module.exports.close = async (cb) => {
    await mongoose.connection.close(() => {
        console.log('Mongoose connection closed');
        if(cb) cb();
    });
}

