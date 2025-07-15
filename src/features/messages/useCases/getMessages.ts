import { prisma } from '@shared/prisma';
import { Request, Response } from 'express';
import { MessageRepository } from '../model/MessageRepository';

export const getMessages = (messageRepo: MessageRepository) => {
  return async (req: Request, res: Response) => {
    const chatId = req.params.chatId;
    const userId = req.user?.id || '';
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const isChatMember = await messageRepo.isChatMember(chatId, userId);

    if (!isChatMember) {
      return res.status(403).json({ error: 'You are not in this chat' });
    }

    const messages = await messageRepo.getMessages(chatId, cursor, limit);

    if (!messages) {
      return res.status(404).json({ error: 'No messages found' });
    }

    res.status(200).json(messages);
  };
};
