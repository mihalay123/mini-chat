import { Request, Response } from 'express';
import { vi } from 'vitest';

export const createMockRepo = (overrides = {}) => ({
  findUserByUsername: vi.fn(),
  saveRefreshToken: vi.fn(),
  createUser: vi.fn(),
  revokeRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  ...overrides,
});

export const createReq = (body: any = {}, ip = '127.0.0.1', userAgent = 'VitestAgent'): Request =>
  ({
    body,
    ip,
    headers: {
      'user-agent': userAgent,
    },
  }) as Request;

export const createRes = (): Response =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  }) as unknown as Response;
