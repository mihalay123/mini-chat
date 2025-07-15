import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessage } from './sendMessage';
import { createMockMessageRepo, createReq, createRes, mockMessage } from './__test-utils__/messageTestHelpers';

// Mock socket.io
vi.mock('app/init', () => ({
  io: {
    to: vi.fn().mockReturnValue({
      emit: vi.fn(),
    }),
  },
}));

describe('sendMessage use case', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if chatId is missing', async () => {
    const mockRepo = createMockMessageRepo();
    const req = createReq({}, {}, { id: 'user-1' }, { text: 'Hello world' });
    const res = createRes();

    await sendMessage(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Chat ID is required' });
  });

  it('should return 400 if message text is missing', async () => {
    const mockRepo = createMockMessageRepo();
    const req = createReq({ chatId: 'chat-1' }, {}, { id: 'user-1' }, {});
    const res = createRes();

    await sendMessage(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Message text is required' });
  });

  it('should return 400 if message text is empty string', async () => {
    const mockRepo = createMockMessageRepo();
    const req = createReq({ chatId: 'chat-1' }, {}, { id: 'user-1' }, { text: '' });
    const res = createRes();

    await sendMessage(mockRepo)(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Message text is required' });
  });

  it('should return 403 if user is not a member of the chat', async () => {
    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockResolvedValue(false),
    });
    const req = createReq({ chatId: 'chat-1' }, {}, { id: 'user-1' }, { text: 'Hello world' });
    const res = createRes();

    await sendMessage(mockRepo)(req, res);

    expect(mockRepo.isChatMember).toHaveBeenCalledWith('chat-1', 'user-1');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'You are not in this chat' });
  });

  it('should return 500 if message sending fails', async () => {
    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockResolvedValue(true),
      sendMessage: vi.fn().mockResolvedValue(null),
    });
    const req = createReq({ chatId: 'chat-1' }, {}, { id: 'user-1' }, { text: 'Hello world' });
    const res = createRes();

    await sendMessage(mockRepo)(req, res);

    expect(mockRepo.isChatMember).toHaveBeenCalledWith('chat-1', 'user-1');
    expect(mockRepo.sendMessage).toHaveBeenCalledWith('chat-1', 'user-1', 'Hello world');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to send message' });
  });

  it('should successfully send message and emit socket event', async () => {
    const { io } = await import('app/init');
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    (io.to as any) = mockTo;

    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockResolvedValue(true),
      sendMessage: vi.fn().mockResolvedValue(mockMessage),
    });
    const req = createReq({ chatId: 'chat-1' }, {}, { id: 'user-1' }, { text: 'Hello world' });
    const res = createRes();

    await sendMessage(mockRepo)(req, res);

    expect(mockRepo.isChatMember).toHaveBeenCalledWith('chat-1', 'user-1');
    expect(mockRepo.sendMessage).toHaveBeenCalledWith('chat-1', 'user-1', 'Hello world');

    // Check socket.io emission
    expect(mockTo).toHaveBeenCalledWith('chat-1');
    expect(mockEmit).toHaveBeenCalledWith('chat-1:message', {
      id: mockMessage.id,
      text: mockMessage.text,
      timestamp: mockMessage.createdAt,
      senderId: mockMessage.senderId,
      senderUsername: mockMessage.sender.username,
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockMessage);
  });

  it('should handle user without id gracefully', async () => {
    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockResolvedValue(true),
      sendMessage: vi.fn().mockResolvedValue(mockMessage),
    });
    const req = createReq({ chatId: 'chat-1' }, {}, {}, { text: 'Hello world' });
    const res = createRes();

    await sendMessage(mockRepo)(req, res);

    expect(mockRepo.isChatMember).toHaveBeenCalledWith('chat-1', '');
    expect(mockRepo.sendMessage).toHaveBeenCalledWith('chat-1', '', 'Hello world');
  });

  it('should handle repository errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockRejectedValue(new Error('Database error')),
    });
    const req = createReq({ chatId: 'chat-1' }, {}, { id: 'user-1' }, { text: 'Hello world' });
    const res = createRes();

    await sendMessage(mockRepo)(req, res);

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to send message' });

    consoleErrorSpy.mockRestore();
  });

  it('should handle sendMessage repository errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockResolvedValue(true),
      sendMessage: vi.fn().mockRejectedValue(new Error('Database error')),
    });
    const req = createReq({ chatId: 'chat-1' }, {}, { id: 'user-1' }, { text: 'Hello world' });
    const res = createRes();

    await sendMessage(mockRepo)(req, res);

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to send message' });

    consoleErrorSpy.mockRestore();
  });

  it('should handle special characters in message text', async () => {
    const { io } = await import('app/init');
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    (io.to as any) = mockTo;

    const specialMessage = {
      ...mockMessage,
      text: 'Special chars: 🚀 @user #hashtag <script>alert("xss")</script>',
    };

    const mockRepo = createMockMessageRepo({
      isChatMember: vi.fn().mockResolvedValue(true),
      sendMessage: vi.fn().mockResolvedValue(specialMessage),
    });
    const req = createReq(
      { chatId: 'chat-1' },
      {},
      { id: 'user-1' },
      { text: 'Special chars: 🚀 @user #hashtag <script>alert("xss")</script>' }
    );
    const res = createRes();

    await sendMessage(mockRepo)(req, res);

    expect(mockRepo.sendMessage).toHaveBeenCalledWith(
      'chat-1',
      'user-1',
      'Special chars: 🚀 @user #hashtag <script>alert("xss")</script>'
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(specialMessage);
  });
});
