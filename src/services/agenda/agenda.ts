/**
 * Configuring Agenda, the job processing queue to send emails.
 * @module services/agenda/Agenda
 */

import Agenda from 'agenda';
import config from '../../config';
import email from '../../jobs/email';

const collection = 'emailJobs';
const connectionOpts = { db: { address: config.dbAddress, collection } };
const agenda: Agenda = new Agenda(connectionOpts);
email(agenda);

agenda.start().then(() => {
    config.serviceReady({ isAgendaReady: true });
});

export default agenda;
