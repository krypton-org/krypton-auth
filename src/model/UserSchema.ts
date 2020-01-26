/**
 * Module returning the Mongoose schema merging the default one with the fields provided by the package user through the `extendedSchema` property.
 * @module Model/UserSchema
 */

import config from '../config';

//Default Mongoose schema.
const basicSchema = {
    username: {
        type: String,
        required: true,
        unique: true,
        maxlength: 128,
        validate: {
            validator: v => /^[a-zA-Z0-9\-_.]{4,}$/.test(v),
            message: props => {
                if (props.value.length < 4) {
                    return 'The username must contains more than 4 characters!';
                } else {
                    return 'A username may only contain letters, numbers, dashes, dots and underscores !';
                }
            },
        },
        isPublic: true,
    },
    email: {
        isPublic: false,
        lowercase: true,
        maxlength: 256,
        required: true,
        type: String,
        unique: true,
        validate: {
            validator: v =>
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                    v,
                ),
            message: () => 'This email address is not valid!',
        },
    },
    password: {
        isInternal: true,
        isPublic: false,
        required: true,
        type: String,
    },
    passwordSalt: {
        isInternal: true,
        isPublic: false,
        required: true,
        type: String,
    },
    verified: {
        default: false,
        isPublic: true,
        isUneditable: true,
        required: true,
        type: Boolean,
    },
    verificationToken: {
        isInternal: true,
        isPublic: false,
        type: String,
    },
    passwordRecoveryToken: {
        isInternal: true,
        isPublic: false,
        type: String,
    },
    passwordRecoveryRequestDate: {
        isInternal: true,
        isPublic: false,
        type: Date,
    },
    refreshToken: {
        isInternal: true,
        isPublic: false,
        type: String,
    },
    refreshTokenExpiryDate: {
        isInternal: true,
        isPublic: false,
        type: Date,
    },
};

/** Mongoose User schema: built merging the default User schema with the fields provided by the package user through the `extendedSchema` property. */
const UserSchema: any = {
    ...basicSchema,
    ...config.extendedSchema,
};

/**
 * List of private fields. Fields that are private to users (like email address) and not shared with the public queries (`userById`, `userMany`...) of the API .
 */
const privateFields: string[] = Object.keys(UserSchema).filter(x => !UserSchema[x].isPublic);

/**
 * List of internal fields. Fields that are internal to the system, nobody can access it (like user password hash and salt).
 */
const internalFields: string[] = Object.keys(UserSchema).filter(x => UserSchema[x].isInternal);

/**
 * List of uneditable fields. Users can't change the value of those fields (like if the user is `verified`)
 */
const uneditableFields: string[] = Object.keys(UserSchema).filter(x => UserSchema[x].isUneditable);

if (!config.hasUsername) {
    delete UserSchema.username;
}

export { UserSchema, internalFields, privateFields, uneditableFields };
