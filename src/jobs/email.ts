/**
 * Module returning the GraphQL schema for the user management API.
 * @module jobs/Email
 */
import Agenda from 'agenda';
import nodemailer from 'nodemailer';
import config from '../config';
import send, { Email } from '../mailer/Mailer';

/**
 * Define job type of sending an email in the Agenda process queue.
 * @param  {Agenda} agenda
 * @returns {void}
 */
export default function(agenda: Agenda): void {
    agenda.define('email', async (job: Agenda.Job<Email>) => {
        try {
            const info = await send(job.attrs.data);
            if (!config.nodemailerConfig) {
                console.log('Message sent: %s', info.messageId);
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                const clientId = job.attrs.data.clientId;
                if (clientId && config.clientIdToSocket.has(clientId)) {
                    config.clientIdToSocket.get(clientId).emit('notification', {
                        message:
                            'To open the preview click <a style="color: #007bff; text-decoration: none; background-color: transparent;" href="' +
                            nodemailer.getTestMessageUrl(info) +
                            '" target="_blank"/>here</a>.',
                        title: 'Mock email sent!',
                        type: 'info',
                    });
                }
            }
        } catch (err) {
            if (config.eventEmitter) {
                config.eventEmitter.emit('email-error', job.attrs.data);
            }
        }
    });
}
