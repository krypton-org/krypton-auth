const mailer = require('../service/mailer/Mailer');
const fs = require('fs');
const config = require('../config');

module.exports = function (agenda) {
    agenda.define('email', async job => {
        try {
            await mailer.send(job.attrs.data);
        } catch (err) {
            console.log(err);
            if (config.emailNotSentLogFile) fs.appendFile(config.emailNotSentLogFile, JSON.stringify(job.attrs.data) + '\n');
        }
    });

};