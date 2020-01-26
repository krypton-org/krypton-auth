/**
 * Module defining the send email function according to the configuration passed by package users in `emailConfig`.
 * @module services/mailer/Mailer;'
 */

import ejs from 'ejs';
import nodemailer, { Transport, Transporter, SentMessageInfo } from 'nodemailer';
import config from '../../config';
import { EmailNotSentError } from '../error/ErrorTypes';

const transporter: Transporter = nodemailer.createTransport(config.emailConfig as Transport);

export interface Email {
    recipient: string;
    subject: string;
    locals: any;
    template: string;
    from: string;
}

export default class Mailer {
    /**
     * Function to send an email.
     * @param  {Email} email
     * @returns {Promise<SentMessageInfo>} Promise to the send message info.
     */
    public static send(email: Email): Promise<SentMessageInfo> {
        return new Promise((resolve, reject) => {
            const recipient = email.recipient;
            const subject = email.subject;
            const locals = email.locals;
            const template = email.template;
            // @ts-ignore
            const from = config.emailConfig.from;
            ejs.renderFile(template, locals, {}, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    const mailOptions = {
                        from,
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
}
