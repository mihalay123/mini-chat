import { asyncHandler } from '@shared/utils/asyncHandler';
import { sendMessage } from './useCases/sendMessage';
import { Router } from 'express';
import { authMiddleware } from '@shared/middlewares/authMiddleware';
import { prismaMessageRepository } from './model/prismaMessageRepository';
import { getMessages } from './useCases/getMessages';

const router = Router();

const sendMessageHandler = asyncHandler(sendMessage(prismaMessageRepository));
const getMessagesHandler = asyncHandler(getMessages(prismaMessageRepository));

router.post('/:chatId/messages', authMiddleware, sendMessageHandler);
router.get('/:chatId/messages', authMiddleware, getMessagesHandler);

export default router;
