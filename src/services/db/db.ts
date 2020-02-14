/**
 * Module defining functions for Mongoose connection and disconnection.
 * @module services/db/db
 */

import mongoose from 'mongoose';
import config from '../../config';

export default class MongooseConnection {
    public static async init(cb?: () => void): Promise<void | never> {
        const connectionString =
            'mongodb://' + config.dbConfig.address + ':' + config.dbConfig.port + '/' + config.dbConfig.userDB;

        mongoose.set('useUnifiedTopology', true);
        mongoose.set('useNewUrlParser', true);
        mongoose.set('useFindAndModify', false);
        mongoose.set('useCreateIndex', true);

        // Get Mongoose to use the global promise library
        mongoose.Promise = global.Promise;

        // CONNECTION EVENTS
        // When successfully connected
        mongoose.connection.on('connected', () => {
            console.log('Mongoose default connection open to ' + connectionString);
            config.serviceReady({ isMongooseReady: true });
            if (cb) {
                cb();
            }
        });

        // If the connection throws an error
        mongoose.connection.on('error', err => {
            console.log('Connection error with MongoDB. Error:', err);
        });

        // When the connection is disconnected
        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose default connection disconnected');
        });

        // If the Node process ends, close the Mongoose connection
        process.on('SIGINT', () => {
            mongoose.connection.close(() => {
                console.log('Mongoose default connection disconnected through app termination');
                process.exit(0);
            });
        });

        // Create the database connection
        await mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    public static async close(cb?: () => void): Promise<void | never> {
        await mongoose.connection.close(() => {
            console.log('Mongoose connection closed');
            if (cb) {
                cb();
            }
        });
    }
}
