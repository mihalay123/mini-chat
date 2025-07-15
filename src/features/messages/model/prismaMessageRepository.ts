import { prisma } from '@shared/prisma';
import { MessageRepository } from './MessageRepository';

export const prismaMessageRepository: MessageRepository = {
  async sendMessage(chatId, userId, text) {
    const message = await prisma.message.create({
      data: {
        text,
        chatId,
        senderId: userId,
      },
      include: {
        sender: {
          select: {
            username: true,
          },
        },
      },
    });
    return message;
  },

  async getMessages(chatId, userId) {
    const messages = await prisma.message.findMany({
      where: {
        chatId,
      },
      include: {
        sender: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return messages;
  },
};
