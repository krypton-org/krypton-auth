import MongooseConnection from '../../src/services/db/db';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import GraphQLAuthService from '../../src/GraphQLAuthService';

export default class AppTester {
    public request: any;

    register: (user: any) => Promise<any> = (user) => new Promise((resolve, reject) => {
        const registerQuery = {
            query: `mutation{
            register(fields: {
                username:"${user.username}" 
                email:"${user.email}" 
                password:"${user.password}"
                age:${user.age}
                receiveNewsletter:${user.receiveNewsletter},
                gender:${user.gender}
                firstName:"${user.firstName}" 
                lastName:"${user.lastName}"}){
            notifications{
                type
                message
            }
            }}`
        }
        this.request.postGraphQL(registerQuery)
            .then(res => resolve(res))
            .catch(err => reject(err));
    });

    /**
        Log user in and return token
        @param String login
        @param String password
        @return String token
    */
    login: (login: string, password: string) => Promise<any> = (login, password) => new Promise((resolve, reject) => {
        let loginQuery = {
            query: `mutation{
            login(login:"${login}" password:"${password}"){
            token
            expiryDate
        }}`
        }
        this.request.postGraphQL(loginQuery)
            .then(res => resolve(res))
            .catch(err => reject(err));
    });

    close: (done: () => void) => Promise<any> = async (done) => {
        const agenda = require('../../src/services/agenda/agenda').default;
        await agenda.stop();
        await mongoose.connection.db.dropDatabase();
        await MongooseConnection.close(done);
    }

    getRequestSender: () => any = () => {
        return this.request;
    };

    constructor(options) {
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
                    firstName: {
                        type: String,
                        required: false,
                        maxlength: 256,
                        validate: {
                            validator: v => v.length >= 2,
                            message: () => "A minimum of 2 letters are required for your first name!",
                        },
                        isPublic: false
                    },
                    lastName: {
                        type: String,
                        required: false,
                        maxlength: 256,
                        validate: {
                            validator: v => v.length >= 2,
                            message: () => "A minimum of 2 letters are required for your last name!",
                        },
                        isPublic: false
                    },
                    gender: {
                        type: String,
                        required: true,
                        enum: ["M", "Mrs", "Other"],
                        isPublic: true
                    },
                    age: {
                        type: Number,
                        required: true,
                        isPublic: true
                    },
                    receiveNewsletter: {
                        type: Boolean,
                        required: true,
                        default: false,
                        isPublic: false
                    }
                },
                graphiql: true
            }
        }

        console.log("yoooo");

        this.request = request(GraphQLAuthService(express(), options));

        this.request.getGraphQL = (query, bearerToken, refreshToken) => new Promise((resolve, reject) => {
            let request = this.request.get('/graphql')
                .set('Accept', 'application/json')
                .set("Content-Type", "application/json");
            if (bearerToken) request.set("Authorization", "Bearer " + bearerToken);
            if (refreshToken) request.set('Cookie', ['refreshToken=' + refreshToken])

            request.send(JSON.stringify(query))
                .then(res => resolve(JSON.parse(res.text)))
                .catch(err => reject(err));
        });

        this.request.postGraphQL = (query, bearerToken, refreshToken) => new Promise((resolve, reject) => {
            let request = this.request.post('/graphql')
                .set('Accept', 'application/json')
                .set("Content-Type", "application/json");
            if (bearerToken) request.set("Authorization", "Bearer " + bearerToken);
            if (refreshToken) request.set('Cookie', ['refreshToken=' + refreshToken])

            request.send(JSON.stringify(query))
                .then(res => resolve(JSON.parse(res.text)))
                .catch(err => reject(err));
        });

        
    }
};
