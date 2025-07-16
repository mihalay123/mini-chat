import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMessageRepository } from './prismaMessageRepository';
import { prisma } from '@shared/prisma';
import { getPaginatedResult } from '@shared/utils/pagination';

// Mock the Prisma client
vi.mock('@shared/prisma', () => ({
  prisma: {
    message: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    chatUser: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock pagination utility
vi.mock('@shared/utils/pagination', () => ({
  getPaginatedResult: vi.fn(),
}));

describe('prismaMessageRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('successfully creates and returns a message', async () => {
      const mockMessage = {
        id: 'message-1',
        text: 'Hello world',
        chatId: 'chat-1',
        senderId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        sender: {
          username: 'testuser',
        },
      };

      vi.mocked(prisma.message.create).mockResolvedValueOnce(mockMessage);

      const result = await prismaMessageRepository.sendMessage('chat-1', 'user-1', 'Hello world');

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          text: 'Hello world',
          chatId: 'chat-1',
          senderId: 'user-1',
        },
        include: {
          sender: {
            select: {
              username: true,
            },
          },
        },
      });
      expect(result).toEqual(mockMessage);
    });

    it('handles empty message text', async () => {
      const mockMessage = {
        id: 'message-2',
        text: '',
        chatId: 'chat-1',
        senderId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        sender: {
          username: 'testuser',
        },
      };

      vi.mocked(prisma.message.create).mockResolvedValueOnce(mockMessage);

      const result = await prismaMessageRepository.sendMessage('chat-1', 'user-1', '');

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          text: '',
          chatId: 'chat-1',
          senderId: 'user-1',
        },
        include: {
          sender: {
            select: {
              username: true,
            },
          },
        },
      });
      expect(result).toEqual(mockMessage);
    });

    it('throws error when message creation fails', async () => {
      const error = new Error('Database error');
      vi.mocked(prisma.message.create).mockRejectedValueOnce(error);

      await expect(prismaMessageRepository.sendMessage('chat-1', 'user-1', 'Hello world')).rejects.toThrow(
        'Database error'
      );

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          text: 'Hello world',
          chatId: 'chat-1',
          senderId: 'user-1',
        },
        include: {
          sender: {
            select: {
              username: true,
            },
          },
        },
      });
    });
  });

  describe('getMessages', () => {
    it('successfully gets messages without cursor', async () => {
      const mockMessages = [
        {
          id: 'message-1',
          text: 'Hello',
          chatId: 'chat-1',
          senderId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          sender: { username: 'user1' },
        },
        {
          id: 'message-2',
          text: 'Hi',
          chatId: 'chat-1',
          senderId: 'user-2',
          createdAt: new Date(),
          updatedAt: new Date(),
          sender: { username: 'user2' },
        },
      ];

      const mockPaginatedResult = {
        items: mockMessages,
        meta: {
          hasMore: false,
          nextCursor: null,
        },
      };

      vi.mocked(prisma.message.findMany).mockResolvedValueOnce(mockMessages);
      vi.mocked(getPaginatedResult).mockReturnValueOnce(mockPaginatedResult);

      const result = await prismaMessageRepository.getMessages('chat-1');

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { chatId: 'chat-1' },
        take: 21, // default limit + 1
        cursor: undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              username: true,
            },
          },
        },
      });
      expect(getPaginatedResult).toHaveBeenCalledWith(mockMessages, 20);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('successfully gets messages with cursor and custom limit', async () => {
      const mockMessages = [
        {
          id: 'message-3',
          text: 'New message',
          chatId: 'chat-1',
          senderId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          sender: { username: 'user1' },
        },
      ];

      const mockPaginatedResult = {
        items: mockMessages,
        meta: {
          hasMore: true,
          nextCursor: 'message-3',
        },
      };

      vi.mocked(prisma.message.findMany).mockResolvedValueOnce(mockMessages);
      vi.mocked(getPaginatedResult).mockReturnValueOnce(mockPaginatedResult);

      const result = await prismaMessageRepository.getMessages('chat-1', 'cursor-123', 10);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { chatId: 'chat-1' },
        take: 11, // custom limit + 1
        cursor: { id: 'cursor-123' },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              username: true,
            },
          },
        },
      });
      expect(getPaginatedResult).toHaveBeenCalledWith(mockMessages, 10);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('handles empty messages result', async () => {
      const mockPaginatedResult = {
        items: [],
        meta: {
          hasMore: false,
          nextCursor: null,
        },
      };

      vi.mocked(prisma.message.findMany).mockResolvedValueOnce([]);
      vi.mocked(getPaginatedResult).mockReturnValueOnce(mockPaginatedResult);

      const result = await prismaMessageRepository.getMessages('chat-1');

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { chatId: 'chat-1' },
        take: 21,
        cursor: undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              username: true,
            },
          },
        },
      });
      expect(result).toEqual(mockPaginatedResult);
    });

    it('throws error when database query fails', async () => {
      const error = new Error('Database connection error');
      vi.mocked(prisma.message.findMany).mockRejectedValueOnce(error);

      await expect(prismaMessageRepository.getMessages('chat-1')).rejects.toThrow('Database connection error');
    });
  });

  describe('isChatMember', () => {
    it('returns true when user is a chat member', async () => {
      const mockChatUser = {
        userId: 'user-1',
        chatId: 'chat-1',
        role: 'MEMBER' as const,
      };

      vi.mocked(prisma.chatUser.findUnique).mockResolvedValueOnce(mockChatUser);

      const result = await prismaMessageRepository.isChatMember('chat-1', 'user-1');

      expect(prisma.chatUser.findUnique).toHaveBeenCalledWith({
        where: {
          userId_chatId: {
            userId: 'user-1',
            chatId: 'chat-1',
          },
        },
      });
      expect(result).toBe(true);
    });

    it('returns false when user is not a chat member', async () => {
      vi.mocked(prisma.chatUser.findUnique).mockResolvedValueOnce(null);

      const result = await prismaMessageRepository.isChatMember('chat-1', 'user-1');

      expect(prisma.chatUser.findUnique).toHaveBeenCalledWith({
        where: {
          userId_chatId: {
            userId: 'user-1',
            chatId: 'chat-1',
          },
        },
      });
      expect(result).toBe(false);
    });

    it('throws error when database query fails', async () => {
      const error = new Error('Database error');
      vi.mocked(prisma.chatUser.findUnique).mockRejectedValueOnce(error);

      await expect(prismaMessageRepository.isChatMember('chat-1', 'user-1')).rejects.toThrow('Database error');

      expect(prisma.chatUser.findUnique).toHaveBeenCalledWith({
        where: {
          userId_chatId: {
            userId: 'user-1',
            chatId: 'chat-1',
          },
        },
      });
    });
  });
});
