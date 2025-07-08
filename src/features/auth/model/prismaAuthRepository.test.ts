import { prismaAuthRepository } from './prismaAuthRepository';
import { prisma } from '@shared/prisma';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Prisma client
vi.mock('@shared/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('prismaAuthRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findUserByUsername', () => {
    it('returns user when found', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      const result = await prismaAuthRepository.findUserByUsername('testuser');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(result).toEqual({
        id: '1',
        username: 'testuser',
        password: 'hashed-password',
      });
    });

    it('returns null for non-existent user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const result = await prismaAuthRepository.findUserByUsername('nonexistent');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'nonexistent' } });
      expect(result).toBeNull();
    });

    it('handles database errors', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(prismaAuthRepository.findUserByUsername('testuser')).rejects.toThrow('Database connection failed');
    });
  });

  describe('createUser', () => {
    it('creates a new user successfully', async () => {
      const mockUser = {
        id: 'new-user-id',
        username: 'newuser',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.user.create).mockResolvedValueOnce(mockUser);

      const result = await prismaAuthRepository.createUser('newuser', 'hashed-password');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'newuser',
          password: 'hashed-password',
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('handles duplicate username error', async () => {
      vi.mocked(prisma.user.create).mockRejectedValueOnce(new Error('Unique constraint failed'));

      await expect(prismaAuthRepository.createUser('existing-user', 'password')).rejects.toThrow(
        'Unique constraint failed'
      );
    });
  });

  describe('saveRefreshToken', () => {
    it('saves a refresh token successfully', async () => {
      const mockRefreshToken = {
        id: 'refresh-token-id',
        token: 'refresh-token-value',
        userId: 'user-id',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        expiresAt: new Date('2023-01-08T00:00:00.000Z'),
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      };
      vi.mocked(prisma.refreshToken.create).mockResolvedValueOnce(mockRefreshToken);

      const result = await prismaAuthRepository.saveRefreshToken('user-id', 'refresh-token-value', {
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      });

      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          token: 'refresh-token-value',
          userId: 'user-id',
          expiresAt: expect.any(Date),
          userAgent: 'test-agent',
          ip: '127.0.0.1',
        },
      });
      expect(result).toEqual(mockRefreshToken);
    });

    it('sets expiration date to 7 days from now', async () => {
      const mockRefreshToken = {
        id: 'refresh-token-id',
        token: 'refresh-token-value',
        userId: 'user-id',
        createdAt: new Date(),
        expiresAt: new Date(),
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      };
      vi.mocked(prisma.refreshToken.create).mockResolvedValueOnce(mockRefreshToken);

      const beforeCall = Date.now();
      await prismaAuthRepository.saveRefreshToken('user-id', 'refresh-token-value', {
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      });
      const afterCall = Date.now();

      const createCall = vi.mocked(prisma.refreshToken.create).mock.calls[0][0];
      const expiresAt = createCall.data.expiresAt as Date;
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(beforeCall + sevenDaysInMs);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(afterCall + sevenDaysInMs);
    });

    it('handles database errors during token creation', async () => {
      vi.mocked(prisma.refreshToken.create).mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(
        prismaAuthRepository.saveRefreshToken('user-id', 'token', {
          userAgent: 'agent',
          ip: '127.0.0.1',
        })
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('revokeRefreshToken', () => {
    it('deletes refresh tokens successfully', async () => {
      vi.mocked(prisma.refreshToken.deleteMany).mockResolvedValueOnce({ count: 1 });

      const result = await prismaAuthRepository.revokeRefreshToken('refresh-token-value');

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'refresh-token-value' },
      });
      expect(result).toEqual({ count: 1 });
    });

    it('returns count 0 when no tokens found', async () => {
      vi.mocked(prisma.refreshToken.deleteMany).mockResolvedValueOnce({ count: 0 });

      const result = await prismaAuthRepository.revokeRefreshToken('nonexistent-token');

      expect(result).toEqual({ count: 0 });
    });

    it('handles database errors during token deletion', async () => {
      vi.mocked(prisma.refreshToken.deleteMany).mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(prismaAuthRepository.revokeRefreshToken('token')).rejects.toThrow('Database connection failed');
    });
  });

  describe('findRefreshToken', () => {
    it('returns token record when found', async () => {
      const mockTokenRecord = {
        id: 'token-id',
        token: 'refresh-token-value',
        userId: 'user-id',
        createdAt: new Date(),
        expiresAt: new Date('2023-01-08T00:00:00.000Z'),
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      };
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValueOnce(mockTokenRecord);

      const result = await prismaAuthRepository.findRefreshToken('refresh-token-value');

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'refresh-token-value' },
      });
      expect(result).toEqual({
        expiresAt: new Date('2023-01-08T00:00:00.000Z'),
      });
    });

    it('returns null when token not found', async () => {
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValueOnce(null);

      const result = await prismaAuthRepository.findRefreshToken('nonexistent-token');

      expect(result).toBeNull();
    });

    it('handles database errors during token lookup', async () => {
      vi.mocked(prisma.refreshToken.findUnique).mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(prismaAuthRepository.findRefreshToken('token')).rejects.toThrow('Database connection failed');
    });
  });
});
