import kryptonAuth from '../lib/index';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({
    origin: function (origin, callback) {
        return callback(null, true);
    },
    credentials: true,
}));

app.use(kryptonAuth());

app.listen(process.env.PORT || 5000, () => {
    console.log(`Krypton is listening on http://localhost:${process.env.PORT || 5000}`)
})