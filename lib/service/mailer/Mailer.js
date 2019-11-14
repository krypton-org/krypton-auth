const nodemailer = require("nodemailer");
const config = require('../../config');
const ejs = require('ejs');
const { EmailNotSentError } = require('../error/ErrorTypes');

let transporter = nodemailer.createTransport(config.emailConfig);

exports.send = (params) => {
    return new Promise(function (resolve, reject) {
        const email = params.email;
        const subject = params.subject;
        const locals = params.locals;
        const template = params.template;
        const from = config.emailConfig.from;
        ejs.renderFile(template, locals, {}, function (err, html) {
            if (err) {
                reject(err);
            } else {
                const mailOptions = {
                    from: from,
                    to: email,
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
};
