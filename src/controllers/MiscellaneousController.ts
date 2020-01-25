import pkg from '../../package.json';

export const getIndex = (req: any, res: any, next: any): void => {
    const notifications = [];
    notifications.push({ type: 'success', message: 'Welcome to GraphQL Auth Service - version ' + pkg.version });
    res.json({ notifications });
};
