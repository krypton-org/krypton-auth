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
            graphiql: true
        }
    }

    this.request = request(new GraphQLAuthentificationService(options));

    this.request.postGraphQL = (query) => new Promise((resolve, reject)=> {
        this.request.post('/graphql')
        .set('Accept', 'application/json')
        .set("Content-Type", "application/json")
        .send(JSON.stringify(query))
        .then(res => resolve(JSON.parse(res.text)))
        .catch(err => reject(err))
    });

    this.request.getGraphQL = (query) => new Promise((resolve, reject)=> {
        request.get('/graphql')
        .set('Accept', 'application/json')
        .set("Content-Type", "application/json")
        .send(JSON.stringify(query))
        .then(res => resolve(JSON.parse(res.text)))
        .catch(err => reject(err))
    });

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