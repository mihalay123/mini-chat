import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { socketAuthMiddleware } from '../shared/middlewares/socketAuthMiddleware';
import { prisma } from '@shared/prisma';

export let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', async (socket) => {
    const user = (socket as any).user;

    const chats = await prisma.chatUser.findMany({
      where: { userId: user.id },
      select: { chatId: true },
    });

    chats.forEach(({ chatId }) => {
      socket.join(chatId);
    });

    socket.on('chat:message', (data) => {
      console.log(`${user.username}: ${data.text}`);
      io.emit('chat:message', {
        user: user.username,
        text: data.text,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${user?.username ?? 'unknown'}`);
    });
  });

  console.log('✅ Socket.IO initialized');
};
