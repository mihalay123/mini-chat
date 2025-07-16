import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { getMe } from './getMe';

// Mock request helper
const createReq = (user: any = null): Request =>
  ({
    user,
  }) as Request;

// Mock response helper
const createRes = (): Response =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  }) as unknown as Response;

describe('getMe use case', () => {
  it('successfully returns authenticated user data', async () => {
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
    };

    const req = createReq(mockUser);
    const res = createRes();

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 'user-123',
      username: 'testuser',
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    const req = createReq(null);
    const res = createRes();

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('returns 401 when user is undefined', async () => {
    const req = createReq(undefined);
    const res = createRes();

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('returns only id and username fields', async () => {
    const mockUser = {
      id: 'user-456',
      username: 'anotheruser',
      password: 'secret-password',
      email: 'user@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const req = createReq(mockUser);
    const res = createRes();

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 'user-456',
      username: 'anotheruser',
    });

    // Ensure sensitive data is not returned
    const jsonCall = vi.mocked(res.json).mock.calls[0][0];
    expect(jsonCall).not.toHaveProperty('password');
    expect(jsonCall).not.toHaveProperty('email');
    expect(jsonCall).not.toHaveProperty('createdAt');
    expect(jsonCall).not.toHaveProperty('updatedAt');
  });

  it('handles user with minimal data', async () => {
    const mockUser = {
      id: 'min-user',
      username: 'minuser',
    };

    const req = createReq(mockUser);
    const res = createRes();

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 'min-user',
      username: 'minuser',
    });
  });

  it('handles user object with missing username', async () => {
    const mockUser = {
      id: 'user-no-username',
      // username is missing
    };

    const req = createReq(mockUser);
    const res = createRes();

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 'user-no-username',
      username: undefined,
    });
  });

  it('handles user object with missing id', async () => {
    const mockUser = {
      // id is missing
      username: 'user-no-id',
    };

    const req = createReq(mockUser);
    const res = createRes();

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: undefined,
      username: 'user-no-id',
    });
  });

  it('handles empty user object', async () => {
    const mockUser = {};

    const req = createReq(mockUser);
    const res = createRes();

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: undefined,
      username: undefined,
    });
  });
});
