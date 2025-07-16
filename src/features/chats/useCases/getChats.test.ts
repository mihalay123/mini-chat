import { describe, it, expect, vi } from 'vitest';
import { getChats } from './getChats';
import { createMockChatRepo, createReq, createRes } from './__test-utils__/chatTestHelpers';

describe('getChats use case', () => {
  it('successfully returns user chats', async () => {
    const mockChats = [
      {
        id: 'chat-1',
        name: 'Test Chat 1',
        isGroup: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'chat-2',
        name: 'Test Group',
        isGroup: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockRepo = createMockChatRepo({
      getChatsByUserId: vi.fn().mockResolvedValue(mockChats),
    });

    const req = createReq({}, { id: 'user-id' });
    const res = createRes();

    await getChats(mockRepo)(req, res);

    expect(mockRepo.getChatsByUserId).toHaveBeenCalledWith('user-id');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockChats);
  });

  it('returns 401 when user is not authenticated', async () => {
    const mockRepo = createMockChatRepo();
    const req = createReq({}, null);
    const res = createRes();

    await getChats(mockRepo)(req, res);

    expect(mockRepo.getChatsByUserId).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: user id missing' });
  });

  it('returns 401 when user id is missing', async () => {
    const mockRepo = createMockChatRepo();
    const req = createReq({}, {});
    const res = createRes();

    await getChats(mockRepo)(req, res);

    expect(mockRepo.getChatsByUserId).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: user id missing' });
  });

  it('returns 500 when repository returns null', async () => {
    const mockRepo = createMockChatRepo({
      getChatsByUserId: vi.fn().mockResolvedValue(null),
    });

    const req = createReq({}, { id: 'user-id' });
    const res = createRes();

    await getChats(mockRepo)(req, res);

    expect(mockRepo.getChatsByUserId).toHaveBeenCalledWith('user-id');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get chats' });
  });

  it('returns 404 when no chats found', async () => {
    const mockRepo = createMockChatRepo({
      getChatsByUserId: vi.fn().mockResolvedValue([]),
    });

    const req = createReq({}, { id: 'user-id' });
    const res = createRes();

    await getChats(mockRepo)(req, res);

    expect(mockRepo.getChatsByUserId).toHaveBeenCalledWith('user-id');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'No chats found' });
  });

  it('handles repository error gracefully', async () => {
    const mockRepo = createMockChatRepo({
      getChatsByUserId: vi.fn().mockRejectedValue(new Error('Database error')),
    });

    const req = createReq({}, { id: 'user-id' });
    const res = createRes();

    await expect(getChats(mockRepo)(req, res)).rejects.toThrow('Database error');
    expect(mockRepo.getChatsByUserId).toHaveBeenCalledWith('user-id');
  });

  it('returns single chat successfully', async () => {
    const mockChats = [
      {
        id: 'chat-1',
        name: 'Single Chat',
        isGroup: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockRepo = createMockChatRepo({
      getChatsByUserId: vi.fn().mockResolvedValue(mockChats),
    });

    const req = createReq({}, { id: 'user-id' });
    const res = createRes();

    await getChats(mockRepo)(req, res);

    expect(mockRepo.getChatsByUserId).toHaveBeenCalledWith('user-id');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockChats);
  });
});
