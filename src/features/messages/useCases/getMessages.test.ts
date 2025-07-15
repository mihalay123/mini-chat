import { describe, it, expect, vi } from 'vitest';
import { getMessages } from './getMessages';
import { createMockMessageRepo, createReq, createRes, mockMessages } from './__test-utils__/messageTestHelpers';

describe('getMessages use case', () => {
  it('should return 400 if chatId is missing', async () => {
    const mockRepo = createMockMessageRepo();
    const req = createReq({}, {}, { id: 'user-1' });
    const res = createRes();

    await getMessages(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Chat ID is required' });
  });

  it('should return 401 if user is not authenticated', async () => {
    const mockRepo = createMockMessageRepo();
    const req = createReq({ chatId: 'chat-1' }, {}, null);
    const res = createRes();

    await getMessages(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'User ID is required' });
  });

  it('should return 401 if user id is missing', async () => {
    const mockRepo = createMockMessageRepo();
    const req = createReq({ chatId: 'chat-1' }, {}, {});
    const res = createRes();

    await getMessages(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'User ID is required' });
  });

  it('should return 403 if user is not a member of the chat', async () => {
    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockResolvedValue(false),
    });
    const req = createReq({ chatId: 'chat-1' }, {}, { id: 'user-1' });
    const res = createRes();

    await getMessages(mockRepo)(req, res);

    expect(mockRepo.isChatMember).toHaveBeenCalledWith('chat-1', 'user-1');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'You are not in this chat' });
  });

  it('should return 404 if no messages found', async () => {
    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockResolvedValue(true),
      getMessages: vi.fn().mockResolvedValue(null),
    });
    const req = createReq({ chatId: 'chat-1' }, {}, { id: 'user-1' });
    const res = createRes();

    await getMessages(mockRepo)(req, res);

    expect(mockRepo.isChatMember).toHaveBeenCalledWith('chat-1', 'user-1');
    expect(mockRepo.getMessages).toHaveBeenCalledWith('chat-1', undefined, 20);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No messages found' });
  });

  it('should return 200 with messages for valid request', async () => {
    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockResolvedValue(true),
      getMessages: vi.fn().mockResolvedValue(mockMessages),
    });
    const req = createReq({ chatId: 'chat-1' }, {}, { id: 'user-1' });
    const res = createRes();

    await getMessages(mockRepo)(req, res);

    expect(mockRepo.isChatMember).toHaveBeenCalledWith('chat-1', 'user-1');
    expect(mockRepo.getMessages).toHaveBeenCalledWith('chat-1', undefined, 20);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockMessages);
  });

  it('should use custom limit from query params', async () => {
    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockResolvedValue(true),
      getMessages: vi.fn().mockResolvedValue(mockMessages),
    });
    const req = createReq({ chatId: 'chat-1' }, { limit: '50' }, { id: 'user-1' });
    const res = createRes();

    await getMessages(mockRepo)(req, res);

    expect(mockRepo.getMessages).toHaveBeenCalledWith('chat-1', undefined, 50);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockMessages);
  });

  it('should use cursor from query params for pagination', async () => {
    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockResolvedValue(true),
      getMessages: vi.fn().mockResolvedValue(mockMessages),
    });
    const req = createReq({ chatId: 'chat-1' }, { cursor: 'msg-5', limit: '10' }, { id: 'user-1' });
    const res = createRes();

    await getMessages(mockRepo)(req, res);

    expect(mockRepo.getMessages).toHaveBeenCalledWith('chat-1', 'msg-5', 10);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockMessages);
  });

  it('should default to limit 20 if limit is not a valid number', async () => {
    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockResolvedValue(true),
      getMessages: vi.fn().mockResolvedValue(mockMessages),
    });
    const req = createReq({ chatId: 'chat-1' }, { limit: 'invalid' }, { id: 'user-1' });
    const res = createRes();

    await getMessages(mockRepo)(req, res);

    expect(mockRepo.getMessages).toHaveBeenCalledWith('chat-1', undefined, 20);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockMessages);
  });

  it('should handle repository errors gracefully', async () => {
    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockRejectedValue(new Error('Database error')),
    });
    const req = createReq({ chatId: 'chat-1' }, {}, { id: 'user-1' });
    const res = createRes();

    await expect(getMessages(mockRepo)(req, res)).rejects.toThrow('Database error');
    expect(mockRepo.isChatMember).toHaveBeenCalledWith('chat-1', 'user-1');
  });
});
