/**
 * Configuring Agenda, the job processing queue to send emails.
 * @module services/agenda/Agenda
 */

import Agenda from 'agenda';
import config from '../../config';
import email from '../../jobs/email';

const connectionString =
    'mongodb://' + config.dbConfig.address + ':' + config.dbConfig.port + '/' + config.dbConfig.agendaDB;
const collection = 'jobs';
const connectionOpts = { db: { address: connectionString, collection } };
const agenda: Agenda = new Agenda(connectionOpts);
email(agenda);

agenda
    .start()
    .then(() => {
        config.serviceReady({ isAgendaReady: true });
    })

export default agenda;
