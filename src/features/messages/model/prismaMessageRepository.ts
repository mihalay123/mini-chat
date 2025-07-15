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
};
