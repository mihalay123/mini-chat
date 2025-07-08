import { prisma } from '@shared/prisma';
import { ChatRepository } from './ChatRepository';

export const prismaChatRepository: ChatRepository = {
  async createChat(userId, name = '', isGroup = false) {
    try {
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
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  },
};
