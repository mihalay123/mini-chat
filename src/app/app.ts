import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '@features/auth/routes';
import userRoutes from '@features/user/routes';
import chatRoutes from '@features/chats/routes';
import messageRoutes from '@features/messages/routes';

interface ErrorWithStatus extends Error {
  status?: number;
}

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_, res) => {
  res.sendFile('client.html', { root: './' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/chats', messageRoutes);

app.use((err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});
