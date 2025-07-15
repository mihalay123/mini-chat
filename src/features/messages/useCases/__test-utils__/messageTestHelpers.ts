import { Request, Response } from 'express';
import { vi } from 'vitest';
import { MessageRepository } from '../../model/MessageRepository';

export const createMockMessageRepo = (overrides = {}): MessageRepository => ({
  sendMessage: vi.fn(),
  getMessages: vi.fn(),
  isChatMember: vi.fn(),
  ...overrides,
});

export const createReq = (params: any = {}, query: any = {}, user: any = null, body: any = {}): Request =>
  ({
    params,
    query,
    user,
    body,
  }) as Request;

export const createRes = (): Response =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  }) as unknown as Response;

export const mockMessage = {
  id: 'msg-1',
  text: 'Hello world',
  chatId: 'chat-1',
  userId: 'user-1',
  senderId: 'user-1',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  sender: { username: 'testuser' },
};

export const mockMessages = {
  data: [
    {
      id: 'msg-1',
      text: 'Hello world',
      chatId: 'chat-1',
      userId: 'user-1',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
      sender: { username: 'testuser' },
    },
    {
      id: 'msg-2',
      text: 'How are you?',
      chatId: 'chat-1',
      userId: 'user-2',
      createdAt: new Date('2024-01-01T10:01:00Z'),
      updatedAt: new Date('2024-01-01T10:01:00Z'),
      sender: { username: 'anotheruser' },
    },
  ],
  pagination: {
    hasMore: false,
    nextCursor: null,
  },
};
