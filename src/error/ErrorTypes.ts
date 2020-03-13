/**
 * Module defining common error that can be raised by normal service usage. Like trying to log-in with a wrong password. Those errors have to be handle within the application logic code.
 * @module error/ErrorTypes;'
 */

/**
 * Common errors raised by service functions under certain conditions. Should be handled within the application.
 * @class
 * @classdesc Common errors raised by system.
 */
export default class OperationalError extends Error {
    public message: string;
    public type: string;
    public statusCode: number;

    constructor(message: string, type?: string) {
        super();
        this.message = message;
        this.type = type ? type : this.constructor.name;
    }
}

/**
 * Email already exists in the database.
 * @export
 * @class EmailAlreadyExistsError
 * @extends {OperationalError}
 */
export class EmailAlreadyExistsError extends OperationalError {
    constructor(message: string, type?: string) {
        super(message, type);
        this.statusCode = 403;
    }
}

/**
 * Username already exists in the database.
 * @export
 * @class UsernameAlreadyExistsError
 * @extends {OperationalError}
 */
export class UsernameAlreadyExistsError extends OperationalError {
    constructor(message: string, type?: string) {
        super(message, type);
        this.statusCode = 403;
    }
}

/**
 * Password does not match.
 * @export
 * @class WrongPasswordError
 * @extends {OperationalError}
 */
export class WrongPasswordError extends OperationalError {
    constructor(message: string, type?: string) {
        super(message, type);
        this.statusCode = 401;
    }
}

/**
 * Account recorery email too old
 * @export
 * @class UpdatePasswordTooLateError
 * @extends {OperationalError}
 */
export class UpdatePasswordTooLateError extends OperationalError {
    constructor(message: string, type?: string) {
        super(message, type);
        this.statusCode = 401;
    }
}

/**
 * Email could not be sent.
 * @export
 * @class EmailNotSentError
 * @extends {OperationalError}
 */
export class EmailNotSentError extends OperationalError {
    constructor(message: string, type?: string) {
        super(message, type);
        this.statusCode = 500;
    }
}

/**
 * User not found.
 * @export
 * @class UserNotFound
 * @extends {OperationalError}
 */
export class UserNotFound extends OperationalError {
    constructor(message: string, type?: string) {
        super(message, type);
        this.statusCode = 401;
    }
}

/**
 * Auth token is wrong.
 * @export
 * @class WrongTokenError
 * @extends {OperationalError}
 */
export class WrongTokenError extends OperationalError {
    constructor(message: string, type?: string) {
        super(message, type);
        this.statusCode = 500;
    }
}

/**
 * Email already confirmed.
 * @export
 * @class EmailAlreadyConfirmedError
 * @extends {OperationalError}
 */
export class EmailAlreadyConfirmedError extends OperationalError {
    constructor(message: string, type?: string) {
        super(message, type);
        this.statusCode = 403;
    }
}

/**
 * User updates do not pass the fields' validator.
 * @export
 * @class UserValidationError
 * @extends {OperationalError}
 */
export class UserValidationError extends OperationalError {
    constructor(message: string, type?: string) {
        super(message, type);
        this.statusCode = 400;
    }
}

/**
 * User already logged in.
 * @export
 * @class AlreadyLoggedInError
 * @extends {OperationalError}
 */
export class AlreadyLoggedInError extends OperationalError {
    constructor(message: string, type?: string) {
        super(message, type);
        this.statusCode = 400;
    }
}

/**
 * Encryption failed.
 * @export
 * @class EncryptionFailedError
 * @extends {OperationalError}
 */
export class EncryptionFailedError extends OperationalError {
    constructor(message: string, type?: string) {
        super(message, type);
        this.statusCode = 500;
    }
}
