/**
 * Module defining the send email function according to the configuration passed by package users in `emailConfig`.
 * @module services/mailer/Mailer;'
 */

import ejs from 'ejs';
import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import config from '../../config';
import { EmailNotSentError } from '../error/ErrorTypes';

let transporter: Transporter;

if (config.mailTransporter) {
    transporter = config.mailTransporter;
} else {
    nodemailer.createTestAccount((err, account) => {

        config.serviceReady({ isTestEmailReady: true });
        // create reusable transporter object using the default SMTP transport
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: account.user, // generated ethereal user
                pass: account.pass  // generated ethereal password
            }
        });
    });
}

export interface Email {
    recipient: string;
    subject: string;
    locals?: any;
    template: string;
    from: string;
}

/**
 * Function to send an email.
 * @param  {Email} email
 * @returns {Promise<SentMessageInfo>} Promise to the send message info.
 */
export default function send(email: Email): Promise<SentMessageInfo> {
    return new Promise((resolve, reject) => {
        const recipient = email.recipient;
        const subject = email.subject;
        const locals = email.locals;
        const template = email.template;

        ejs.renderFile(template, locals, {}, (err, html) => {
            if (err) {
                reject(err);
            } else {
                const mailOptions = {
                    to: recipient,
                    subject,
                    html,
                };
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        reject(new EmailNotSentError(err.message));
                    } else {
                        resolve(info);
                    }
                });
            }
        });
    });
}
