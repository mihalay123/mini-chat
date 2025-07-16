import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userRoutes from './routes';
import { generateAccessToken } from '../auth/service/jwt';

// Mock the getMe use case
vi.mock('./useCases/getMe', () => ({
  getMe: vi.fn(),
}));

import { getMe } from './useCases/getMe';

describe('User routes', () => {
  let app: express.Application;
  const mockGetMe = vi.mocked(getMe);

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/user', userRoutes);

    // Add error handler for asyncHandler
    app.use((err: any, req: any, res: any, next: any) => {
      res.status(500).json({ error: 'Internal Server Error' });
    });
  });

  describe('GET /user/me', () => {
    it('responds with 401 when no authorization header provided', async () => {
      const res = await request(app).get('/user/me');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: 'Authorization header missing or invalid',
      });
      expect(mockGetMe).not.toHaveBeenCalled();
    });

    it('responds with 401 when authorization header is invalid', async () => {
      const res = await request(app).get('/user/me').set('Authorization', 'InvalidHeader');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: 'Authorization header missing or invalid',
      });
      expect(mockGetMe).not.toHaveBeenCalled();
    });

    it('responds with 401 when authorization header does not start with Bearer', async () => {
      const res = await request(app).get('/user/me').set('Authorization', 'Basic some-token');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: 'Authorization header missing or invalid',
      });
      expect(mockGetMe).not.toHaveBeenCalled();
    });

    it('responds with 401 when token is invalid', async () => {
      const res = await request(app).get('/user/me').set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: 'Invalid or expired token',
      });
      expect(mockGetMe).not.toHaveBeenCalled();
    });

    it('responds with 401 when token is empty', async () => {
      const res = await request(app).get('/user/me').set('Authorization', 'Bearer');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: 'Authorization header missing or invalid',
      });
      expect(mockGetMe).not.toHaveBeenCalled();
    });

    it('successfully calls getMe with valid token', async () => {
      const userPayload = { id: 'user-123', username: 'testuser' };
      const validToken = generateAccessToken(userPayload);

      // Mock getMe to simulate successful response
      mockGetMe.mockImplementation(async (req, res) => {
        res.status(200).json({
          id: req.user?.id,
          username: req.user?.username,
        });
      });

      const res = await request(app).get('/user/me').set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 'user-123',
        username: 'testuser',
      });
      expect(mockGetMe).toHaveBeenCalledTimes(1);

      // Verify that req.user was set correctly by the auth middleware
      const callArgs = mockGetMe.mock.calls[0];
      const req = callArgs[0];
      expect(req.user).toEqual(userPayload);
    });

    it('handles getMe returning 401 for missing user', async () => {
      const userPayload = { id: 'user-456', username: 'anotheruser' };
      const validToken = generateAccessToken(userPayload);

      // Mock getMe to simulate unauthorized response
      mockGetMe.mockImplementation(async (req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const res = await request(app).get('/user/me').set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
      expect(mockGetMe).toHaveBeenCalledTimes(1);
    });

    it('handles different user data in token', async () => {
      const userPayload = {
        id: 'admin-user',
        username: 'adminuser',
      };
      const validToken = generateAccessToken(userPayload);

      mockGetMe.mockImplementation(async (req, res) => {
        res.status(200).json({
          id: req.user?.id,
          username: req.user?.username,
        });
      });

      const res = await request(app).get('/user/me').set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 'admin-user',
        username: 'adminuser',
      });
      expect(mockGetMe).toHaveBeenCalledTimes(1);
    });

    it('handles asyncHandler error properly', async () => {
      const userPayload = { id: 'error-user', username: 'erroruser' };
      const validToken = generateAccessToken(userPayload);

      // Mock getMe to throw an error
      mockGetMe.mockImplementation(async () => {
        throw new Error('Internal server error');
      });

      const res = await request(app).get('/user/me').set('Authorization', `Bearer ${validToken}`);

      // asyncHandler should catch the error and return 500
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal Server Error' });
      expect(mockGetMe).toHaveBeenCalledTimes(1);
    });

    it('verifies request flow with multiple fields in token', async () => {
      const userPayload = {
        id: 'complex-user',
        username: 'complexuser',
        // Additional fields that should not be used by the middleware
        role: 'admin',
        email: 'test@example.com',
      };
      const validToken = generateAccessToken(userPayload);

      mockGetMe.mockImplementation(async (req, res) => {
        res.status(200).json({
          id: req.user?.id,
          username: req.user?.username,
        });
      });

      const res = await request(app).get('/user/me').set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 'complex-user',
        username: 'complexuser',
      });

      // Verify that only id and username are extracted by auth middleware
      const callArgs = mockGetMe.mock.calls[0];
      const req = callArgs[0];
      expect(req.user).toEqual({
        id: 'complex-user',
        username: 'complexuser',
      });
    });
  });
});
