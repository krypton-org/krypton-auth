/**
 * Module defining common error that can be raised by normal service usage. Like trying to log-in with a wrong password. Those errors have to be handle within the application logic code.
 * @module error/ErrorTypes;'
 */

/**
 * Common errors raised by service functions under certain conditions. Should be handled within the application.
 * @class
 * @classdesc This is a description of the MyClass class.
 */
export default class OperationalError extends Error {
    public message: string;
    public type: string;

    constructor(message: string, type? : string) {
        super();
        this.message = message;
        this.type = (type) ? type : this.constructor.name;
    }
}

export class EmailAlreadyExistsError extends OperationalError {
    constructor(message) {
        super(message);
    }
}
export class UsernameAlreadyExistsError extends OperationalError {
    constructor(message) {
        super(message);
    }
}
export class WrongPasswordError extends OperationalError {
    constructor(message) {
        super(message, 'UserNotFound');
    }
}
export class WrongLoginError extends OperationalError {
    constructor(message) {
        super(message, 'UserNotFound');
    }
}
export class UpdatePasswordTooLateError extends OperationalError {
    constructor(message) {
        super(message);
    }
}
export class EmailNotSentError extends OperationalError {
    constructor(message) {
        super(message);
    }
}
export class UserNotFound extends OperationalError {
    constructor(message) {
        super(message);
    }
}
export class WrongTokenError extends OperationalError {
    constructor(message) {
        super(message);
    }
}
export class UnknownUser extends OperationalError {
    constructor(message) {
        super(message);
    }
}
export class OutdatedTokenError extends OperationalError {
    constructor(message) {
        super(message);
    }
}
export class EmailAlreadyConfirmedError extends OperationalError {
    constructor(message) {
        super(message);
    }
}
export class UserValidationError extends OperationalError {
    constructor(message) {
        super(message);
    }
}
export class AlreadyLoggedInError extends OperationalError {
    constructor(message) {
        super(message);
    }
}
export class EncryptionFailedError extends OperationalError {
    constructor(message) {
        super(message);
    }
}
