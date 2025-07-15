import { verifyToken } from '@shared/service/jwt';
import { Socket } from 'socket.io';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Token is required'));
  }

  try {
    const payload = verifyToken(token);

    (socket as any).user = { username: payload.username, id: payload.id };
    next();
  } catch (err: unknown) {
    console.error('Socket authentication error:', (err as Error).message);
    next(new Error('Unauthorized'));
  }
};
