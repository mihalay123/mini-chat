import { describe, it, expect, vi } from 'vitest';
import { login } from './login';

import { Request } from 'express';
import { createMockRepo, createReq, createRes } from './__test-utils__/authTestHelpers';
import { hashPassword } from '@shared/service/hash';

describe('login use case', () => {
  it('returns 200 and tokens for valid credentials', async () => {
    const password = 'secret';
    const hashedPassword = await hashPassword(password);

    const mockRepo = createMockRepo({
      findUserByUsername: vi.fn().mockResolvedValue({
        id: 'user-id',
        username: 'testuser',
        password: hashedPassword,
      }),
    });

    const req = createReq({ username: 'testuser', password });
    const res = createRes();

    await login(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: {
        id: 'user-id',
        username: 'testuser',
      },
    });
  });

  it('returns 401 if password is incorrect', async () => {
    const mockRepo = createMockRepo({
      findUserByUsername: vi.fn().mockResolvedValue({
        id: 'user-id',
        username: 'testuser',
        password: await hashPassword('correct-password'),
      }),
    });

    const req = createReq({ username: 'testuser', password: 'wrong-password' });
    const res = createRes();

    await login(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid credentials',
    });
  });

  it('returns 401 if user is not found', async () => {
    const mockRepo = createMockRepo({
      findUserByUsername: vi.fn().mockResolvedValue(null),
    });

    const req = createReq({ username: 'nonexistent-user', password: 'any-password' });
    const res = createRes();

    await login(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid credentials',
    });
  });

  it('returns 401 if username is missing', async () => {
    const mockRepo = createMockRepo({
      findUserByUsername: vi.fn().mockResolvedValue(null),
    });

    const req = createReq({ password: 'any-password' });
    const res = createRes();

    await login(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid credentials',
    });
  });

  it('returns 401 if password is missing', async () => {
    const mockRepo = createMockRepo({
      findUserByUsername: vi.fn().mockResolvedValue({
        id: 'user-id',
        username: 'testuser',
        password: await hashPassword('some-password'),
      }),
    });

    const req = createReq({ username: 'testuser' });
    const res = createRes();

    await login(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid credentials',
    });
  });

  it('handles repository error gracefully', async () => {
    const mockRepo = createMockRepo({
      findUserByUsername: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    });

    const req = createReq({ username: 'testuser', password: 'password' });
    const res = createRes();

    await expect(login(mockRepo)(req, res)).rejects.toThrow('Database connection failed');
  });

  it('calls saveRefreshToken with correct parameters', async () => {
    const password = 'secret';
    const hashedPassword = await hashPassword(password);
    const mockRepo = createMockRepo({
      findUserByUsername: vi.fn().mockResolvedValue({
        id: 'user-id',
        username: 'testuser',
        password: hashedPassword,
      }),
    });

    const req = createReq({ username: 'testuser', password }, '192.168.1.100', 'Mozilla/5.0');
    const res = createRes();

    await login(mockRepo)(req, res);

    expect(mockRepo.saveRefreshToken).toHaveBeenCalledWith('user-id', expect.any(String), {
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
    });
  });

  it('handles missing ip and user-agent gracefully', async () => {
    const password = 'secret';
    const hashedPassword = await hashPassword(password);
    const mockRepo = createMockRepo({
      findUserByUsername: vi.fn().mockResolvedValue({
        id: 'user-id',
        username: 'testuser',
        password: hashedPassword,
      }),
    });

    const req = {
      body: {
        username: 'testuser',
        password,
      },
      headers: {},
    } as Request;

    const res = createRes();

    await login(mockRepo)(req, res);

    expect(mockRepo.saveRefreshToken).toHaveBeenCalledWith('user-id', expect.any(String), {
      ip: '',
      userAgent: '',
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
