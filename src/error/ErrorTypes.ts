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

}

/**
 * Password does not match.
 * @export
 * @class WrongPasswordError
 * @extends {OperationalError}
 */
export class WrongPasswordError extends OperationalError {

}

/**
 * Account recorery email too old
 * @export
 * @class UpdatePasswordTooLateError
 * @extends {OperationalError}
 */
export class UpdatePasswordTooLateError extends OperationalError {

}

/**
 * Email could not be sent.
 * @export
 * @class EmailNotSentError
 * @extends {OperationalError}
 */
export class EmailNotSentError extends OperationalError {

}

/**
 * User not found.
 * @export
 * @class UserNotFoundError
 * @extends {OperationalError}
 */
export class UserNotFoundError extends OperationalError {

}

/**
 * Request not authorized.
 * @export
 * @class UnauthorizedError
 * @extends {OperationalError}
 */
export class UnauthorizedError extends OperationalError {

}

/**
 * User token encryption failed.
 * @export
 * @class TokenEncryptionError
 * @extends {OperationalError}
 */
export class TokenEncryptionError extends OperationalError {

}

/**
 * Email already confirmed.
 * @export
 * @class EmailAlreadyConfirmedError
 * @extends {OperationalError}
 */
export class EmailAlreadyConfirmedError extends OperationalError {

}

/**
 * User updates do not pass the fields' validator.
 * @export
 * @class UserValidationError
 * @extends {OperationalError}
 */
export class UserValidationError extends OperationalError {

}

/**
 * User already logged in.
 * @export
 * @class AlreadyLoggedInError
 * @extends {OperationalError}
 */
export class AlreadyLoggedInError extends OperationalError {

}

/**
 * Encryption failed.
 * @export
 * @class EncryptionFailedError
 * @extends {OperationalError}
 */
export class EncryptionFailedError extends OperationalError {

}
