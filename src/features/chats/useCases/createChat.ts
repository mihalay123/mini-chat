import { Request, Response } from 'express';
import { ChatRepository } from '../model/ChatRepository';

export const createChat = (chatRepo: ChatRepository) => async (req: Request, res: Response) => {
  const { name, isGroup } = req.body || { isGroup: false, name: '' };
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized: user id missing' });
    return;
  }

  if (isGroup && !name) {
    res.status(400).json({ error: 'Group chat must have a name' });
    return;
  }

  const chat = await chatRepo.createChat(userId, name, isGroup);
  if (!chat) {
    res.status(500).json({ error: 'Failed to create chat' });
    return;
  }
  res.status(201).json(chat);
};
