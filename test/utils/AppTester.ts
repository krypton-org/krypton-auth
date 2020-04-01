import MongooseConnection from '../../src/db/db';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import kryptonAuth from '../../src/index';
import { parse } from 'cookie';


export default class AppTester {
    private request: any;
    private enumSet: Set<string>;

    constructor(options) {
        const nodemailerConfig = {
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'x6z5n5ywx7wbpgkb@ethereal.email',
                pass: 'JAXPXSY9MQP3uHtFjB'
            }
        };

        this.enumSet = new Set<string>();

        options = {
            ...{
                nodemailerConfig,
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

        if (options.extendedSchema) {
            Object.keys(options.extendedSchema).map((key) => {
                options.extendedSchema[key].hasOwnProperty('enum') ? this.enumSet.add(key) : null;
            })
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

    public register = async function (user: any): Promise<any> {
        let query = `mutation{register(fields: {`;

        for (const key in user) {
            if (user.hasOwnProperty(key)) {
                if (typeof user[key] === "number" || typeof user[key] === "boolean" || this.isEnum(key)) {
                    query += key + ':' + user[key] + ' ';
                } else {
                    query += key + ':"' + user[key] + '" ';
                }
            }
        }

        query += "})}";
        const registerQuery = { query };
        return await this.request.postGraphQL(registerQuery);
    };

    /**
        Log user in and return token
        @param String email
        @param String password
        @return String token
    */
    public login = async function (email: string, password: string): Promise<any> {
        let loginQuery = {
            query: `mutation{
            login(email:"${email}" password:"${password}"){
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

    public getRequestSender: () => any = () => {
        return this.request;
    };

    private isEnum: (key: string) => boolean = (key) => {
        return this.enumSet.has(key);
    }
};
