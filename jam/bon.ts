import kryptonAuth from '../lib/index';
import express from 'express';

const app = express();

app.use('/auth', kryptonAuth({ nodemailerConfig: {
    from: '"NUSID Demo" <nusid.demo@gmail.com>',
    host: 'smtp.gmail.com', // hostname 
    secureConnection: true, // use SSL 
    port: 465, // port for secure SMTP 
    transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer acce$
    auth: {
        user: 'nusid.demo@gmail.com',
        pass: 'nusid@pp'
    }
}}));

app.listen(process.env.PORT || 5000, () => {
    console.log(`server is listening on ${process.env.PORT || 5000}`)
})