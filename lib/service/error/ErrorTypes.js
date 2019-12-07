class OperationalError extends Error {
    constructor(message) {
        super();
        this.message = message;
    }
}

module.exports = {
    OperationalError,
    EmailAlreadyExistsError: class extends OperationalError { },
    UsernameAlreadyExistsError: class extends OperationalError { },
    WrongPasswordError: class extends OperationalError { },
    WrongPasswordError: class extends OperationalError { },
    WrongLoginError: class extends OperationalError { },
    UpdatePasswordTooLateError: class extends OperationalError { },
    EmailNotSentError: class extends OperationalError { },
    UserNotFound: class extends OperationalError { },
    WrongTokenError: class extends OperationalError { },
    UnknownUser: class extends OperationalError { },
    OutdatedTokenError: class extends OperationalError { },
    EmailAlreadyConfirmedError: class extends OperationalError { },
    UserValidationError: class extends OperationalError { },
    AlreadyLoggedInError: class extends OperationalError { },
    EncryptionFailedError: class extends OperationalError { },
}