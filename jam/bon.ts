import kryptonAuth from '../lib/index';
import express from 'express';

const app = express();

app.use(kryptonAuth());

app.listen(process.env.PORT || 5000, () => {
    console.log(`Krypton is listening on http://localhost:${process.env.PORT || 5000}`)
})