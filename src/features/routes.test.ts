import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import authRoutes from './auth/routes';
import { prismaAuthRepository } from './auth/model/prismaAuthRepository';
import { hashPassword } from './auth/service/hash';

vi.mock('./auth/model/prismaAuthRepository', () => ({
  prismaAuthRepository: {
    findUserByUsername: vi.fn(),
    createUser: vi.fn(),
    saveRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    findRefreshToken: vi.fn(),
  },
}));

vi.mock('./auth/service/jwt', () => ({
  generateAccessToken: vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
}));

vi.mock('@shared/service/jwt', () => ({
  verifyToken: vi.fn(),
}));

describe('Auth Routes Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await hashPassword('password123');

      vi.mocked(prismaAuthRepository.findUserByUsername).mockResolvedValue({
        id: 'user-id',
        username: 'testuser',
        password: hashedPassword,
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-id',
          username: 'testuser',
        },
      });
    });

    it('should return 401 for invalid credentials', async () => {
      vi.mocked(prismaAuthRepository.findUserByUsername).mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toEqual({
        error: 'Invalid credentials',
      });
    });

    it('should return 401 when username is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toEqual({
        error: 'Invalid credentials',
      });
    });

    it('should return 401 when password is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
        })
        .expect(401);

      expect(response.body).toEqual({
        error: 'Invalid credentials',
      });
    });

    it('should return 500 when request body is malformed', async () => {
      const response = await request(app).post('/auth/login').send('invalid json').expect(500); // Raw invalid data causes 500
    });
  });

  describe('POST /auth/register', () => {
    it('should register successfully with valid data', async () => {
      vi.mocked(prismaAuthRepository.findUserByUsername).mockResolvedValue(null);
      vi.mocked(prismaAuthRepository.createUser).mockResolvedValue({
        id: 'new-user-id',
        username: 'newuser',
        password: 'hashed-password',
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'newuser',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'new-user-id',
          username: 'newuser',
        },
      });
    });

    it('should return 409 when user already exists', async () => {
      vi.mocked(prismaAuthRepository.findUserByUsername).mockResolvedValue({
        id: 'existing-user-id',
        username: 'existinguser',
        password: 'hashed-password',
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'existinguser',
          password: 'password123',
        })
        .expect(409);

      expect(response.body).toEqual({
        error: 'User already exists',
      });
    });

    it('should return 400 when username is missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Username and password are required',
      });
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'newuser',
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Username and password are required',
      });
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      const { verifyToken } = await import('@shared/service/jwt');
      vi.mocked(verifyToken).mockReturnValue({ id: 'user-id' });

      const response = await request(app)
        .post('/auth/logout')
        .send({
          refreshToken: 'valid-refresh-token',
        })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Logged out successfully',
      });
    });

    it('should return 400 when refresh token is missing', async () => {
      const response = await request(app).post('/auth/logout').send({}).expect(400);

      expect(response.body).toEqual({
        error: 'Refresh token is required',
      });
    });

    it('should return 401 when refresh token is invalid', async () => {
      const { verifyToken } = await import('@shared/service/jwt');
      vi.mocked(verifyToken).mockReturnValue(null);

      const response = await request(app)
        .post('/auth/logout')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401);

      expect(response.body).toEqual({
        error: 'Invalid refresh token',
      });
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token successfully with valid refresh token', async () => {
      const { verifyToken } = await import('@shared/service/jwt');
      vi.mocked(verifyToken).mockReturnValue({
        id: 'user-id',
        username: 'testuser',
      });

      vi.mocked(prismaAuthRepository.findRefreshToken).mockResolvedValue({
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // expires in 24 hours
      });

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token',
        })
        .expect(200);

      expect(response.body).toEqual({
        accessToken: 'mock-access-token',
      });
    });

    it('should return 401 when refresh token is missing', async () => {
      const response = await request(app).post('/auth/refresh').send({}).expect(401);

      expect(response.body).toEqual({
        error: 'Refresh token is required',
      });
    });

    it('should return 401 when refresh token is invalid', async () => {
      const { verifyToken } = await import('@shared/service/jwt');
      vi.mocked(verifyToken).mockReturnValue(null);

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401);

      expect(response.body).toEqual({
        error: 'Invalid refresh token',
      });
    });

    it('should return 403 when refresh token is not found in database', async () => {
      const { verifyToken } = await import('@shared/service/jwt');
      vi.mocked(verifyToken).mockReturnValue({
        id: 'user-id',
        username: 'testuser',
      });

      vi.mocked(prismaAuthRepository.findRefreshToken).mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'nonexistent-token',
        })
        .expect(403);

      expect(response.body).toEqual({
        error: 'Refresh token not found or expired',
      });
    });

    it('should return 403 when refresh token is expired', async () => {
      const { verifyToken } = await import('@shared/service/jwt');
      vi.mocked(verifyToken).mockReturnValue({
        id: 'user-id',
        username: 'testuser',
      });

      vi.mocked(prismaAuthRepository.findRefreshToken).mockResolvedValue({
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // expired 24 hours ago
      });

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'expired-token',
        })
        .expect(403);

      expect(response.body).toEqual({
        error: 'Refresh token not found or expired',
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(prismaAuthRepository.findUserByUsername).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(500);

      // The exact error response depends on your error handling middleware
      // This test verifies that the error is caught and handled
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400); // Express returns 400 for malformed JSON
    });
  });

  describe('Route existence', () => {
    it('should have all required auth routes', async () => {
      // Test that all routes exist by checking 404 is not returned for valid endpoints
      const endpoints = ['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh'];

      for (const endpoint of endpoints) {
        const response = await request(app).post(endpoint).send({});
        expect(response.status).not.toBe(404);
      }
    });

    it('should return 404 for non-existent routes', async () => {
      await request(app).post('/auth/nonexistent').send({}).expect(404);
    });

    it('should only accept POST methods for auth routes', async () => {
      const endpoints = ['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh'];

      for (const endpoint of endpoints) {
        await request(app).get(endpoint).expect(404);
        await request(app).put(endpoint).expect(404);
        await request(app).delete(endpoint).expect(404);
      }
    });
  });
});
