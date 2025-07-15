import { prisma } from '@shared/prisma';
import { io } from 'app/init';
import { Request, Response } from 'express';

export const sendMessage = async (req: Request, res: Response) => {
  const text = req.body.text;
  const chatId = req.params.chatId;
  const userId = req.user?.id || '';

  if (!chatId) {
    res.status(400).json({ error: 'Chat ID is required' });
    return;
  }

  if (!text) {
    res.status(400).json({ error: 'Message text is required' });
    return;
  }

  try {
    const isChatMember = await prisma.chatUser.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });

    if (!isChatMember) {
      return res.status(403).json({ error: 'You are not in this chat' });
    }

    const message = await prisma.message.create({
      data: {
        text,
        chatId,
        senderId: userId,
      },
      include: {
        sender: {
          select: {
            username: true,
          },
        },
      },
    });

    io.to(chatId).emit(`${chatId}:message`, {
      id: message.id,
      text: message.text,
      timestamp: message.createdAt,
      senderId: message.senderId,
      senderUsername: message.sender.username,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};
