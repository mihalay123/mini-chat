import { describe, it, expect, vi } from 'vitest';
import { createChat } from './createChat';
import { createMockChatRepo, createReq, createRes } from './__test-utils__/chatTestHelpers';

describe('createChat use case', () => {
  it('successfully creates a private chat', async () => {
    const mockChat = {
      id: 'chat-id',
      name: null,
      isGroup: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRepo = createMockChatRepo({
      createChat: vi.fn().mockResolvedValue(mockChat),
    });

    const req = createReq({ name: '', isGroup: false }, { id: 'user-id' });
    const res = createRes();

    await createChat(mockRepo)(req, res);

    expect(mockRepo.createChat).toHaveBeenCalledWith('user-id', '', false);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockChat);
  });

  it('successfully creates a group chat with name', async () => {
    const mockChat = {
      id: 'group-chat-id',
      name: 'Test Group',
      isGroup: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRepo = createMockChatRepo({
      createChat: vi.fn().mockResolvedValue(mockChat),
    });

    const req = createReq({ name: 'Test Group', isGroup: true }, { id: 'user-id' });
    const res = createRes();

    await createChat(mockRepo)(req, res);

    expect(mockRepo.createChat).toHaveBeenCalledWith('user-id', 'Test Group', true);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockChat);
  });

  it('returns 401 when user is not authenticated', async () => {
    const mockRepo = createMockChatRepo();
    const req = createReq({ name: 'Test Chat', isGroup: false }, null);
    const res = createRes();

    await createChat(mockRepo)(req, res);

    expect(mockRepo.createChat).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: user id missing' });
  });

  it('returns 401 when user id is missing', async () => {
    const mockRepo = createMockChatRepo();
    const req = createReq({ name: 'Test Chat', isGroup: false }, {});
    const res = createRes();

    await createChat(mockRepo)(req, res);

    expect(mockRepo.createChat).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: user id missing' });
  });

  it('returns 400 when creating group chat without name', async () => {
    const mockRepo = createMockChatRepo();
    const req = createReq({ name: '', isGroup: true }, { id: 'user-id' });
    const res = createRes();

    await createChat(mockRepo)(req, res);

    expect(mockRepo.createChat).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Group chat must have a name' });
  });

  it('returns 400 when creating group chat with undefined name', async () => {
    const mockRepo = createMockChatRepo();
    const req = createReq({ isGroup: true }, { id: 'user-id' });
    const res = createRes();

    await createChat(mockRepo)(req, res);

    expect(mockRepo.createChat).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Group chat must have a name' });
  });

  it('returns 500 when chat creation fails', async () => {
    const mockRepo = createMockChatRepo({
      createChat: vi.fn().mockResolvedValue(null),
    });

    const req = createReq({ name: 'Test Chat', isGroup: false }, { id: 'user-id' });
    const res = createRes();

    await createChat(mockRepo)(req, res);

    expect(mockRepo.createChat).toHaveBeenCalledWith('user-id', 'Test Chat', false);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create chat' });
  });

  it('handles missing request body gracefully', async () => {
    const mockChat = {
      id: 'chat-id',
      name: '',
      isGroup: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRepo = createMockChatRepo({
      createChat: vi.fn().mockResolvedValue(mockChat),
    });

    const req = createReq(undefined, { id: 'user-id' });
    const res = createRes();

    await createChat(mockRepo)(req, res);

    expect(mockRepo.createChat).toHaveBeenCalledWith('user-id', '', false);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockChat);
  });

  it('handles repository error gracefully', async () => {
    const mockRepo = createMockChatRepo({
      createChat: vi.fn().mockRejectedValue(new Error('Database error')),
    });

    const req = createReq({ name: 'Test Chat', isGroup: false }, { id: 'user-id' });
    const res = createRes();

    await expect(createChat(mockRepo)(req, res)).rejects.toThrow('Database error');
    expect(mockRepo.createChat).toHaveBeenCalledWith('user-id', 'Test Chat', false);
  });
});
