export default class OperationalError extends Error {
    constructor(message) {
        super();
        this.message = message;
    }
}

export class EmailAlreadyExistsError extends OperationalError {}
export class UsernameAlreadyExistsError extends OperationalError {}
export class WrongPasswordError extends OperationalError {}
export class WrongLoginError extends OperationalError {}
export class UpdatePasswordTooLateError extends OperationalError {}
export class EmailNotSentError extends OperationalError {}
export class UserNotFound extends OperationalError {}
export class WrongTokenError extends OperationalError {}
export class UnknownUser extends OperationalError {}
export class OutdatedTokenError extends OperationalError {}
export class EmailAlreadyConfirmedError extends OperationalError {}
export class UserValidationError extends OperationalError {}
export class AlreadyLoggedInError extends OperationalError {}
export class EncryptionFailedError extends OperationalError {}
