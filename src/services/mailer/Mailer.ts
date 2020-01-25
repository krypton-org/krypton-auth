import ejs from 'ejs';
import nodemailer, { Transport, Transporter } from 'nodemailer';
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
    public static send(email: Email): Promise<any> {
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
