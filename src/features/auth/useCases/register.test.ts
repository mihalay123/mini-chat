import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register } from './register';
import { Request, Response } from 'express';
import { hashPassword } from '../service/hash';
import * as authJwtService from '../service/jwt';

// Mock the JWT service
vi.mock('../service/jwt', () => ({
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
}));

describe('register use case', () => {
  const mockGenerateAccessToken = vi.mocked(authJwtService.generateAccessToken);
  const mockGenerateRefreshToken = vi.mocked(authJwtService.generateRefreshToken);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 and creates user with valid credentials', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn().mockResolvedValue(null),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn().mockResolvedValue({
        id: 'new-user-id',
        username: 'newuser',
        password: await hashPassword('password123'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    mockGenerateAccessToken.mockReturnValue('new-access-token');
    mockGenerateRefreshToken.mockReturnValue('new-refresh-token');

    const req = {
      body: {
        username: 'newuser',
        password: 'password123',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'TestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await register(mockRepo)(req, res);

    expect(mockRepo.findUserByUsername).toHaveBeenCalledWith('newuser');
    expect(mockRepo.createUser).toHaveBeenCalledWith('newuser', expect.any(String));
    expect(mockGenerateAccessToken).toHaveBeenCalledWith({
      id: 'new-user-id',
      username: 'newuser',
    });
    expect(mockGenerateRefreshToken).toHaveBeenCalledWith({
      id: 'new-user-id',
      username: 'newuser',
    });
    expect(mockRepo.saveRefreshToken).toHaveBeenCalledWith('new-user-id', 'new-refresh-token', {
      ip: '127.0.0.1',
      userAgent: 'TestAgent',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: {
        id: 'new-user-id',
        username: 'newuser',
      },
    });
  });

  it('returns 400 if username is missing', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn(),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        password: 'password123',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'TestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await register(mockRepo)(req, res);

    expect(mockRepo.findUserByUsername).not.toHaveBeenCalled();
    expect(mockRepo.createUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Username and password are required',
    });
  });

  it('returns 400 if password is missing', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn(),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        username: 'newuser',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'TestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await register(mockRepo)(req, res);

    expect(mockRepo.findUserByUsername).not.toHaveBeenCalled();
    expect(mockRepo.createUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Username and password are required',
    });
  });

  it('returns 400 if both username and password are missing', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn(),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {},
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'TestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await register(mockRepo)(req, res);

    expect(mockRepo.findUserByUsername).not.toHaveBeenCalled();
    expect(mockRepo.createUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Username and password are required',
    });
  });

  it('returns 400 if username is empty string', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn(),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        username: '',
        password: 'password123',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'TestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await register(mockRepo)(req, res);

    expect(mockRepo.findUserByUsername).not.toHaveBeenCalled();
    expect(mockRepo.createUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Username and password are required',
    });
  });

  it('returns 400 if password is empty string', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn(),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        username: 'newuser',
        password: '',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'TestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await register(mockRepo)(req, res);

    expect(mockRepo.findUserByUsername).not.toHaveBeenCalled();
    expect(mockRepo.createUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Username and password are required',
    });
  });

  it('returns 409 if user already exists', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn().mockResolvedValue({
        id: 'existing-user-id',
        username: 'existinguser',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        username: 'existinguser',
        password: 'password123',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'TestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await register(mockRepo)(req, res);

    expect(mockRepo.findUserByUsername).toHaveBeenCalledWith('existinguser');
    expect(mockRepo.createUser).not.toHaveBeenCalled();
    expect(mockGenerateAccessToken).not.toHaveBeenCalled();
    expect(mockGenerateRefreshToken).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User already exists',
    });
  });

  it('handles missing ip and user-agent gracefully', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn().mockResolvedValue(null),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn().mockResolvedValue({
        id: 'new-user-id',
        username: 'newuser',
        password: await hashPassword('password123'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    mockGenerateAccessToken.mockReturnValue('new-access-token');
    mockGenerateRefreshToken.mockReturnValue('new-refresh-token');

    const req = {
      body: {
        username: 'newuser',
        password: 'password123',
      },
      headers: {},
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await register(mockRepo)(req, res);

    expect(mockRepo.saveRefreshToken).toHaveBeenCalledWith('new-user-id', 'new-refresh-token', {
      ip: '',
      userAgent: '',
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('handles repository error in findUserByUsername gracefully', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        username: 'newuser',
        password: 'password123',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'TestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await expect(register(mockRepo)(req, res)).rejects.toThrow('Database connection failed');
    expect(mockRepo.findUserByUsername).toHaveBeenCalledWith('newuser');
    expect(mockRepo.createUser).not.toHaveBeenCalled();
  });

  it('handles repository error in createUser gracefully', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn().mockResolvedValue(null),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn().mockRejectedValue(new Error('Failed to create user')),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    const req = {
      body: {
        username: 'newuser',
        password: 'password123',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'TestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await expect(register(mockRepo)(req, res)).rejects.toThrow('Failed to create user');
    expect(mockRepo.findUserByUsername).toHaveBeenCalledWith('newuser');
    expect(mockRepo.createUser).toHaveBeenCalledWith('newuser', expect.any(String));
  });

  it('handles repository error in saveRefreshToken gracefully', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn().mockResolvedValue(null),
      saveRefreshToken: vi.fn().mockRejectedValue(new Error('Failed to save refresh token')),
      createUser: vi.fn().mockResolvedValue({
        id: 'new-user-id',
        username: 'newuser',
        password: await hashPassword('password123'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    mockGenerateAccessToken.mockReturnValue('new-access-token');
    mockGenerateRefreshToken.mockReturnValue('new-refresh-token');

    const req = {
      body: {
        username: 'newuser',
        password: 'password123',
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'TestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await expect(register(mockRepo)(req, res)).rejects.toThrow('Failed to save refresh token');
    expect(mockRepo.createUser).toHaveBeenCalledWith('newuser', expect.any(String));
    expect(mockRepo.saveRefreshToken).toHaveBeenCalledWith('new-user-id', 'new-refresh-token', expect.any(Object));
  });

  it('hashes password before storing', async () => {
    const mockRepo = {
      findUserByUsername: vi.fn().mockResolvedValue(null),
      saveRefreshToken: vi.fn(),
      createUser: vi.fn().mockResolvedValue({
        id: 'new-user-id',
        username: 'newuser',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      revokeRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
    };

    mockGenerateAccessToken.mockReturnValue('new-access-token');
    mockGenerateRefreshToken.mockReturnValue('new-refresh-token');

    const plainPassword = 'password123';
    const req = {
      body: {
        username: 'newuser',
        password: plainPassword,
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'TestAgent',
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await register(mockRepo)(req, res);

    // Verify that createUser was called with a hashed password (not the plain password)
    expect(mockRepo.createUser).toHaveBeenCalledWith('newuser', expect.any(String));
    const createUserCall = mockRepo.createUser.mock.calls[0];
    const hashedPassword = createUserCall[1];

    // The hashed password should not equal the plain password
    expect(hashedPassword).not.toBe(plainPassword);
    // The hashed password should be a string
    expect(typeof hashedPassword).toBe('string');
    // The hashed password should start with bcrypt hash prefix
    expect(hashedPassword).toMatch(/^\$2[aby]\$/);
  });
});
