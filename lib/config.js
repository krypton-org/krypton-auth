const path = require('path');

module.exports = {
    hasUsername: true,
    dbConfig: {
        address: 'localhost',
        port: '27017',
        agendaDB: 'agenda',
        userDB: 'users'
    },
    publicKey: null,
    publicKeyFilePath: null,
    privateKey: null,
    privateKeyFilePath: null,
    emailNotSentLogFile: path.resolve(__dirname, './email-not-sent.log'),
    verifyEmailTemplate: path.resolve(__dirname, './templates/emails/VerifyEmail.ejs'),
    resetPasswordEmailTemplate: path.resolve(__dirname, './templates/emails/ResetPassword.ejs'),
    resetPasswordFormTemplate: path.resolve(__dirname, './templates/forms/ResetPassword.ejs'),
    notificationPageTemplate: path.resolve(__dirname, './templates/pages/Notification.ejs'),
    errorlogFile:  path.resolve(__dirname, './errors.log'),
    extendedSchema: {},
    graphiql: false
};