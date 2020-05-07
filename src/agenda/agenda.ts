/**
 * Configuring Agenda, the job processing queue to send emails.
 * @module agenda/Agenda
 */

import Agenda from 'agenda';
import config from '../config';
import email from '../jobs/email';

const collection = 'emailJobs';
const connectionOpts = {
    db: {
        address: config.dbAddress, collection, options: {
            useUnifiedTopology: true,
            autoReconnect: true,
            reconnectTries: 50,
            reconnectInterval: 1000
        }
    }
};
const agenda: Agenda = new Agenda(connectionOpts);
email(agenda);

agenda.start().then(() => {
    config.serviceReady({ isAgendaReady: true });
});

export default agenda;
