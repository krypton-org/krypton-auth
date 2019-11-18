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
            extendedSchema: {
                firstName:{ 
                    type: String,
                    required: false,
                    maxlength: 256,
                    validate: {
                        validator: v => v.length >= 2,
                        message: () => "A minimum of 2 letters are required for your first name!",
                    },
                    isPublic: false
                },
                lastName:{ 
                    type: String,
                    required: false,
                    maxlength: 256,
                    validate: {
                        validator: v => v.length >= 2,
                        message: () => "A minimum of 2 letters are required for your last name!",
                    },
                    isPublic: false
                },
                gender:{ 
                    type: String,
                    required: true,
                    enum: ["M", "Mrs", "Other"],
                    isPublic: true
                },
                age:{ 
                    type: Number,
                    required: true,
                    isPublic: true
                },
                receiveNewsletter:{ 
                    type: Boolean,
                    required: true,
                    default: false,
                    isPublic: false
                }
            },
            graphiql: true
        }
    }

    this.request = request(new GraphQLAuthentificationService(options));

    this.request.postGraphQL = (query, bearerToken) => new Promise((resolve, reject)=> {
        let request = this.request.post('/graphql')
        .set('Accept', 'application/json')
        .set("Content-Type", "application/json")
        if (bearerToken) request = request.set("Authorization", "Bearer "+bearerToken)
        request.send(JSON.stringify(query))
        .then(res => resolve(JSON.parse(res.text)))
        .catch(err => reject(err))
    });

    this.request.getGraphQL = (query, bearerToken) => new Promise((resolve, reject)=> {
        this.request.get('/graphql')
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