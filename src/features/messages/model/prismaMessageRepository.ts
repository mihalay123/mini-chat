import { prisma } from '@shared/prisma';
import { MessageRepository } from './MessageRepository';
import { MessageWithSender, PaginatedMessages } from './types';

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
    const messages = results.slice(0, limit);
    const nextCursor = results.length > limit ? results[limit - 1].id : null;
    const hasMore = results.length > limit;

    return {
      items: messages,
      meta: {
        nextCursor,
        hasMore,
      },
    };
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
