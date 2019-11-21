const crypto = require('crypto');
const User = require('../model/UserModel');
const agenda = require('../service/agenda/agenda');
const config = require('../config');
const ejs = require('ejs')
const {
    EmailAlreadyExistsError,
    UsernameAlreadyExistsError,
    WrongPasswordError,
    WrongLoginError,
    UserNotFound,
    UnknownUser,
    EmailAlreadyConfirmedError,
    UserValidationError
} = require('../service/error/ErrorTypes');

const TOKEN_LENGTH = 64;
const DELAY_TO_CHANGE_PASSWORD_IN_MINUTS = 60;

const ensureLoggedIn = (req) => {
    if (req.user === undefined) throw new UnknownUser('Please login!');
}

const generateToken = function (cb) {
    return crypto.randomBytes(TOKEN_LENGTH, cb).toString("hex");
};

exports.checkEmailAvailable = async function (email) {
    const emailExists = await User.userExists({ email })
    return { isAvailable: !emailExists };
};

exports.checkUsernameAvailable = async function (username) {
    const usernameExists = await User.userExists({ username })
    return { isAvailable: !usernameExists };
};

exports.confirmEmail = async function (req, res, next) {
    const notifications = [];
    let token = req.query.token;
    try {
        const exists = await User.userExists({ 'verificationToken': token })
        if (!exists) throw new UserNotFound("This link is no longer valid.");
        const user = await User.getUser({ 'verificationToken': token })
        await User.update({ email: user.email }, { 'verificationToken': null, 'verified': true, });
        notifications.push({ type: 'success', message: 'You are now verified!' })
    } catch (err) {
        notifications.push({ type: 'error', message: 'This link is not valid!' })
    } finally {
        ejs.renderFile(config.notificationPageTemplate, { notifications }, { notifications }, function (err, html) {
            if (err) {
                next(err);
            } else {
                res.send(html);
            }
        });
    }
};

exports.createUser = async function (user, req) {
    const notifications = [];
    user.verificationToken = generateToken();

    if (!user.password) throw new Error("Please provide a password!")

    if (user.password.length < 8) {
        throw new Error("The password must contain at least 8 characters!");
    }
    try {
        await User.createUser(user);
        notifications.push({ type: 'success', message: 'User created!' });
        sendConfirmationEmail(user, user.verificationToken, config.host ? config.host : req.headers.host);
        notifications.push({ type: 'info', message: 'You will receive a confirmation link at your email address in a few minutes.' })
        return { notifications, user };
    } catch (err) {
        if (err.message.includes("username") && err.message.includes("duplicate key")) throw new UsernameAlreadyExistsError("Username already exists");
        if (err.message.includes("email") && err.message.includes("duplicate key")) throw new EmailAlreadyExistsError("Email already exists");
        throw new UserValidationError(err.message.replace("user validation failed: email: Path ", ""));
    }
};

exports.resendConfirmationEmail = async function (req) {
    ensureLoggedIn(req);
    const notifications = [];
    const user = await User.getUser({ _id: req.user._id });
    if (user.verified) {
        throw new EmailAlreadyConfirmedError("Your email adress has already been confirmed.")
    } else {
        sendConfirmationEmail(req.user, user.verificationToken, config.host ? config.host : req.headers.host)
        notifications.push({ type: 'success', message: 'You will receive a confirmation link at your email address in a few minutes.' })
    }
    return { notifications: notifications };
};

exports.recoverPassword = async function (password, passwordRecoveryToken) {
    let notifications = [];
    if (password.length < 8) {
        throw new WrongPasswordError("The password must contain at least 8 characters!" );
    }
    if (passwordRecoveryToken) {
        const userExists = await User.userExists({ 'passwordRecoveryToken': passwordRecoveryToken })
        if (!userExists) throw new UserNotFound("Unvalid token!");
        const user = await User.getUser({ 'passwordRecoveryToken': passwordRecoveryToken })
        let resetDate = new Date(user.passwordRecoveryRequestDate);
        let actualDate = new Date();
        let diff = Math.abs(actualDate - resetDate);
        let minutes = Math.floor((diff / 1000) / 60);
        if (minutes >= DELAY_TO_CHANGE_PASSWORD_IN_MINUTS)
            throw new Error("This link has expired, please ask a new one.");
        await User.updateUser({ _id: user.id }, { password: password, passwordRecoveryToken: undefined, passwordRecoveryRequestDate: undefined });
        notifications.push({ type: "success", message: "Your password is updated!" })
        return { notifications: notifications };
    }
}

exports.updateUser = async function (userUpdates, req) {
    ensureLoggedIn(req);
    let notifications = [];

    if (userUpdates.password && userUpdates.password !== userUpdates.previousPassword) {
        const isValid = await User.isPasswordValid({ email: req.user.email }, userUpdates.previousPassword);
        if (!isValid) {
            throw new WrongPasswordError('Your previous password is wrong!')
        }
        if (userUpdates.password.length < 8) {
            throw new WrongPasswordError("The password must contain at least 8 characters!");
        }
        delete userUpdates.previousPassword;
    }
    try {
        if (req.user.verified && userUpdates.email) {
            userUpdates.verificationToken = generateToken();
            userUpdates.verified = false;
        }

        await User.updateUser({ _id: req.user._id }, userUpdates);
        req.user = await User.getUserPublicInfos({ _id: req.user._id })
        notifications.push({ type: 'success', message: 'User information updated!' });

        const payload = await User.updateToken({ _id: req.user._id }, req.options.privateKey)

        if (req.user.verified && userUpdates.email) {
            sendConfirmationEmail(req.user, userUpdates.verificationToken, config.host ? config.host : req.headers.host);
            notifications.push({ type: 'info', message: 'You will receive a confirmation link at your email address in a few minutes.' });
        }
        return {
            ...payload,
            notifications
        };
    } catch (err) {
        if (err.message.includes("username") && err.message.includes("duplicate key")) throw new UsernameAlreadyExistsError("Username already exists");
        if (err.message.includes("email") && err.message.includes("duplicate key")) throw new EmailAlreadyExistsError("Email already exists");
        throw new UserValidationError(err.message.replace("user validation failed: email: ", ""));
    }
};


exports.deleteUser = async function (password, req) {
    ensureLoggedIn(req);
    const notifications = [];
    const isValid = await User.isPasswordValid({ _id: req.user._id }, password)
    if (!isValid) {
        throw new WrongPasswordError("You entered a wrong password");
    }
    await User.removeUser({ _id: req.user._id });
    notifications.push({ type: 'success', message: 'Your account has been deleted.' })
    return { notifications };
};

const sendConfirmationEmail = (user, confirmationToken, host) => {
    agenda.now('email', {
        email: user.email,
        template: config.verifyEmailTemplate,
        locals: {
            link: "http://" + host + "/user/email/confirmation?token=" + confirmationToken,
            user: user
        },
        subject: 'Activate your account',
    });
};

exports.getAuthToken = async function (login, password) {
    let payload;
    const emailExists = await User.userExists({ email: login })
    const usernameExists = await User.userExists({ username: login });
    if (emailExists)
        payload = await User.sign({ email: login }, password, config.privateKey);
    else if (usernameExists)
        payload = await User.sign({ username: login }, password, config.privateKey);
    else
        throw new WrongLoginError('Wrong credentials!');
    return payload;
};

exports.sendPasswordRecoveryEmail = async function (email, req) {
    const notifications = [];
    notifications.push({ type: 'info', message: 'If your email address exists in our database, you will receive a password recovery link at your email address in a few minutes.' })
    if (req.user !== undefined) {
        throw new Error('Oups, you are already logged in!');
    }

    let exists = await User.userExists({ email: email });
    if (!exists) return { notifications };
    let passwordRecoveryToken = generateToken();
    let passwordRecoveryRequestDate = new Date();
    await User.update({ email: email }, { 'passwordRecoveryToken': passwordRecoveryToken, 'passwordRecoveryRequestDate': passwordRecoveryRequestDate });
    let user = await User.getUser({ email: email });
    const host = config.host ? config.host : req.headers.host;
    agenda.now('email', {
        locals: {
            link: "http://" + host + "/form/reset/password?token=" + passwordRecoveryToken,
            user, user
        },
        template: config.resetPasswordEmailTemplate,
        email: email,
        subject: 'Password Recovery',
    });
    return { notifications };
};

exports.resetPasswordForm = function (req, res, next) {
    const notifications = [];
    if (req.user) {
        notifications.push({ type: 'error', message: 'Oups, you are already logged in!' })
        res.json({ notifications: notifications });
        return;
    }
    const host = config.host ? config.host : req.headers.host;
    const locals = {
        link: "http://" + host + "/graphql",
        token: req.query.token
    }
    ejs.renderFile(config.resetPasswordFormTemplate, locals, {}, function (err, html) {
        if (err) {
            next(err);
        } else {
            res.send(html);
        }
    });
};
