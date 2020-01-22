import crypto from 'crypto';
import User from '../model/UserModel';
import agenda from '../service/agenda/agenda';
import config from '../config';
import ejs from 'ejs';
import {
    EmailAlreadyExistsError,
    UsernameAlreadyExistsError,
    WrongPasswordError,
    WrongLoginError,
    UserNotFound,
    UnknownUser,
    EmailAlreadyConfirmedError,
    UserValidationError,
    UpdatePasswordTooLateError,
    AlreadyLoggedInError
} from '../service/error/ErrorTypes';
const TOKEN_LENGTH = 64;
const REFRESH_TOKEN_LENGTH = 256;
const DELAY_TO_CHANGE_PASSWORD_IN_MINUTS = 60;

class Notification {
    type: string;
    message: string;
}

const ensureLoggedIn = (req: any): void | never => {
    if (req.user === undefined) throw new UnknownUser('Please login!');
}

const generateToken = (tokenLength: number): string => {
    return crypto.randomBytes(tokenLength).toString("hex");
};

const sendConfirmationEmail = (user: any, confirmationToken: string, host: string): void => {
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

export default class UserController {
    static checkEmailAvailable = async function (email: string): Promise<{ isAvailable: boolean }> {
        const emailExists = await User.userExists({ email })
        return { isAvailable: !emailExists };
    };

    static checkUsernameAvailable = async function (username: string) {
        const usernameExists = await User.userExists({ username })
        return { isAvailable: !usernameExists };
    };

    static confirmEmail = async function (req: any, res: any, next: any): Promise<void | never> {
        const notifications: Notification[] = [];
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

    static createUser = async function (user: any, req: any): Promise<{ user: any, notifications: Notification[] } | never> {
        const notifications: Notification[] = [];
        user.verificationToken = generateToken(TOKEN_LENGTH);

        if (!user.password) throw new WrongPasswordError("Please provide a password!")

        if (user.password.length < 8) {
            throw new WrongPasswordError("The password must contain at least 8 characters!");
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

    static resendConfirmationEmail = async function (req: any): Promise<{ notifications: Notification[] } | never> {
        ensureLoggedIn(req);
        const notifications: Notification[] = [];
        const user = await User.getUser({ _id: req.user._id });
        if (user.verified) {
            throw new EmailAlreadyConfirmedError("Your email adress has already been confirmed.")
        } else {
            sendConfirmationEmail(req.user, user.verificationToken, config.host ? config.host : req.headers.host)
            notifications.push({ type: 'success', message: 'You will receive a confirmation link at your email address in a few minutes.' })
        }
        return { notifications: notifications };
    };

    static recoverPassword = async function (password: string, passwordRecoveryToken: string): Promise<{ notifications: Notification[] } | never> {
        let notifications = [];
        if (password.length < 8) {
            throw new WrongPasswordError("The password must contain at least 8 characters!");
        }
        const userExists = await User.userExists({ 'passwordRecoveryToken': passwordRecoveryToken })
        if (!userExists) throw new UserNotFound("Unvalid token!");
        const user = await User.getUser({ 'passwordRecoveryToken': passwordRecoveryToken })
        let resetDate = new Date(user.passwordRecoveryRequestDate);
        let actualDate = new Date();
        let diff = Math.abs(actualDate.getTime() - resetDate.getTime());
        let minutes = Math.floor((diff / 1000) / 60);
        if (minutes >= DELAY_TO_CHANGE_PASSWORD_IN_MINUTS)
            throw new UpdatePasswordTooLateError("This link has expired, please ask a new one.");
        await User.updateUser({ _id: user.id }, { password: password, passwordRecoveryToken: undefined, passwordRecoveryRequestDate: undefined });
        notifications.push({ type: "success", message: "Your password is updated!" })
        return { notifications: notifications };
    }

    static updateUser = async function (userUpdates: any, req: any, res: any): Promise<{ user: any, notifications: Notification[] } | never> {
        ensureLoggedIn(req);
        let notifications = [];

        const { refreshToken } = await User.getUser({ _id: req.user._id });
        if (req.cookies.refreshToken != refreshToken) {
            res.status(401);
            throw new Error('Unauthorized access!');
        }

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
            let isEmailVerified = true;

            if (req.user.verified && userUpdates.email) {
                userUpdates.verificationToken = generateToken(TOKEN_LENGTH);
                userUpdates.verified = false;
                isEmailVerified = false;
            }

            await User.updateUser({ _id: req.user._id }, userUpdates);
            req.user = await User.getUserNonInternalFields({ _id: req.user._id })
            notifications.push({ type: 'success', message: 'User information updated!' });

            if (!isEmailVerified) {
                sendConfirmationEmail(req.user, userUpdates.verificationToken, config.host ? config.host : req.headers.host);
                notifications.push({ type: 'info', message: 'You will receive a confirmation link at your email address in a few minutes.' });
            }
            return {
                notifications,
                user: req.user
            };
        } catch (err) {
            if (err.message.includes("username") && err.message.includes("duplicate key")) throw new UsernameAlreadyExistsError("Username already exists");
            if (err.message.includes("email") && err.message.includes("duplicate key")) throw new EmailAlreadyExistsError("Email already exists");
            throw new UserValidationError(err.message.replace("user validation failed: email: ", ""));
        }
    };


    static deleteUser = async function (password: string, req: any): Promise<{ notifications: Notification[] } | never> {
        ensureLoggedIn(req);
        const notifications: Notification[] = [];
        const isValid = await User.isPasswordValid({ _id: req.user._id }, password)
        if (!isValid) {
            throw new WrongPasswordError("You entered a wrong password");
        }
        await User.removeUser({ _id: req.user._id });
        notifications.push({ type: 'success', message: 'Your account has been deleted.' })
        return { notifications };
    };

    static login = async function (login: string, password: string, res: any): Promise<{ token: string, user: any } | never> {
        let payload: { token: string, user: any };
        const emailExists = await User.userExists({ email: login })
        const usernameExists = await User.userExists({ username: login });
        if (emailExists)
            payload = await User.sign({ email: login }, password, config.privateKey);
        else if (usernameExists)
            payload = await User.sign({ username: login }, password, config.privateKey);
        else {
            res.status(401);
            throw new WrongLoginError('Wrong credentials!');
        }

        const user = await User.getUser({ _id: payload.user._id });
        let refreshToken = user.refreshToken;
        if ((!refreshToken) ||
            (!user.refreshTokenExpiryDate) ||
            (user.refreshTokenExpiryDate < new Date())) {
            refreshToken = generateToken(REFRESH_TOKEN_LENGTH);
            const refreshTokenExpiryDate = new Date();
            refreshTokenExpiryDate.setTime(refreshTokenExpiryDate.getTime() + config.refreshTokenExpiryTime);
            await User.update({ _id: payload.user._id }, { refreshToken, refreshTokenExpiryDate });
        }

        res.cookie('refreshToken', refreshToken, { httpOnly: true });
        return payload;
    };

    static sendPasswordRecoveryEmail = async function (email: string, req: any): Promise<{ notifications: Notification[] } | never> {
        const notifications: Notification[] = [];
        notifications.push({ type: 'info', message: 'If your email address exists in our database, you will receive a password recovery link at your email address in a few minutes.' })
        if (req.user !== undefined) {
            throw new AlreadyLoggedInError('Oups, you are already logged in!');
        }

        let exists = await User.userExists({ email: email });
        if (!exists) return { notifications };
        let passwordRecoveryToken = generateToken(TOKEN_LENGTH);
        let passwordRecoveryRequestDate = new Date();
        await User.update({ email }, { 'passwordRecoveryToken': passwordRecoveryToken, 'passwordRecoveryRequestDate': passwordRecoveryRequestDate });
        let user = await User.getUser({ email: email });
        const host = config.host ? config.host : req.headers.host;
        agenda.now('email', {
            locals: {
                link: "http://" + host + "/form/reset/password?token=" + passwordRecoveryToken,
                user
            },
            template: config.resetPasswordEmailTemplate,
            email: email,
            subject: 'Password Recovery',
        });
        return { notifications };
    };

    static resetPasswordForm = function (req: any, res: any, next: any): void {
        const notifications: Notification[] = [];
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

    static refreshToken = async function (req: any, res: any): Promise<{ token: string; expiryDate: Date; } | never> {
        const user = await User.getUser({ refreshToken: req.cookies.refreshToken });
        const now = new Date();
        if (user && user.refreshTokenExpiryDate && now.getTime() < user.refreshTokenExpiryDate.getTime()) {
            const payload = await User.refreshAuthToken({ _id: user._id }, config.privateKey);
            const refreshToken = generateToken(REFRESH_TOKEN_LENGTH);
            const refreshTokenExpiryDate = new Date();
            refreshTokenExpiryDate.setTime(refreshTokenExpiryDate.getTime() + config.refreshTokenExpiryTime);
            await User.update({ _id: user._id }, { refreshToken, refreshTokenExpiryDate });
            res.cookie('refreshToken', refreshToken, { httpOnly: true });
            return payload;
        } else {
            res.status(401);
            throw new UnknownUser('Please login!');
        }
    };
}

