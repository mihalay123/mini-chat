import { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Token is required'));
  }

  try {
    const payload = verifyToken(token);
    (socket as any).user = payload;
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
};
