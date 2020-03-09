/**
 * Module returning the Session model built with Mongoose
 * @module model/SessionModel
 */
import { Document, model, Model, Schema } from 'mongoose';
import generateToken from '../crypto/TokenGenerator'
import config from '../config';
import { UnknownUser } from '../error/ErrorTypes';

const REFRESH_TOKEN_LENGTH = 256;

export interface ISessionModel extends Model<any, {}> {

    /**
     * Retruns true if the refresh token exists for the given user ID.
     * @param  {string} userId
     * @param  {string} refreshToken
     * @returns {Promise<boolean>} Promise to the boolean result
     */
    isValid(userId: string, refreshToken: string): Promise<boolean>;

    /**
     * Create a refresh token for the given user ID.
     * @param  {string} userId
     * @returns {Promise<{refreshToken: string, expiryDate: Date}>} Returns the refresh token and its expiry date
     */
    createSession(userId: string): Promise<{ refreshToken: string, expiryDate: Date }>;

    /**
     * Remove the refresh token for the given user ID
     * @param  {string} userId
     * @param  {string} refreshToken
     * @returns {Promise<void>}
     */
    removeSession(userId: string, refreshToken: string): Promise<void>;

    /**
     * Update the refresh token by generating a new one with a new expiryDate
     * @param  {string} userId
     * @param  {string} refreshToken
     * @returns {Promise<{ refreshToken: string, expiryDate: Date }>} Returns the refresh token and its expiry date
     */
    updateSession(userId: string, refreshToken: string): Promise<{ refreshToken: string, expiryDate: Date }>;

    /**
     * Returns the user and session corresponding to the refresh token.
     * @param  {string} userId
     * @returns {Promise<any>} Returns the user and session corresponding to the refresh token.
     */
    getUserAndSessionFromRefreshToken(refreshToken: string): Promise<any>;
}

const sessionFields = {
    refreshToken: {
        isPublic: false,
        type: String,
    },
    expiryDate: {
        isPublic: false,
        type: Date,
    },
    userId: {
        type: Schema.Types.ObjectId
    }
}

const SessionSchema: Schema = new Schema(sessionFields);

/**
 * Returns the expiry date of a new refreshToken from now on.
 * @returns {Date}
 */
function getExpiryDate(): Date {
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + config.refreshTokenExpiryTime);
    return expiryDate;
}

/** @see {@link ISessionModel#isValid} */
SessionSchema.statics.isValid = async function (userId: string, refreshToken: string): Promise<boolean> {
    if (userId && refreshToken){
        const session = await this.findOne({ userId, refreshToken });
        return !!session && session.expiryDate < new Date();
    } else {
        return false;
    }   
};

/** @see {@link ISessionModel#createToken} */
SessionSchema.statics.createSession = async function (userId: string): Promise<{ refreshToken: string, expiryDate: Date }> {
    const session: any = model<Document, ISessionModel>('Session', SessionSchema);
    session.refreshToken = generateToken(REFRESH_TOKEN_LENGTH);
    session.expiryDate = getExpiryDate();
    session.userId = userId;
    await session.save()
    return { refreshToken: session.refreshToken, expiryDate: session.expiryDate };
};

/** @see {@link ISessionModel#removeSession} */
SessionSchema.statics.removeSession = async function (userId: string, refreshToken: string): Promise<void> {
    return this.deleteOne({ userId, refreshToken });
};

/** @see {@link ISessionModel#removeSession} */
SessionSchema.statics.updateSession = async function (refreshToken: string): Promise<{ refreshToken: string, expiryDate: Date }> {
    const data = {
        refreshToken: generateToken(REFRESH_TOKEN_LENGTH),
        expiryDate: getExpiryDate()
    }
    await this.updateOne({ refreshToken }, data, { runValidators: true });
    return data;
};

/** @see {@link ISessionModel#getUserAndSessionFromRefreshToken} */
SessionSchema.statics.getUserAndSessionFromRefreshToken =  async function (refreshToken: string): Promise<any>{
    const aggregate = await this.aggregate([{
        $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
        }
    }]);
    if (aggregate && aggregate.user && aggregate.user[0]){
        return aggregate.user[0];
    } else {
        throw new UnknownUser('Please login!');
    }
}

const SessionModel = model<Document, ISessionModel>('Session', SessionSchema);

export default SessionModel;