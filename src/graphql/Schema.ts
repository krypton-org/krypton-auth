/**
 * Module returning the GraphQL schema for the user management API.
 * @module graphql/Schema
 */

import { schemaComposer } from 'graphql-compose';
import { composeWithMongoose } from 'graphql-compose-mongoose';
import mongoose from 'mongoose';
import config from '../config';
import * as UserController from '../controllers/UserController';
import UserModel from '../model/UserModel';
import { internalFields, privateFields, uneditableFields, UserSchema } from '../model/UserSchema';
import { WrongTokenError } from '../services/error/ErrorTypes';

const MongooseSchema = mongoose.Schema;

const UserPublicInfoTC = composeWithMongoose(UserModel, {
    fields: {
        remove: [...internalFields, ...privateFields],
    },
    name: 'UserPublicInfo',
});

schemaComposer.Query.addFields({
    userById: UserPublicInfoTC.getResolver('findById'),
    userByIds: UserPublicInfoTC.getResolver('findByIds'),
    userCount: UserPublicInfoTC.getResolver('count'),
    userMany: UserPublicInfoTC.getResolver('findMany'),
    userOne: UserPublicInfoTC.getResolver('findOne'),
    userPagination: UserPublicInfoTC.getResolver('pagination'),
});

const convertedPrivateFields = composeWithMongoose(mongoose.model('mock', new MongooseSchema(UserSchema)), {
    fields: {
        remove: [...internalFields],
    },
}).getFields();

const UserTC = UserPublicInfoTC.clone('User');
UserTC.addFields(convertedPrivateFields);

const UserRegisterInputTC = schemaComposer.createInputTC('UserRegisterInput');
// @ts-ignore
UserRegisterInputTC.addFields(UserTC.getFields());
UserRegisterInputTC.addFields({
    password: 'String!',
});
UserRegisterInputTC.removeField([...uneditableFields, '_id']);
const UserUpdateInputTC = schemaComposer.createInputTC('UserUpdateInput');
// @ts-ignore
UserUpdateInputTC.addFields(UserTC.getFields());
UserUpdateInputTC.addFields({
    password: 'String',
    previousPassword: 'String',
});
UserUpdateInputTC.removeField([...uneditableFields, '_id']);

const NotificationTypeTC = schemaComposer.createEnumTC({
    name: 'NotificationType',
    values: {
        ERROR: { value: 'error' },
        INFO: { value: 'info' },
        SUCCESS: { value: 'success' },
        WARNING: { value: 'warning' },
    },
});

const NotificationTC = schemaComposer.createObjectTC({
    fields: {
        message: 'String!',
        type: 'NotificationType!',
    },
    name: 'Notification',
});

const NotificationsTC = schemaComposer.createObjectTC({
    fields: {
        notifications: '[Notification]',
    },
    name: 'Notifications',
});

const PublicKeyTC = schemaComposer.createObjectTC({
    fields: {
        value: 'String!',
    },
    name: 'PublicKey',
});

const IsAvailableTC = schemaComposer.createObjectTC({
    fields: {
        isAvailable: 'Boolean!',
    },
    name: 'IsAvailable',
});

const UserAndTokenTC = schemaComposer.createObjectTC({
    fields: {
        expiryDate: 'Date!',
        token: 'String!',
        user: UserTC,
    },
    name: 'UserAndToken',
});

const TokenTC = schemaComposer.createObjectTC({
    fields: {
        expiryDate: 'Date!',
        token: 'String!',
    },
    name: 'Token',
});

const UserAndNotifications = schemaComposer.createObjectTC({
    fields: {
        notifications: [NotificationTC],
        user: UserTC,
    },
    name: 'UserAndNotifications',
});

schemaComposer.Query.addFields({
    emailAvailable: {
        args: {
            email: 'String!', // email or username
        },
        resolve: async (_, { email }) => await UserController.checkEmailAvailable(email),
        type: 'IsAvailable',
    },
    me: {
        resolve: async (_, {}, context) => {
            try {
                return await UserModel.findById(context.req.user._id);
            } catch (err) {
                throw new WrongTokenError('User not found, please log in!');
            }
        },
        type: UserTC,
    },
    publicKey: {
        resolve: () => {
            return config.publicKey;
        },
        type: 'String!',
    },
    sendPasswordRecorevyEmail: {
        args: {
            email: 'String!',
        },
        resolve: (_, { email }, { req }) => UserController.sendPasswordRecoveryEmail(email, req),
        type: NotificationsTC,
    },
    sendVerificationEmail: {
        resolve: async (_, {}, { req }) => UserController.resendConfirmationEmail(req),
        type: NotificationsTC,
    },
    usernameAvailable: {
        args: {
            username: 'String!', // email or username
        },
        resolve: async (_, { username }) => await UserController.checkUsernameAvailable(username),
        type: 'IsAvailable',
    },
});

schemaComposer.Mutation.addFields({
    deleteMe: {
        args: {
            password: 'String!',
        },
        resolve: async (_, { password }, { req }) => UserController.deleteUser(password, req),
        type: NotificationsTC,
    },
    login: {
        args: {
            login: 'String!', // email or username
            password: 'String!',
        },
        resolve: async (_, { login, password }, { res }) => await UserController.login(login, password, res),
        type: UserAndTokenTC,
    },
    refreshToken: {
        resolve: async (_, {}, { req, res }) => await UserController.refreshTokens(req, res),
        type: TokenTC,
    },
    register: {
        args: {
            fields: 'UserRegisterInput!',
        },
        resolve: async (_, { fields }, { req }) => await UserController.createUser(fields, req),
        type: NotificationsTC,
    },
    resetMyPassword: {
        args: {
            password: 'String!',
            passwordRecoveryToken: 'String!',
        },
        resolve: async (_, { password, passwordRecoveryToken }) =>
            UserController.recoverPassword(password, passwordRecoveryToken),
        type: NotificationsTC,
    },
    updateMe: {
        args: {
            fields: 'UserUpdateInput!',
        },
        resolve: async (_, { fields }, { req, res }) => UserController.updateUser(fields, req, res),
        type: UserAndNotifications,
    },
});

export default schemaComposer.buildSchema();
