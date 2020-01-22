import nodemailer, { Transporter } from 'nodemailer';
import config from '../../config';
import ejs from 'ejs';
import { EmailNotSentError } from '../error/ErrorTypes';

const transporter: Transporter = nodemailer.createTransport(config.emailConfig);

export interface Email {
    recipient: string;
    subject: string;
    locals: any;
    template: string;
    from: string;
}

export default class Mailer {
    static send(email: Email): Promise<any> {
        return new Promise(function (resolve, reject) {
            const recipient = email.recipient;
            const subject = email.subject;
            const locals = email.locals;
            const template = email.template;
            //@ts-ignore
            const from = config.emailConfig.from;
            ejs.renderFile(template, locals, {}, function (err, html) {
                if (err) {
                    reject(err);
                } else {
                    const mailOptions = {
                        from: from,
                        to: recipient,
                        subject: subject,
                        html: html
                    };
                    transporter.sendMail(mailOptions, function (err, info) {
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
};
