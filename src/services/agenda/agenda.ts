import Agenda from 'agenda';
import config from '../../config';
import emailJob from '../../jobs/email';

let connectionString = 'mongodb://' +
    config.dbConfig.address + ':' +
    config.dbConfig.port + '/' +
    config.dbConfig.agendaDB;
const collection = 'jobs';
const connectionOpts = { db: { address: connectionString, collection } };
const agenda: Agenda = new Agenda(connectionOpts);
emailJob(agenda);

agenda.start()
    .then(() => {
        console.log('Agenda default connection open to ' + connectionString)
        config.serviceReady({ isAgendaReady: true });
    })
    .catch(err => console.log('Agenda default connection error: ' + err));

export default agenda;
