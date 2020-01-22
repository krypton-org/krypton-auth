import Mailer, { Email } from '../service/mailer/Mailer';
import fs from 'fs';
import config from '../config';
import Agenda from 'Agenda';

export default function (agenda: Agenda) : void {
    agenda.define('email', async (job: Agenda.Job<Email>) => {
        try {
            await Mailer.send(job.attrs.data);
        } catch (err) {
            console.log(err);
            if (config.emailNotSentLogFile) fs.appendFileSync(config.emailNotSentLogFile, JSON.stringify(job.attrs.data) + '\n');
        }
    });

};