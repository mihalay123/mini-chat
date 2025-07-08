import { createMockRepo, createReq, createRes } from './__test-utils__/authTestHelpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logout } from './logout';
import { Request, Response } from 'express';
import * as jwtService from '@shared/service/jwt';

vi.mock('@shared/service/jwt', () => ({
  verifyToken: vi.fn(),
}));

describe('logout use case', () => {
  const mockVerifyToken = vi.mocked(jwtService.verifyToken);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 and logs out successfully with valid refresh token', async () => {
    const mockRepo = createMockRepo({ revokeRefreshToken: vi.fn() });

    mockVerifyToken.mockReturnValue({ id: 'user-id' });

    const req = createReq({ refreshToken: 'valid-refresh-token' });
    const res = createRes();

    await logout(mockRepo)(req, res);

    expect(mockVerifyToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(mockRepo.revokeRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Logged out successfully',
    });
  });

  it('returns 400 if refresh token is missing', async () => {
    const mockRepo = createMockRepo({});
    const req = createReq({});
    const res = createRes();

    await logout(mockRepo)(req, res);

    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockRepo.revokeRefreshToken).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Refresh token is required',
    });
  });

  it('returns 400 if refresh token is empty string', async () => {
    const mockRepo = createMockRepo({});
    const req = createReq({ refreshToken: '' });
    const res = createRes();

    await logout(mockRepo)(req, res);

    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockRepo.revokeRefreshToken).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Refresh token is required',
    });
  });

  it('returns 401 if refresh token is invalid', async () => {
    const mockRepo = createMockRepo({});

    mockVerifyToken.mockReturnValue(null);

    const req = createReq({ refreshToken: 'invalid-refresh-token' });
    const res = createRes();

    await logout(mockRepo)(req, res);

    expect(mockVerifyToken).toHaveBeenCalledWith('invalid-refresh-token');
    expect(mockRepo.revokeRefreshToken).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid refresh token',
    });
  });

  it('returns 401 if refresh token verification throws an error', async () => {
    const mockRepo = createMockRepo({});

    mockVerifyToken.mockImplementation(() => {
      throw new Error('Token verification failed');
    });

    const req = createReq({ refreshToken: 'malformed-token' });
    const res = createRes();

    await expect(logout(mockRepo)(req, res)).rejects.toThrow('Token verification failed');
    expect(mockRepo.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it('handles repository error gracefully', async () => {
    const mockRepo = createMockRepo({
      revokeRefreshToken: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    });

    mockVerifyToken.mockReturnValue({ id: 'user-id' });

    const req = createReq({ refreshToken: 'valid-refresh-token' });
    const res = createRes();

    await expect(logout(mockRepo)(req, res)).rejects.toThrow('Database connection failed');
    expect(mockVerifyToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(mockRepo.revokeRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
  });

  it('calls revokeRefreshToken with correct token', async () => {
    const mockRepo = createMockRepo({ revokeRefreshToken: vi.fn() });

    mockVerifyToken.mockReturnValue({ id: 'user-123' });

    const refreshToken = 'specific-refresh-token-value';
    const req = createReq({ refreshToken });
    const res = createRes();

    await logout(mockRepo)(req, res);

    expect(mockRepo.revokeRefreshToken).toHaveBeenCalledWith(refreshToken);
    expect(mockRepo.revokeRefreshToken).toHaveBeenCalledTimes(1);
  });
});
