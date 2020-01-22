import path from 'path';

export interface DBConfig {
    address: string,
    port: string,
    agendaDB: string,
    userDB: string
}

interface DBReadyStatus {
    isAgendaReady?: boolean,
    isMongooseReady?: boolean
}

export interface Config {
    hasUsername?: boolean,
    dbConfig: DBConfig
    publicKey?: string,
    publicKeyFilePath?: string,
    privateKey?: string,
    privateKeyFilePath?: string,
    emailNotSentLogFile?: string,
    verifyEmailTemplate?: string,
    resetPasswordEmailTemplate?: string,
    resetPasswordFormTemplate?: string,
    notificationPageTemplate?: string,
    errorlogFile?: string,
    extendedSchema?: Object,
    refreshTokenExpiryTime?: number,
    authTokenExpiryTime?: number,
    algorithm?: string,
    emailConfig?: any;
    graphiql?: boolean,
    host?: string,
    onReady?: () => void
}

export class DefaultConfig implements Config {
    hasUsername = true;
    dbConfig = {
        address: 'localhost',
        port: '27017',
        agendaDB: 'agenda',
        userDB: 'users'
    };
    emailNotSentLogFile = path.resolve(__dirname, './email-not-sent.log');
    verifyEmailTemplate = path.resolve(__dirname, './templates/emails/VerifyEmail.ejs');
    resetPasswordEmailTemplate = path.resolve(__dirname, './templates/emails/ResetPassword.ejs');
    resetPasswordFormTemplate = path.resolve(__dirname, './templates/forms/ResetPassword.ejs');
    notificationPageTemplate = path.resolve(__dirname, './templates/pages/Notification.ejs');
    errorlogFile = path.resolve(__dirname, './errors.log');
    extendedSchema = {};
    refreshTokenExpiryTime = 7 * 24 * 60 * 60 * 1000;
    authTokenExpiryTime = 15 * 60 * 1000;
    algorithm = 'RS256';
    graphiql = true;
    publicKey = undefined;
    publicKeyFilePath = undefined;
    privateKey = undefined;
    host = undefined;
    privateKeyFilePath = undefined;
    emailConfig: undefined;
    onReady = () => console.log("GraphQL-Auth-Service is ready!");

    private isAgendaReady: boolean = false;
    private isMongooseReady: boolean = false;
    serviceReady = (status: DBReadyStatus): void => {
        if (status.isAgendaReady) this.isAgendaReady = true;
        if (status.isMongooseReady) this.isMongooseReady = true;
        if (this.isAgendaReady && this.isMongooseReady) this.onReady()
    }
};

// export interface ConfigServiceReady extends Config {
//     serviceReady(status: DBReadyStatus): void;
// }

const config = new DefaultConfig();

export default config;