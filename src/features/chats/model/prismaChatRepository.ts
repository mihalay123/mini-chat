import { prisma } from '@shared/prisma';
import { ChatRepository } from './ChatRepository';

export const prismaChatRepository: ChatRepository = {
  async createChat(userId, name = '', isGroup = false) {
    const chat = await prisma.chat.create({
      data: {
        name: isGroup ? name : null,
        isGroup,
        members: {
          create: {
            userId: userId,
            role: isGroup ? 'ADMIN' : 'MEMBER',
          },
        },
      },
      include: {
        members: true,
      },
    });

    return chat;
  },

  async getChatsByUserId(userId) {
    const chats = await prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          where: { userId: userId },
          select: { userId: true },
        },
        _count: {
          select: { members: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return chats;
  },
};
