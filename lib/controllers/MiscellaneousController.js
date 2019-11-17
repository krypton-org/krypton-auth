exports.getIndex = function (req, res, next){
    const notifications = [];
    notifications.push({ type: 'success', message: 'Welcome to REST-Authentification-backend!' })
    res.json({ notifications: notifications });
}