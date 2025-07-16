import { prisma } from '@shared/prisma';
import { MessageRepository } from './MessageRepository';
import { getPaginatedResult } from '@shared/utils/pagination';

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

  async getMessages(chatId, cursor, limit = 20) {
    const results = await prisma.message.findMany({
      where: { chatId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            username: true,
          },
        },
      },
    });

    const result = getPaginatedResult(results, limit);
    return result;
  },

  async isChatMember(chatId, userId) {
    const chatUser = await prisma.chatUser.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });
    return chatUser !== null;
  },
};
