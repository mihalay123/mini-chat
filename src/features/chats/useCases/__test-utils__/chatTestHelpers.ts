import { Request, Response } from 'express';
import { vi } from 'vitest';
import { ChatRepository } from '../../model/ChatRepository';

export const createMockChatRepo = (overrides = {}): ChatRepository => ({
  createChat: vi.fn(),
  getChatsByUserId: vi.fn(),
  ...overrides,
});

export const createReq = (body: any = {}, user: any = null): Request =>
  ({
    body,
    user,
  }) as Request;

export const createRes = (): Response =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  }) as unknown as Response;
