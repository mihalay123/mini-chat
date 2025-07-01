import { describe, it, expect, vi } from 'vitest';
import { login } from './login';
import { hashPassword } from '@features/auth/service/hash';
import { Request, Response } from 'express';

describe('login use case', () => {
  it('returns 200 and tokens for valid credentials', async () => {
    const password = 'secret';
    const hashedPassword = await hashPassword(password);

    const mockRepo = {
      findUserByUsername: vi.fn().mockResolvedValue({
        id: 'user-id',
        username: 'testuser',
        password: hashedPassword,
      }),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        username: 'testuser',
        password,
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'VitestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

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
    const mockRepo = {
      findUserByUsername: vi.fn().mockResolvedValue({
        id: 'user-id',
        username: 'testuser',
        password: await hashPassword('correct-password'),
      }),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        username: 'testuser',
        password: 'wrong-password',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'VitestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await login(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid credentials',
    });
  });

  it('returns 401 if user is not found', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn().mockResolvedValue(null),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        username: 'nonexistent-user',
        password: 'any-password',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'VitestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await login(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid credentials',
    });
  });

  it('returns 401 if username is missing', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn().mockResolvedValue(null),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        password: 'any-password',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'VitestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await login(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid credentials',
    });
  });

  it('returns 401 if password is missing', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn().mockResolvedValue({
        id: 'user-id',
        username: 'testuser',
        password: await hashPassword('some-password'),
      }),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        username: 'testuser',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'VitestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await login(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid credentials',
    });
  });

  it('handles repository error gracefully', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        username: 'testuser',
        password: 'password',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'VitestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await expect(login(mockRepo)(req, res)).rejects.toThrow('Database connection failed');
  });

  it('calls saveRefreshToken with correct parameters', async () => {
    const password = 'secret';
    const hashedPassword = await hashPassword(password);
    const mockRepo = {
      findUserByUsername: vi.fn().mockResolvedValue({
        id: 'user-id',
        username: 'testuser',
        password: hashedPassword,
      }),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        username: 'testuser',
        password,
      },
      ip: '192.168.1.100',
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await login(mockRepo)(req, res);

    expect(mockRepo.saveRefreshToken).toHaveBeenCalledWith('user-id', expect.any(String), {
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
    });
  });

  it('handles missing ip and user-agent gracefully', async () => {
    const password = 'secret';
    const hashedPassword = await hashPassword(password);
    const mockRepo = {
      findUserByUsername: vi.fn().mockResolvedValue({
        id: 'user-id',
        username: 'testuser',
        password: hashedPassword,
      }),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        username: 'testuser',
        password,
      },
      headers: {},
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await login(mockRepo)(req, res);

    expect(mockRepo.saveRefreshToken).toHaveBeenCalledWith('user-id', expect.any(String), {
      ip: '',
      userAgent: '',
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
