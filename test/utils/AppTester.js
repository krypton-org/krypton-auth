const db = require('../../lib/service/db/db');
const request = require('supertest');
const mongoose = require('mongoose');
const GraphQLAuthentificationService = require("../../index");

const AppTester = function (options) {

    options = {
        ...options,
        ...{
            emailConfig: {
                host: 'smtp.ethereal.email',
                port: 587,
                auth: {
                    user: 'x6z5n5ywx7wbpgkb@ethereal.email',
                    pass: 'JAXPXSY9MQP3uHtFjB'
                }
            },
            dbConfig: {
                userDB: "test"
            },
            graphiql: true
        }
    }

    this.request = request(new GraphQLAuthentificationService(options))

    this.close = async (done) => {
        const agenda = require('../../lib/service/agenda/agenda');
        await agenda.stop();
        mongoose.connection.db.dropDatabase()
        .then(() => db.close(done));
    }

    this.getRequestSender = () => {
        return this.request;
    };
};

module.exports = AppTester;