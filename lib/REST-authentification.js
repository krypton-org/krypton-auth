const fs = require('fs');
const { generateKeys } = require('./service/crypto/RSAKeysGeneration');
const path = require('path');
const graphqlHTTP = require('express-graphql');
const { composeWithMongoose } = require('graphql-compose-mongoose');
const { schemaComposer, typeComposer } = require('graphql-compose');
const DEFAULT_PUBLIC_KEY_FILE = path.resolve(__dirname, './public-key.txt');
const DEFAULT_PRIVATE_KEY_FILE = path.resolve(__dirname, './private-key.txt');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Create a REST-authentification application.
 *
 * @return {Express app}
 * @api public
 */

function createApplication(options) {
    if (!options) options = {};

    if (options.publicKey === undefined || options.privateKey === undefined) {
        if (options.publicKeyFilePath !== undefined || options.privateKeyFilePath !== undefined) {
            options.publicKey = fs.readFileSync(options.publicKeyFilePath).toString();
            options.privateKey = fs.readFileSync(options.privateKeyFilePath).toString();
        } else if (fs.existsSync(DEFAULT_PUBLIC_KEY_FILE) && fs.existsSync(DEFAULT_PRIVATE_KEY_FILE)) {
            options.publicKey = fs.readFileSync(DEFAULT_PUBLIC_KEY_FILE).toString();
            options.privateKey = fs.readFileSync(DEFAULT_PRIVATE_KEY_FILE).toString();
        } else {
            const { publicKey, privateKey } = generateKeys();
            fs.writeFileSync(DEFAULT_PRIVATE_KEY_FILE, privateKey, (err) => console.log(err));
            fs.writeFileSync(DEFAULT_PUBLIC_KEY_FILE, publicKey, (err) => console.log(err));
            options.publicKey = publicKey;
            options.privateKey = privateKey;
        }
    }

    let config = require('./config');
    Object.keys(options).map(prop => {
        if (typeof (config[prop]) === "object" && typeof (options[prop]) !== "string") {
            config[prop] = {
                ...config[prop], ...options[prop]
            }
        } else {
            config[prop] = options[prop];
        }
    });
    const db = require('./service/db/db');
    db.init()

    const express = require('express');
    const bodyParser = require('body-parser');
    const morgan = require('morgan');
    const helmet = require('helmet');
    const Router = require('./router/Router');
    const ErrorHandler = require('./service/error/ErrorHandler');
    const UserModel = require('./model/UserModel');
    const multer = require('multer');
    const app = express();

    let privateFields = Object.keys(UserModel.schema.obj).filter(x => !UserModel.schema.obj[x].isPublic);
    let hidedFields = Object.keys(UserModel.schema.obj).filter(x => UserModel.schema.obj[x].isInternal);
    let uneditableFields = Object.keys(UserModel.schema.obj).filter(x => UserModel.schema.obj[x].isUneditable);

    const UserPublicInfosTC = composeWithMongoose(UserModel, {
        fields: {
            remove: [...hidedFields, ...privateFields]
        }
    });

    schemaComposer.Query.addFields({
        userById: UserPublicInfosTC.getResolver('findById'),
        userByIds: UserPublicInfosTC.getResolver('findByIds'),
        userOne: UserPublicInfosTC.getResolver('findOne'),
        userMany: UserPublicInfosTC.getResolver('findMany'),
        userCount: UserPublicInfosTC.getResolver('count'),
        userConnection: UserPublicInfosTC.getResolver('connection'),
        userPagination: UserPublicInfosTC.getResolver('pagination')
    });

    const convertedPrivateFields = composeWithMongoose(mongoose.model('mock', new Schema(require('./model/UserSchema'))), {
        fields: {
            remove: [...hidedFields]
        }
    }).getFields()

    const UserTC = UserPublicInfosTC.clone("user");
    UserTC.addFields(convertedPrivateFields)

    const UserRegisterInputTC = schemaComposer.createInputTC({
        name: 'UserRegisterInput',
    });
    UserRegisterInputTC.addFields(UserTC.getFields());
    UserRegisterInputTC.addFields({
        password: 'String!',
    })
    UserRegisterInputTC.removeField([...uneditableFields, "_id"]);

    const UserUpdateInputTC = schemaComposer.createInputTC({
        name: 'UserUpdateInput',
    });
    UserUpdateInputTC.addFields(UserTC.getFields());
    UserUpdateInputTC.addFields({
        password: 'String',
        previousPassword: 'String',
    })
    UserUpdateInputTC.removeField([...uneditableFields, "_id"]);

    const NotificationTypeTC = schemaComposer.createEnumTC({
        name: 'NotificationType',
        values: {
            ERROR: { value: "error" },
            SUCCESS: { value: "success" },
            WARNING: { value: "warning" },
            INFO: { value: "info" },
        },
    });

    const NotificationTC = schemaComposer.createObjectTC({
        name: 'Notification',
        fields: {
            type: 'NotificationType!',
            message: 'String!',
        },
    });

    const NotificationsTC = schemaComposer.createObjectTC({
        name: 'Notifications',
        fields: {
            notifications: '[Notification]'
        },
    });

    const PublicKeyTC = schemaComposer.createObjectTC({
        name: 'PublicKey',
        fields: {
            value: 'String!',
        },
    });

    const IsAvailableTC = schemaComposer.createObjectTC({
        name: 'IsAvailable',
        fields: {
            isAvailable: 'Boolean!',
        },
    });

    const UserAndTokenTC = schemaComposer.createObjectTC({
        name: 'UserAndToken',
        fields: {
            user: UserTC,
            token: 'String!',
        },
    });


    const RequestTC = schemaComposer.createObjectTC({
        name: 'Request',
        fields: {
            user: UserTC,
            token: 'String!',
            notifications: [NotificationTC],
        },
    });

    let UserController = require('./controllers/UserController');

    schemaComposer.Query.addFields({
        me: {
            type: UserTC,
            resolve: ({ context }) => context.req.user,
        },
        publicKey: {
            type: 'PublicKey',
            resolve: () => {
                return {
                    value: config.publicKey
                }
            },
        },
        usernameAvailable: {
            type: "IsAvailable",
            args: {
                username: 'String!', //email or username
            },
            resolve: async (_, { username }) => await UserController.checkUsernameAvailable(username),
        },
        emailAvailable: {
            type: "IsAvailable",
            args: {
                email: 'String!', //email or username
            },
            resolve: async (_, { email }) => await UserController.checkEmailAvailable(email),
        }
    });

    schemaComposer.Mutation.addFields({
        login: {
            type: UserAndTokenTC,
            args: {
                login: 'String!', //email or username
                password: 'String!',
            },
            resolve: async (_, { login, password }) => await UserController.getAuthToken(login, password),
        },
        register: {
            type: NotificationsTC,
            args: {
                fields: 'UserRegisterInput!',
            },
            resolve: async (_, { fields }, context) => await UserController.createUser(fields, context.req),
        },
        updateMe: {
            type: RequestTC,
            args: {
                fields: 'UserUpdateInput!',
            },
            resolve: async (_, { fields }, context) => UserController.updateUser(fields, context.req),
        },
        deleteMe: {
            type: NotificationsTC,
            args: {
                password: 'String!',
            },
            resolve: async (_, { password }, context) => UserController.deleteUser(password, context.req),
        },
        resetMyPassword: {
            type: NotificationsTC,
            args: {
                password: 'String!',
                passwordRecoveryToken: "String!"
            },
            resolve: async ({ password, context }) => UserController.recoverPassword(password, context.req),
        },
        sendVerificationEmail: {
            type: NotificationsTC,
            resolve: async(_, {}, context) => UserController.resendConfirmationEmail(context.req),
    
        },
        sendPasswordRecorevyEmail: {
            type: NotificationsTC,
            args: {
                email: 'String!',
            },
            resolve: (_, { email }, context) => UserController.sendPasswordRecoveryEmail(email, context.req),
        }
    });

    const graphqlSchema = schemaComposer.buildSchema();
    app.use((req, res, next) => {
        req.options = options;
        next();
    });
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(multer().none());
    app.use(morgan('combined'));
    app.use(helmet());
    app.use(async (req, res, next) => {
        const bearerHeader = req.headers['authorization'];
        if (typeof bearerHeader !== 'undefined') {
            const bearer = bearerHeader.split(' ');
            const bearerToken = bearer[1];
            try {
                const user = await UserModel.verify(bearerToken, req.options.publicKey);
                req.user = user;
                next();
            } catch (err) {
                next(err);
            }
        } else {
            next();
        }
    });
    app.use(Router);
    app.use(ErrorHandler);
    app.use(
        '/graphql',
        graphqlHTTP(async (req, res) => {
            return {
                schema: graphqlSchema,
                graphiql: config.graphiql,
                context: {
                    req: req,
                },
            };
        })
    );

    app.use(function (err, req, res, next) {
        if (options.errorlogFile) fs.appendFile(congig.errorlogFile, JSON.stringify(job.attrs.data) + '\n');
        const notifications = [];
        notifications.push({ type: 'error', message: 'A mistake has happened. Sorry for the inconvenience, we are going to investigate it.' })
        res.json({ notifications: notifications });
    });
    return app;
}

exports = module.exports = createApplication;
