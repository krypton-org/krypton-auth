const pkg = require('../../package.json');

exports.getIndex = function (req, res, next){
    const notifications = [];
    notifications.push({ type: 'success', message: 'Welcome to GraphQL-Authentification-Service version '+pkg.version })
    res.json({ notifications: notifications });
}