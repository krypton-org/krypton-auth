const config = require('../config')

const basicSchema = {
    username: {
        type: String,
        required: true,
        unique: true,
        maxlength: 128,
        validate: {
            validator: v => /^[a-zA-Z0-9\-_.]{4,}$/.test(v),
            message: props => {
                if (props.value < 4) return "The username must contains more than 4 characters!";
                else return "A username may only contain letters, numbers, dashes, dots and underscores !";
            }
        },
        isPublic: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        maxlength: 256,
        validate: {
            validator: v => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v),
            message: () => "This email address is not valid!",
        },
        isPublic: false
    },
    password: {
        type: String,
        required: true,
        isPublic: false,
        isInternal: true,
    },
    passwordSalt: {
        type: String,
        required: true,
        isPublic: false,
        isInternal: true,
    },
    verified: {
        type: Boolean,
        required: true,
        default: false,
        isPublic: true,
        isUneditable: true
    },
    verificationToken: {
        type: String,
        isPublic: false,
        isInternal: true,
    },
    passwordRecoveryToken: {
        type: String,
        isPublic: false,
        isInternal: true,
    },
    passwordRecoveryRequestDate: {
        type: Date,
        isPublic: false,
        isInternal: true,
    }
};

let schema = {
    ...basicSchema,
    ...config.extendedSchema
}

if (!config.hasUsername) delete schema['username'];

module.exports = schema;