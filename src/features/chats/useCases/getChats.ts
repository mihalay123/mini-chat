import { Request, Response } from 'express';
import { ChatRepository } from '../model/ChatRepository';

export const getChats = (ChatRepository: ChatRepository) => async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized: user id missing' });
    return;
  }

  const chats = await ChatRepository.getChatsByUserId(userId);

  if (!chats) {
    res.status(500).json({ error: 'Failed to get chats' });
    return;
  }

  if (chats.length === 0) {
    res.status(404).json({ message: 'No chats found' });
    return;
  }

  res.status(200).json(chats);
  return;
};
