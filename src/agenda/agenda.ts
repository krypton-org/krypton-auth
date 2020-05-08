/**
 * Configuring Agenda, the job processing queue to send emails.
 * @module agenda/Agenda
 */

import Agenda from 'agenda';
import config from '../config';
import email from '../jobs/email';

const collection = 'emailJobs';
const dbConfigWithoutUnsupportedOptions = Object.keys(config.dbConfig).reduce(
    (acc, key) => {
        if (key !== 'useCreateIndex' && key !== 'useFindAndModify') acc[key] = config.dbConfig[key];
        return acc;
    }, {});

const connectionOpts = {
    db: {
        address: config.dbAddress, collection, options: dbConfigWithoutUnsupportedOptions
    }
};
const agenda: Agenda = new Agenda(connectionOpts);
email(agenda);

agenda.start().then(() => {
    config.serviceReady({ isAgendaReady: true });
});

export default agenda;
