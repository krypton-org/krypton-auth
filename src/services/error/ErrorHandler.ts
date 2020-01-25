import OperationalError from './ErrorTypes';

export default (err, req, res, next) => {
    const notifications = [];
    if (err instanceof OperationalError) {
        notifications.push({ type: 'error', message: err.message });
        res.json({ notifications });
    } else {
        next(err);
    }
};
