import { prisma } from '@shared/prisma';
import { Request, Response } from 'express';
import { MessageRepository } from '../model/MessageRepository';

export const getMessages = (messageRepo: MessageRepository) => {
  return async (req: Request, res: Response) => {
    const chatId = req.params.chatId;
    const userId = req.user?.id || '';

    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID is required' });
    }

    const isChatMember = await messageRepo.isChatMember(chatId, userId);

    if (!isChatMember) {
      return res.status(403).json({ error: 'You are not in this chat' });
    }

    const messages = await messageRepo.getMessages(chatId, userId);

    if (!messages) {
      return res.status(404).json({ error: 'No messages found' });
    }

    res.status(200).json(messages);
  };
};
