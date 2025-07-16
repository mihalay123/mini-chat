import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaChatRepository } from './prismaChatRepository';
import { prisma } from '@shared/prisma';

// Mock the Prisma client
vi.mock('@shared/prisma', () => ({
  prisma: {
    chat: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('prismaChatRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createChat', () => {
    it('successfully creates a private chat', async () => {
      const mockChat = {
        id: 'chat-1',
        name: null,
        isGroup: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            userId: 'user-1',
            chatId: 'chat-1',
            role: 'MEMBER',
          },
        ],
      };

      vi.mocked(prisma.chat.create).mockResolvedValueOnce(mockChat);

      const result = await prismaChatRepository.createChat('user-1');

      expect(prisma.chat.create).toHaveBeenCalledWith({
        data: {
          name: null,
          isGroup: false,
          members: {
            create: {
              userId: 'user-1',
              role: 'MEMBER',
            },
          },
        },
        include: {
          members: true,
        },
      });
      expect(result).toEqual(mockChat);
    });

    it('successfully creates a private chat with empty name', async () => {
      const mockChat = {
        id: 'chat-2',
        name: null,
        isGroup: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            userId: 'user-1',
            chatId: 'chat-2',
            role: 'MEMBER',
          },
        ],
      };

      vi.mocked(prisma.chat.create).mockResolvedValueOnce(mockChat);

      const result = await prismaChatRepository.createChat('user-1', '', false);

      expect(prisma.chat.create).toHaveBeenCalledWith({
        data: {
          name: null,
          isGroup: false,
          members: {
            create: {
              userId: 'user-1',
              role: 'MEMBER',
            },
          },
        },
        include: {
          members: true,
        },
      });
      expect(result).toEqual(mockChat);
    });

    it('successfully creates a group chat with name', async () => {
      const mockChat = {
        id: 'group-1',
        name: 'Test Group',
        isGroup: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            userId: 'user-1',
            chatId: 'group-1',
            role: 'ADMIN',
          },
        ],
      };

      vi.mocked(prisma.chat.create).mockResolvedValueOnce(mockChat);

      const result = await prismaChatRepository.createChat('user-1', 'Test Group', true);

      expect(prisma.chat.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Group',
          isGroup: true,
          members: {
            create: {
              userId: 'user-1',
              role: 'ADMIN',
            },
          },
        },
        include: {
          members: true,
        },
      });
      expect(result).toEqual(mockChat);
    });

    it('creates group chat with user as admin', async () => {
      const mockChat = {
        id: 'group-2',
        name: 'Admin Group',
        isGroup: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            userId: 'admin-user',
            chatId: 'group-2',
            role: 'ADMIN',
          },
        ],
      };

      vi.mocked(prisma.chat.create).mockResolvedValueOnce(mockChat);

      const result = await prismaChatRepository.createChat('admin-user', 'Admin Group', true);

      expect(prisma.chat.create).toHaveBeenCalledWith({
        data: {
          name: 'Admin Group',
          isGroup: true,
          members: {
            create: {
              userId: 'admin-user',
              role: 'ADMIN',
            },
          },
        },
        include: {
          members: true,
        },
      });
      expect(result).toEqual(mockChat);
    });

    it('throws error when chat creation fails', async () => {
      const error = new Error('Database error');
      vi.mocked(prisma.chat.create).mockRejectedValueOnce(error);

      await expect(prismaChatRepository.createChat('user-1', 'Test Chat', false)).rejects.toThrow('Database error');

      expect(prisma.chat.create).toHaveBeenCalledWith({
        data: {
          name: null,
          isGroup: false,
          members: {
            create: {
              userId: 'user-1',
              role: 'MEMBER',
            },
          },
        },
        include: {
          members: true,
        },
      });
    });
  });

  describe('getChatsByUserId', () => {
    it('successfully returns user chats', async () => {
      const mockChats = [
        {
          id: 'chat-1',
          name: null,
          isGroup: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          members: [{ userId: 'user-1' }],
          _count: { members: 2 },
          messages: [
            {
              id: 'msg-1',
              text: 'Latest message',
              createdAt: new Date(),
              senderId: 'user-2',
            },
          ],
        },
        {
          id: 'group-1',
          name: 'Test Group',
          isGroup: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          members: [{ userId: 'user-1' }],
          _count: { members: 3 },
          messages: [],
        },
      ];

      vi.mocked(prisma.chat.findMany).mockResolvedValueOnce(mockChats);

      const result = await prismaChatRepository.getChatsByUserId('user-1');

      expect(prisma.chat.findMany).toHaveBeenCalledWith({
        where: {
          members: {
            some: {
              userId: 'user-1',
            },
          },
        },
        include: {
          members: {
            where: { userId: 'user-1' },
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
      expect(result).toEqual(mockChats);
    });

    it('returns empty array when user has no chats', async () => {
      vi.mocked(prisma.chat.findMany).mockResolvedValueOnce([]);

      const result = await prismaChatRepository.getChatsByUserId('user-without-chats');

      expect(prisma.chat.findMany).toHaveBeenCalledWith({
        where: {
          members: {
            some: {
              userId: 'user-without-chats',
            },
          },
        },
        include: {
          members: {
            where: { userId: 'user-without-chats' },
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
      expect(result).toEqual([]);
    });

    it('returns chats with no messages', async () => {
      const mockChats = [
        {
          id: 'new-chat',
          name: 'New Chat',
          isGroup: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          members: [{ userId: 'user-1' }],
          _count: { members: 1 },
          messages: [],
        },
      ];

      vi.mocked(prisma.chat.findMany).mockResolvedValueOnce(mockChats);

      const result = await prismaChatRepository.getChatsByUserId('user-1');

      expect(result).toEqual(mockChats);
      expect((result[0] as any).messages).toEqual([]);
    });

    it('handles chats with latest message correctly', async () => {
      const latestMessage = {
        id: 'latest-msg',
        text: 'This is the latest message',
        createdAt: new Date(),
        senderId: 'user-2',
      };

      const mockChats = [
        {
          id: 'active-chat',
          name: 'Active Chat',
          isGroup: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          members: [{ userId: 'user-1' }],
          _count: { members: 2 },
          messages: [latestMessage],
        },
      ];

      vi.mocked(prisma.chat.findMany).mockResolvedValueOnce(mockChats);

      const result = await prismaChatRepository.getChatsByUserId('user-1');

      expect((result[0] as any).messages).toHaveLength(1);
      expect((result[0] as any).messages[0]).toEqual(latestMessage);
    });

    it('throws error when database query fails', async () => {
      const error = new Error('Database connection error');
      vi.mocked(prisma.chat.findMany).mockRejectedValueOnce(error);

      await expect(prismaChatRepository.getChatsByUserId('user-1')).rejects.toThrow('Database connection error');

      expect(prisma.chat.findMany).toHaveBeenCalledWith({
        where: {
          members: {
            some: {
              userId: 'user-1',
            },
          },
        },
        include: {
          members: {
            where: { userId: 'user-1' },
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
    });
  });
});
