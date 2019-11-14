const Agenda = require('agenda');
const config = require('../../config');

let connectionString = 'mongodb://' +
    config.dbConfig.address + ':' +
    config.dbConfig.port + '/' +
    config.dbConfig.agendaDB;
let collection = 'jobs';
const connectionOpts = { db: { address: connectionString, collection: collection } };
let agenda = new Agenda(connectionOpts);
require('./../../jobs/email')(agenda);

agenda.start()
    .then(() => console.log('Agenda default connection open to ' + connectionString))
    .catch(err => console.log('Agenda default connection error: ' + err));

module.exports = agenda;
