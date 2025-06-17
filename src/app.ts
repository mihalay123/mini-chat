import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_, res) => {
  res.send('Mini Chat API!');
});

app.get('/client', (_, res) => {
  res.sendFile('client.html', { root: './' });
});
