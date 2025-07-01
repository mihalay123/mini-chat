import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../features/auth/routes';

interface ErrorWithStatus extends Error {
  status?: number;
}

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());

app.use((err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled error]', err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.get('/', (_, res) => {
  res.sendFile('client.html', { root: './' });
});

app.use('/api/auth', authRoutes);
