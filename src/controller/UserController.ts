/**
 * Service logic for user management.
 * @module controllers/UserController
 */
import ejs from 'ejs';
import { NextFunction, Request, Response } from 'express';
import config from '../config';
import generateToken from '../crypto/TokenGenerator';
import User from '../model/UserModel';
import agenda from '../agenda/agenda';
import {
    AlreadyLoggedInError,
    EmailAlreadyConfirmedError,
    EmailAlreadyExistsError,
    UnknownUser,
    UpdatePasswordTooLateError,
    UsernameAlreadyExistsError,
    UserNotFound,
    UserValidationError,
    WrongLoginError,
    WrongPasswordError,
} from '../error/ErrorTypes';

const TOKEN_LENGTH = 64;
const REFRESH_TOKEN_LENGTH = 256;
const DELAY_TO_CHANGE_PASSWORD_IN_MINUTS = 60;

/**
 * Notification type.
 */
interface Notification {
    type: string;
    message: string;
}

/**
 * Return true if user issuing the request is logged in.
 * @param  {Request} req
 * @returns {boolean} user is logged in
 */
const isUserLoggedIn = (req: Request): boolean => req.user !== undefined;

/**
 * Returns the adress of GraphQL Auth Service
 * @param  {Request} req
 * @returns The adress of the service
 */
const getHostAdress = (req: Request): string => {
    return config.host ? config.host + req.baseUrl : req.protocol + '://' + req.get('host') + req.baseUrl;
};
/**
 * Returns true if a notificaiton should be sent to client with the preview link in case of a mock email.
 * @param  {Request} req
 * @returns {boolean} true if a notificaiton should be sent to client with the preview link in case of a mock email
 */
const isMockEmailAndClientCanReceivePreview = (req: Request): boolean => {
    return !config.mailTransporter && config.graphiql && req.cookies.clientId;
}


/**
 * Send confirmation email to `user`.
 * @param  {any} user - user
 * @param  {string} confirmationToken
 * @param  {string} host - Service public address
 * @returns {void}
 */
const sendConfirmationEmail = (user: any, confirmationToken: string, host: string, clientId?: string): void => {
    agenda.now('email', {
        locals: {
            link: host + '/user/email/confirmation?token=' + confirmationToken,
            user,
        },
        recipient: user.email,
        subject: 'Activate your account',
        template: config.verifyEmailTemplate,
        clientId
    });
};

/**
 * Returns true email address not already taken by another user.
 * @param  {string} email
 * @returns {Promise<{ isAvailable: boolean }>} Promise to the boolean `isAvailable`
 */
export const checkEmailAvailable = async (email: string): Promise<{ isAvailable: boolean }> => {
    const emailExists = await User.userExists({ email });
    return { isAvailable: !emailExists };
};

/**
 * Returns true username address not already taken by another user.
 * @param  {string} username
 * @returns {Promise<{ isAvailable: boolean }>} Promise to the boolean `isAvailable`
 */
export const checkUsernameAvailable = async (username: string): Promise<{ isAvailable: boolean }> => {
    const usernameExists = await User.userExists({ username });
    return { isAvailable: !usernameExists };
};

/**
 * Verifying link clicked by users in the account verification email.
 * @throws {UserNotFound} User does not exist
 * @param  {Request} req
 * @param  {Response} res
 * @param  {NextFunction} next
 * @renders notification page informing users of the operation success.
 */
export const confirmEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const notifications: Notification[] = [];
    const token = req.query.token;
    try {
        const exists = await User.userExists({ verificationToken: token });
        if (!exists) {
            throw new UserNotFound('This link is no longer valid.');
        }
        const user = await User.getUser({ verificationToken: token });
        await User.updateUser({ email: user.email }, { verificationToken: null, verified: true });
        notifications.push({ type: 'success', message: 'You are now verified!' });
    } catch (err) {
        notifications.push({ type: 'error', message: 'This link is not valid!' });
    } finally {
        ejs.renderFile(config.notificationPageTemplate, { notifications }, { notifications }, (err, html) => {
            if (err) {
                next(err);
            } else {
                res.send(html);
            }
        });
    }
};

/**
 * Create a new user.
 * @throws {WrongPasswordError}
 * @throws {UsernameAlreadyExistsError}
 * @throws {EmailAlreadyExistsError}
 * @throws {UserValidationError}
 * @param  {any} user
 * @param  {Request} req
 * @returns {Promise<{ user: any; notifications: Notification[] }>} Promise to the notifications of success or failure
 */
export const createUser = async (user: any, req: Request): Promise<{ user: any; notifications: Notification[] }> => {
    const notifications: Notification[] = [];
    user.verificationToken = generateToken(TOKEN_LENGTH);

    if (!user.password) {
        throw new WrongPasswordError('Please provide a password!');
    }

    if (user.password.length < 8) {
        throw new WrongPasswordError('The password must contain at least 8 characters!');
    }
    try {
        await User.createUser(user);
        notifications.push({ type: 'success', message: 'User created!' });
        let clientId;
        if (isMockEmailAndClientCanReceivePreview(req)) {
            clientId = req.cookies.clientId
        }
        sendConfirmationEmail(user, user.verificationToken, getHostAdress(req), clientId);
        notifications.push({
            message: 'You will receive a confirmation link at your email address in a few minutes.',
            type: 'info',
        });
        return { notifications, user };
    } catch (err) {
        if (err.message.includes('username') && err.message.includes('duplicate key')) {
            throw new UsernameAlreadyExistsError('Username already exists');
        }
        if (err.message.includes('email') && err.message.includes('duplicate key')) {
            throw new EmailAlreadyExistsError('Email already exists');
        }
        throw new UserValidationError(err.message.replace('user validation failed: email: Path ', ''));
    }
};

/**
 * Resend an account verification email to logged in user.
 * @throws {UnknownUser}
 * @throws {EmailAlreadyConfirmedError}
 * @param  {Request} req
 * @returns {Promise<{ notifications: Notification[] }>} Promise to the notifications of success or failure
 */
export const resendConfirmationEmail = async (req: Request): Promise<{ notifications: Notification[] }> => {
    if (!isUserLoggedIn(req)) {
        throw new UnknownUser('Please login!');
    }
    const notifications: Notification[] = [];
    const user = await User.getUser({ _id: req.user._id });
    if (user.verified) {
        throw new EmailAlreadyConfirmedError('Your email adress has already been confirmed.');
    } else {
        let clientId;
        if (isMockEmailAndClientCanReceivePreview(req)) {
            clientId = req.cookies.clientId
        }
        sendConfirmationEmail(req.user, user.verificationToken, getHostAdress(req), clientId);
        notifications.push({
            message: 'You will receive a confirmation link at your email address in a few minutes.',
            type: 'success',
        });
    }
    return { notifications };
};

/**
 * Updating user password from the password recovery form.
 * @throws {WrongPasswordError}
 * @throws {UserNotFound}
 * @throws {UpdatePasswordTooLateError}
 * @param  {string} password - new password
 * @param  {string} passwordRecoveryToken - token guaranteeing user identity
 * @returns {Promise<{ notifications: Notification[] }>} Promise to the notifications of success or failure
 */
export const recoverPassword = async (
    password: string,
    passwordRecoveryToken: string,
): Promise<{ notifications: Notification[] }> => {
    const notifications = [];
    if (password.length < 8) {
        throw new WrongPasswordError('The password must contain at least 8 characters!');
    }
    const userExists = await User.userExists({ passwordRecoveryToken });
    if (!userExists) {
        throw new UserNotFound('Unvalid token!');
    }
    const user = await User.getUser({ passwordRecoveryToken });
    const resetDate = new Date(user.passwordRecoveryRequestDate);
    const actualDate = new Date();
    const diff = Math.abs(actualDate.getTime() - resetDate.getTime());
    const minutes = Math.floor(diff / 1000 / 60);
    if (minutes >= DELAY_TO_CHANGE_PASSWORD_IN_MINUTS) {
        throw new UpdatePasswordTooLateError('This link has expired, please ask a new one.');
    }
    await User.updateUser(
        { _id: user.id },
        { password, passwordRecoveryToken: undefined, passwordRecoveryRequestDate: undefined },
    );
    notifications.push({ type: 'success', message: 'Your password is updated!' });
    return { notifications };
};
/**
 * Update the different user fields of logged in user.
 * @throws {UnknownUser}
 * @throws {WrongPasswordError}
 * @throws {UsernameAlreadyExistsError}
 * @throws {EmailAlreadyExistsError}
 * @throws {UserValidationError}
 * @param  {any} userUpdates - fields to update
 * @param  {Request} req
 * @param  {Response} res
 * @returns {Promise<{ user: any; notifications: Notification[] }>} Promise to the new user data and the notifications of success or failure
 */
export const updateUser = async (
    userUpdates: any,
    req: Request,
    res: Response,
): Promise<{ user: any; notifications: Notification[] }> => {
    if (!isUserLoggedIn(req)) {
        throw new UnknownUser('Please login!');
    }
    const notifications = [];

    const { refreshToken } = await User.getUser({ _id: req.user._id });
    if (req.cookies.refreshToken !== refreshToken) {
        res.status(401);
        throw new Error('Unauthorized access!');
    }

    if (userUpdates.password && userUpdates.password !== userUpdates.previousPassword) {
        const isValid = await User.isPasswordValid({ email: req.user.email }, userUpdates.previousPassword);
        if (!isValid) {
            throw new WrongPasswordError('Your previous password is wrong!');
        }
        if (userUpdates.password.length < 8) {
            throw new WrongPasswordError('The password must contain at least 8 characters!');
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
        req.user = await User.getUserNonInternalFields({ _id: req.user._id });
        notifications.push({ type: 'success', message: 'User information updated!' });

        if (!isEmailVerified) {
            let clientId;
            if (isMockEmailAndClientCanReceivePreview(req)) {
                clientId = req.cookies.clientId
            }
            sendConfirmationEmail(req.user, userUpdates.verificationToken, getHostAdress(req), clientId);
            notifications.push({
                message: 'You will receive a confirmation link at your email address in a few minutes.',
                type: 'info',
            });
        }
        return {
            notifications,
            user: req.user,
        };
    } catch (err) {
        if (err.message.includes('username') && err.message.includes('duplicate key')) {
            throw new UsernameAlreadyExistsError('Username already exists');
        }
        if (err.message.includes('email') && err.message.includes('duplicate key')) {
            throw new EmailAlreadyExistsError('Email already exists');
        }
        throw new UserValidationError(err.message.replace('user validation failed: email: ', ''));
    }
};
/**
 * Delete logged in user.
 * @throws {UnknownUser}
 * @throws {WrongPasswordError}
 * @param  {string} password
 * @param  {Request} req
 * @returns Notification
 */
export const deleteUser = async (password: string, req: Request): Promise<{ notifications: Notification[] }> => {
    if (!isUserLoggedIn(req)) {
        throw new UnknownUser('Please login!');
    }
    const notifications: Notification[] = [];
    const isValid = await User.isPasswordValid({ _id: req.user._id }, password);
    if (!isValid) {
        throw new WrongPasswordError('You entered a wrong password');
    }
    await User.removeUser({ _id: req.user._id });
    notifications.push({ type: 'success', message: 'Your account has been deleted.' });
    return { notifications };
};

/**
 * User log-in.
 * @throws {WrongLoginError}
 * @param  {string} loginStr
 * @param  {string} password
 * @param  {Response} res
 * @returns {Promise<{ token: string; user: any }>} Promise to the user token and user data.
 */
export const login = async (
    loginStr: string,
    password: string,
    res: Response,
): Promise<{ token: string; user: any }> => {
    let payload: { token: string; user: any };
    const emailExists = await User.userExists({ email: loginStr });
    const usernameExists = await User.userExists({ username: loginStr });
    if (emailExists) {
        payload = await User.sign({ email: loginStr }, password, config.privateKey);
    } else if (usernameExists) {
        payload = await User.sign({ username: loginStr }, password, config.privateKey);
    } else {
        res.status(401);
        throw new WrongLoginError('Wrong credentials!');
    }

    const user = await User.getUser({ _id: payload.user._id });
    let refreshToken = user.refreshToken;
    if (!refreshToken || !user.refreshTokenExpiryDate || user.refreshTokenExpiryDate < new Date()) {
        refreshToken = generateToken(REFRESH_TOKEN_LENGTH);
        const refreshTokenExpiryDate = new Date();
        refreshTokenExpiryDate.setTime(refreshTokenExpiryDate.getTime() + config.refreshTokenExpiryTime);
        await User.updateUser({ _id: payload.user._id }, { refreshToken, refreshTokenExpiryDate });
    }

    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    return payload;
};

/**
 * Send password recovery email, when a user has lost his password.
 * @throws {AlreadyLoggedInError}
 * @param  {string} email
 * @param  {Request} req
 * @returns {Promise<{ notifications: Notification[] }>} Promise to the notifications of success or failure.
 */
export const sendPasswordRecoveryEmail = async (
    email: string,
    req: Request,
): Promise<{ notifications: Notification[] }> => {
    const notifications: Notification[] = [];
    notifications.push({
        message:
            'If your email address exists in our database, you will receive a password recovery link at your email address in a few minutes.',
        type: 'info',
    });
    if (req.user !== undefined) {
        throw new AlreadyLoggedInError('Oups, you are already logged in!');
    }

    const exists = await User.userExists({ email });
    if (!exists) {
        return { notifications };
    }
    const passwordRecoveryToken = generateToken(TOKEN_LENGTH);
    const passwordRecoveryRequestDate = new Date();
    await User.updateUser({ email }, { passwordRecoveryToken, passwordRecoveryRequestDate });
    const user = await User.getUser({ email });
    const host = getHostAdress(req);
    
    let clientId;
    if (isMockEmailAndClientCanReceivePreview(req)) {
        clientId = req.cookies.clientId
    }
    
    agenda.now('email', {
        locals: {
            link: host + '/form/reset/password?token=' + passwordRecoveryToken,
            user,
        },
        recipient: email,
        subject: 'Password Recovery',
        template: config.resetPasswordEmailTemplate,
        clientId
    });
    return { notifications };
};

/**
 * Send an HTML page with the password reset form.
 * @param  {Request} req
 * @param  {Response} res
 * @param  {NextFunction} next
 * @returns an HTML page with the password reset form
 */
export const resetPasswordForm = (req: Request, res: Response, next: NextFunction): void => {
    const notifications: Notification[] = [];
    if (req.user) {
        notifications.push({ type: 'error', message: 'Oups, you are already logged in!' });
        res.json({ notifications });
        return;
    }
    const host = getHostAdress(req);
    const locals = {
        link: host,
        token: req.query.token,
    };
    ejs.renderFile(config.resetPasswordFormTemplate, locals, {}, (err, html) => {
        if (err) {
            next(err);
        } else {
            res.send(html);
        }
    });
};
/**
 * Refresh user authentication token and user refresh token set in httpOnly cookie.
 * @throws {UnknownUser}
 * @param  {Request} req
 * @param  {Response} res
 * @returns {Promise<{ token: string; expiryDate: Date }>} Promise to the new authentication token and its expiry date.
 */
export const refreshTokens = async (req: Request, res: Response): Promise<{ token: string; expiryDate: Date }> => {
    const user = await User.getUser({ refreshToken: req.cookies.refreshToken });
    const now = new Date();
    if (user && user.refreshTokenExpiryDate && now.getTime() < user.refreshTokenExpiryDate.getTime()) {
        const payload = await User.refreshAuthToken({ _id: user._id }, config.privateKey);
        const refreshToken = generateToken(REFRESH_TOKEN_LENGTH);
        const refreshTokenExpiryDate = new Date();
        refreshTokenExpiryDate.setTime(refreshTokenExpiryDate.getTime() + config.refreshTokenExpiryTime);
        await User.updateUser({ _id: user._id }, { refreshToken, refreshTokenExpiryDate });
        res.cookie('refreshToken', refreshToken, { httpOnly: true });
        return payload;
    } else {
        res.status(401);
        throw new UnknownUser('Please login!');
    }
};
