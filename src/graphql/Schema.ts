import { composeWithMongoose } from 'graphql-compose-mongoose';
import { schemaComposer } from 'graphql-compose';
import config from '../config';
import { UserSchema, internalFields, privateFields, uneditableFields } from '../model/UserSchema';
import UserModel from '../model/UserModel';
import mongoose from 'mongoose';
import UserController from '../controllers/UserController';
import { WrongTokenError } from '../service/error/ErrorTypes';

const MongooseSchema = mongoose.Schema;


const UserPublicInfoTC = composeWithMongoose(UserModel, {
    name: "UserPublicInfo",
    fields: {
        remove: [...internalFields, ...privateFields]
    }
});

schemaComposer.Query.addFields({
    userById: UserPublicInfoTC.getResolver('findById'),
    userByIds: UserPublicInfoTC.getResolver('findByIds'),
    userOne: UserPublicInfoTC.getResolver('findOne'),
    userMany: UserPublicInfoTC.getResolver('findMany'),
    userCount: UserPublicInfoTC.getResolver('count'),
    userPagination: UserPublicInfoTC.getResolver('pagination')
});

const convertedPrivateFields = composeWithMongoose(mongoose.model('mock', new MongooseSchema(UserSchema)), {
    fields: {
        remove: [...internalFields]
    }
}).getFields()

const UserTC = UserPublicInfoTC.clone("User");
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
        expiryDate: 'Date!',
        token: 'String!',
    },
});

const TokenTC = schemaComposer.createObjectTC({
    name: 'Token',
    fields: {
        expiryDate: 'Date!',
        token: 'String!',
    },
});

const UserAndNotifications = schemaComposer.createObjectTC({
    name: 'UserAndNotifications',
    fields: {
        user: UserTC,
        notifications: [NotificationTC],
    },
});

schemaComposer.Query.addFields({
    me: {
        type: UserTC,
        resolve: async (_, { }, context) => {
            try {
                return await UserModel.findById(context.req.user._id)
            } catch (err) {
                throw new WrongTokenError("User not found, please log in!")
            }
        }
    },
    publicKey: {
        type: 'String!',
        resolve: () => {
            return config.publicKey
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
    },
    sendVerificationEmail: {
        type: NotificationsTC,
        resolve: async (_, { }, { req }) => UserController.resendConfirmationEmail(req),

    },
    sendPasswordRecorevyEmail: {
        type: NotificationsTC,
        args: {
            email: 'String!',
        },
        resolve: (_, { email }, { req }) => UserController.sendPasswordRecoveryEmail(email, req),
    }
});

schemaComposer.Mutation.addFields({
    login: {
        type: UserAndTokenTC,
        args: {
            login: 'String!', //email or username
            password: 'String!',
        },
        resolve: async (_, { login, password }, { res }) => await UserController.login(login, password, res),
    },
    refreshToken: {
        type: TokenTC,
        resolve: async (_, { }, { req, res }) => await UserController.refreshToken(req, res),
    },
    register: {
        type: NotificationsTC,
        args: {
            fields: 'UserRegisterInput!',
        },
        resolve: async (_, { fields }, { req }) => await UserController.createUser(fields, req),
    },
    updateMe: {
        type: UserAndNotifications,
        args: {
            fields: 'UserUpdateInput!',
        },
        resolve: async (_, { fields }, { req, res }) => UserController.updateUser(fields, req, res),
    },
    deleteMe: {
        type: NotificationsTC,
        args: {
            password: 'String!',
        },
        resolve: async (_, { password }, { req }) => UserController.deleteUser(password, req),
    },
    resetMyPassword: {
        type: NotificationsTC,
        args: {
            password: 'String!',
            passwordRecoveryToken: "String!"
        },
        resolve: async (_, { password, passwordRecoveryToken }) => UserController.recoverPassword(password, passwordRecoveryToken),
    },
});

export default schemaComposer.buildSchema();