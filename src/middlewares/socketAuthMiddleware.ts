import { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Token is required'));
  }

  try {
    const payload = verifyToken(token);

    (socket as any).user = { username: payload.username };
    next();
  } catch (err: unknown) {
    console.error('Socket authentication error:', (err as Error).message);
    next(new Error('Unauthorized'));
  }
};
