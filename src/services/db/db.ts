/**
 * Module defining functions for Mongoose connection and disconnection.
 * @module services/db/db
 */

import mongoose from 'mongoose';
import config from '../../config';

async function init(cb?: () => any): Promise<void | never> {
    const connectionString =
        'mongodb://' + config.dbConfig.address + ':' + config.dbConfig.port + '/' + config.dbConfig.userDB;

    // Get Mongoose to use the global promise library
    mongoose.Promise = global.Promise;

    // CONNECTION EVENTS
    // When successfully connected
    mongoose.connection.on('connected', () => {
        config.serviceReady({ isMongooseReady: true });
        if (cb) {
            cb();
        }
    });

    // If the connection throws an error
    mongoose.connection.on('error', err => {
        config.dbConnectionFailed(err);
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', () => {
        mongoose.connection.close(() => {
            process.exit(0);
        });
    });

    // Create the database connection
    try {
        await mongoose.connect(connectionString, {
            useCreateIndex: true,
            useFindAndModify: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (err) {
        config.dbConnectionFailed(err);
    }
}

async function close(cb?: () => void): Promise<void | never> {
    await mongoose.connection.close(() => {
        if (cb) {
            cb();
        }
    });
}

export default { init, close };
