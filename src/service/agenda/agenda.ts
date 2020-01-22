import Agenda from 'agenda';
import config from '../../config';

let connectionString = 'mongodb://' +
    config.dbConfig.address + ':' +
    config.dbConfig.port + '/' +
    config.dbConfig.agendaDB;
const collection = 'jobs';
const connectionOpts = { db: { address: connectionString, collection } };
const agenda: Agenda = new Agenda(connectionOpts);
require('./../../jobs/email')(agenda);

agenda.start()
    .then(() => {
        console.log('Agenda default connection open to ' + connectionString)
        config.serviceReady({ isAgendaReady: true });
    })
    .catch(err => console.log('Agenda default connection error: ' + err));

export default agenda;
