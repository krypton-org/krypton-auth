const {
    OperationalError,
    UserNotFound
} = require('./ErrorTypes')

module.exports = function (err, req, res, next) {
    const notifications = [];
    if (err instanceof OperationalError) {
        notifications.push({ type: 'error', message: err.message })
        res.json({ notifications: notifications });
    } else {
        next(err);
    }
};