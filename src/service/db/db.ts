import mongoose from 'mongoose';
import config from '../../config';

export default class MongooseConnection {
    static async init(cb?: () => void): Promise<void | never> {
        let connectionString = 'mongodb://' +
            config.dbConfig.address + ':' +
            config.dbConfig.port + '/' +
            config.dbConfig.userDB;

        mongoose.set('useUnifiedTopology', true);
        mongoose.set('useNewUrlParser', true);
        mongoose.set('useFindAndModify', false);
        mongoose.set('useCreateIndex', true);

        // Get Mongoose to use the global promise library
        mongoose.Promise = global.Promise;

        // CONNECTION EVENTS
        // When successfully connected
        mongoose.connection.on('connected', function () {
            console.log('Mongoose default connection open to ' + connectionString);
            config.serviceReady({ isMongooseReady: true });
            if (cb) cb();
        });

        // If the connection throws an error
        mongoose.connection.on('error', function (err) {
            console.log('Connection error with MongoDB. Error:', err);
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

        process.on("unhandledRejection", function (err) {
            console.log("yoooo");
        });

        process.on("uncaughtException", function (err) {
            console.log("yoooo");
        })

        // Create the database connection
        await mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
    }

    static async close(cb?: () => void): Promise<void | never> {
        await mongoose.connection.close(() => {
            console.log('Mongoose connection closed');
            if (cb) cb();
        });
    }
}