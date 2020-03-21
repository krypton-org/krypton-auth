import MongooseConnection from '../../src/db/db';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import kryptonAuth from '../../src/index';
import mailer, { Transporter } from 'nodemailer';
import { parse } from 'cookie';


export default class AppTester {
    private request: any;

    public register = async function (user: any): Promise<any> {
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
        return await this.request.postGraphQL(registerQuery);
    };

    /**
        Log user in and return token
        @param String login
        @param String password
        @return String token
    */
    public login = async function (login: string, password: string): Promise<any> {
        let loginQuery = {
            query: `mutation{
            login(login:"${login}" password:"${password}"){
            token
            expiryDate
        }}`
        }
        return await this.request.postGraphQL(loginQuery)
    };

    public close: (done: () => void) => Promise<any> = async (done) => {
        const agenda = require('../../src/agenda/agenda').default;
        await agenda.stop();
        await mongoose.connection.db.dropDatabase();
        await MongooseConnection.close(done);
    }

    getRequestSender: () => any = () => {
        return this.request;
    };

    constructor(options) {
        const mailTransporter: Transporter = mailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'x6z5n5ywx7wbpgkb@ethereal.email',
                pass: 'JAXPXSY9MQP3uHtFjB'
            }
        });

        options = {
            ...{
                mailTransporter,
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
            },
            ...options
        }

        const app = express();
        app.use(kryptonAuth(options));
        this.request = request(app);

        this.request.getGraphQL = async function (query, bearerToken, refreshToken): Promise<any> {
            let request = this.get('/')
                .set('Accept', 'application/json')
                .set("Content-Type", "application/json");
            if (bearerToken) request.set("Authorization", "Bearer " + bearerToken);
            if (refreshToken) request.set('Cookie', ['refreshToken=' + refreshToken])

            const res = await request.send(JSON.stringify(query))
            return {
                ...JSON.parse(res.text),
                cookies: res.headers['set-cookie'].reduce((acc, curr) => {
                    const cookie = parse(curr);
                    return { ...acc, ...cookie }
                }, {})
            };
        };

        this.request.postGraphQL = async function (query, bearerToken, refreshToken): Promise<any> {
            let request = this.post('/')
                .set('Accept', 'application/json')
                .set("Content-Type", "application/json");
            if (bearerToken) request.set("Authorization", "Bearer " + bearerToken);
            if (refreshToken) request.set('Cookie', ['refreshToken=' + refreshToken])

            const res = await request.send(JSON.stringify(query))
            return {
                ...JSON.parse(res.text),
                cookies: res.headers['set-cookie'].reduce((acc, curr) => {
                    const cookie = parse(curr);
                    return { ...acc, ...cookie }
                }, {})
            };
        };
    }
};
