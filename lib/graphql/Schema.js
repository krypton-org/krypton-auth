const { composeWithMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
let config = require('../config');
const UserSchema = require('../model/UserSchema');
const UserModel = require('../model/UserModel');
const mongoose = require('mongoose');
const MongooseSchema = mongoose.Schema;
let UserController = require('../controllers/UserController');
const { WrongTokenError } = require('../service/error/ErrorTypes');


let privateFields = Object.keys(UserSchema).filter(x => !UserSchema[x].isPublic);
let hidedFields = Object.keys(UserSchema).filter(x => UserSchema[x].isInternal);
let uneditableFields = Object.keys(UserSchema).filter(x => UserSchema[x].isUneditable);

const UserPublicInfoTC = composeWithMongoose(UserModel, {
    name: "UserPublicInfo",
    fields: {
        remove: [...hidedFields, ...privateFields]
    }
});

schemaComposer.Query.addFields({
    userById: UserPublicInfoTC.getResolver('findById'),
    userByIds: UserPublicInfoTC.getResolver('findByIds'),
    userOne: UserPublicInfoTC.getResolver('findOne'),
    userMany: UserPublicInfoTC.getResolver('findMany'),
    userCount: UserPublicInfoTC.getResolver('count'),
    userConnection: UserPublicInfoTC.getResolver('connection'),
    userPagination: UserPublicInfoTC.getResolver('pagination')
});

const convertedPrivateFields = composeWithMongoose(mongoose.model('mock', new MongooseSchema(UserSchema)), {
    fields: {
        remove: [...hidedFields]
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

schemaComposer.Query.addFields({
    me: {
        type: UserTC,
        resolve: async (_, { }, context) => {
            try{
                return await UserModel.findById(context.req.user._id)
            } catch(err){
                throw new WrongTokenError("User not found, please log in!")
            }
        }
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
    },
    sendVerificationEmail: {
        type: NotificationsTC,
        resolve: async (_, { }, context) => UserController.resendConfirmationEmail(context.req),

    },
    sendPasswordRecorevyEmail: {
        type: NotificationsTC,
        args: {
            email: 'String!',
        },
        resolve: (_, { email }, context) => UserController.sendPasswordRecoveryEmail(email, context.req),
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
        resolve: async (_, { password, passwordRecoveryToken }) => UserController.recoverPassword(password, passwordRecoveryToken),
    },
});

module.exports = schemaComposer.buildSchema();