class OperationalError extends Error {
    constructor(message) {
        super();
        this.message = message;
    }
}

module.exports = {
    OperationalError: OperationalError,
    EmailAlreadyExistsError: class EmailAlreadyExistsError extends OperationalError { },
    UsernameAlreadyExistsError: class UsernameAlreadyExistsError extends OperationalError { },
    WrongPasswordError: class WrongPasswordError extends OperationalError { },
    WrongPasswordError: class WrongPasswordError extends OperationalError { },
    WrongLoginError: class WrongLoginError extends OperationalError { },
    UpdatePasswordTooLateError: class UpdatePasswordTooLateError extends OperationalError { },
    EmailNotSentError: class EmailNotSentError extends OperationalError { },
    UserNotFound: class UserNotFound extends OperationalError { },
    WrongTokenError: class WrongTokenError extends OperationalError { },
    UnknownUser: class UnknownUser extends OperationalError { },
    OutdatedTokenError: class OutdatedTokenError extends OperationalError { },
    EmailAlreadyConfirmedError: class EmailAlreadyConfirmedError extends OperationalError { },
    UserValidationError: class UserValidationError extends OperationalError { },
}