/**
 * Configuring Agenda, the job processing queue to send emails.
 * @module agenda/Agenda
 */

import Agenda from 'agenda';
import config from '../config';
import email from '../jobs/email';
import removeOutdatedSessions, { JOB_NAME as removeOutdatedSessionsJobName } from '../jobs/RemoveOutdatedSessions';

const collection = 'emailJobs';
const dbConfigWithoutUnsupportedOptions = Object.keys(config.dbConfig).reduce((acc, key) => {
    if (key !== 'useCreateIndex' && key !== 'useFindAndModify') {
        acc[key] = config.dbConfig[key];
    }
    return acc;
}, {});

const connectionOpts = {
    db: {
        address: config.dbAddress,
        collection,
        options: dbConfigWithoutUnsupportedOptions,
    },
};
const agenda: Agenda = new Agenda(connectionOpts);
email(agenda);
removeOutdatedSessions(agenda);

agenda.start().then(async () => {
    config.serviceReady({ isAgendaReady: true });
    await agenda.every('1 day', removeOutdatedSessionsJobName);
});

export default agenda;
