import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_, res) => {
  res.sendFile('client.html', { root: './' });
});

app.use('/api/auth', authRoutes);
