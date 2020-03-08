/**
 * Module defining the send email function according to the configuration passed by package users in `emailConfig`.
 * @module mailer/Mailer;'
 */

import ejs from 'ejs';
import socketIo from "socket.io";
import nodemailer, { SentMessageInfo, Transporter } from 'nodemailer';
import config from '../config';
import { EmailNotSentError } from '../error/ErrorTypes';

let transporter: Transporter;

if (config.mailTransporter) {
    transporter = config.mailTransporter;
} else {
    nodemailer.createTestAccount((err, account) => {
        config.serviceReady({ isTestEmailReady: true });
        // create reusable transporter object using the default SMTP transport
        transporter = nodemailer.createTransport({
            auth: {
                pass: account.pass, // generated ethereal password
                user: account.user, // generated ethereal user
            },
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
        });
    });
}

export interface Email {
    recipient: string;
    subject: string;
    locals?: any;
    template: string;
    from: string;
    clientId: string;
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

        ejs.renderFile(template, locals, {}, (renderErr, html) => {
            if (renderErr) {
                reject(renderErr);
            } else {
                const mailOptions = {
                    from: config.mailFrom,
                    html,
                    subject,
                    to: recipient,
                };
                transporter.sendMail(mailOptions, (sendEmailErr, info) => {
                    if (sendEmailErr) {
                        reject(new EmailNotSentError(sendEmailErr.message));
                    } else {
                        resolve(info);
                    }
                });
            }
        });
    });
}
