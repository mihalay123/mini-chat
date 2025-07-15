import { asyncHandler } from '@shared/utils/asyncHandler';
import { sendMessage } from './useCases/sendMessage';
import { Router } from 'express';
import { authMiddleware } from '@shared/middlewares/authMiddleware';

const router = Router();

const sendMessageHandler = asyncHandler(sendMessage);

router.post('/:chatId/messages', authMiddleware, sendMessageHandler);

export default router;
