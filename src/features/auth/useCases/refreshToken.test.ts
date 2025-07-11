import { createMockRepo, createReq, createRes } from './__test-utils__/authTestHelpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refreshToken } from './refreshToken';
import { Request, Response } from 'express';
import * as sharedJwtService from '@shared/service/jwt';
import * as authJwtService from '../service/jwt';

// Mock the JWT services
vi.mock('@shared/service/jwt', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('../service/jwt', () => ({
  generateAccessToken: vi.fn(),
}));

describe('refreshToken use case', () => {
  const mockVerifyToken = vi.mocked(sharedJwtService.verifyToken);
  const mockGenerateAccessToken = vi.mocked(authJwtService.generateAccessToken);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 and new access token for valid refresh token', async () => {
    const mockRepo = createMockRepo({
      findRefreshToken: vi.fn().mockResolvedValue({
        id: 'token-id',
        token: 'valid-refresh-token',
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // expires in 24 hours
        createdAt: new Date(),
      }),
    });

    mockVerifyToken.mockReturnValue({
      id: 'user-id',
      username: 'testuser',
    });

    mockGenerateAccessToken.mockReturnValue('new-access-token');

    const req = createReq({ refreshToken: 'valid-refresh-token' });
    const res = createRes();

    await refreshToken(mockRepo)(req, res);

    expect(mockVerifyToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(mockRepo.findRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(mockGenerateAccessToken).toHaveBeenCalledWith({
      id: 'user-id',
      username: 'testuser',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      accessToken: 'new-access-token',
    });
  });

  it('returns 401 if refresh token is missing', async () => {
    const mockRepo = createMockRepo({});
    const req = createReq({});
    const res = createRes();

    await refreshToken(mockRepo)(req, res);

    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockRepo.findRefreshToken).not.toHaveBeenCalled();
    expect(mockGenerateAccessToken).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Refresh token is required',
    });
  });

  it('returns 401 if refresh token is empty string', async () => {
    const mockRepo = createMockRepo({});
    const req = createReq({ refreshToken: '' });
    const res = createRes();

    await refreshToken(mockRepo)(req, res);

    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockRepo.findRefreshToken).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Refresh token is required',
    });
  });

  it('returns 401 if refresh token verification fails', async () => {
    const mockRepo = createMockRepo({});

    mockVerifyToken.mockReturnValue(null);

    const req = createReq({ refreshToken: 'invalid-refresh-token' });
    const res = createRes();

    await refreshToken(mockRepo)(req, res);

    expect(mockVerifyToken).toHaveBeenCalledWith('invalid-refresh-token');
    expect(mockRepo.findRefreshToken).not.toHaveBeenCalled();
    expect(mockGenerateAccessToken).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid refresh token',
    });
  });

  it('returns 403 if refresh token is not found in database', async () => {
    const mockRepo = createMockRepo({
      findRefreshToken: vi.fn().mockResolvedValue(null),
    });

    mockVerifyToken.mockReturnValue({
      id: 'user-id',
      username: 'testuser',
    });

    const req = createReq({ refreshToken: 'nonexistent-token' });
    const res = createRes();

    await refreshToken(mockRepo)(req, res);

    expect(mockVerifyToken).toHaveBeenCalledWith('nonexistent-token');
    expect(mockRepo.findRefreshToken).toHaveBeenCalledWith('nonexistent-token');
    expect(mockGenerateAccessToken).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Refresh token not found or expired',
    });
  });

  it('returns 403 if refresh token is expired', async () => {
    const mockRepo = createMockRepo({
      findRefreshToken: vi.fn().mockResolvedValue({
        id: 'token-id',
        token: 'expired-refresh-token',
        userId: 'user-id',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // expired 24 hours ago
        createdAt: new Date(),
      }),
    });

    mockVerifyToken.mockReturnValue({
      id: 'user-id',
      username: 'testuser',
    });

    const req = createReq({ refreshToken: 'expired-refresh-token' });
    const res = createRes();

    await refreshToken(mockRepo)(req, res);

    expect(mockVerifyToken).toHaveBeenCalledWith('expired-refresh-token');
    expect(mockRepo.findRefreshToken).toHaveBeenCalledWith('expired-refresh-token');
    expect(mockGenerateAccessToken).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Refresh token not found or expired',
    });
  });

  it('handles repository error gracefully', async () => {
    const mockRepo = createMockRepo({
      findRefreshToken: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    });

    mockVerifyToken.mockReturnValue({
      id: 'user-id',
      username: 'testuser',
    });

    const req = createReq({ refreshToken: 'valid-refresh-token' });
    const res = createRes();

    await expect(refreshToken(mockRepo)(req, res)).rejects.toThrow('Database connection failed');
    expect(mockVerifyToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(mockRepo.findRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
  });

  it('handles JWT verification error gracefully', async () => {
    const mockRepo = createMockRepo({});

    mockVerifyToken.mockImplementation(() => {
      throw new Error('JWT verification failed');
    });

    const req = createReq({ refreshToken: 'malformed-token' });
    const res = createRes();

    await expect(refreshToken(mockRepo)(req, res)).rejects.toThrow('JWT verification failed');
    expect(mockRepo.findRefreshToken).not.toHaveBeenCalled();
  });

  it('handles access token generation error gracefully', async () => {
    const mockRepo = createMockRepo({
      findRefreshToken: vi.fn().mockResolvedValue({
        id: 'token-id',
        token: 'valid-refresh-token',
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      }),
    });

    mockVerifyToken.mockReturnValue({
      id: 'user-id',
      username: 'testuser',
    });

    mockGenerateAccessToken.mockImplementation(() => {
      throw new Error('Token generation failed');
    });

    const req = createReq({ refreshToken: 'valid-refresh-token' });
    const res = createRes();

    await expect(refreshToken(mockRepo)(req, res)).rejects.toThrow('Token generation failed');
    expect(mockVerifyToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(mockRepo.findRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
  });

  it('generates access token with correct payload', async () => {
    const mockRepo = createMockRepo({
      findRefreshToken: vi.fn().mockResolvedValue({
        id: 'token-id',
        token: 'valid-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      }),
    });

    const userPayload = {
      id: 'user-123',
      username: 'john_doe',
    };

    mockVerifyToken.mockReturnValue(userPayload);
    mockGenerateAccessToken.mockReturnValue('generated-access-token');

    const req = createReq({ refreshToken: 'valid-refresh-token' });
    const res = createRes();

    await refreshToken(mockRepo)(req, res);

    expect(mockGenerateAccessToken).toHaveBeenCalledWith(userPayload);
    expect(mockGenerateAccessToken).toHaveBeenCalledTimes(1);
  });
});
