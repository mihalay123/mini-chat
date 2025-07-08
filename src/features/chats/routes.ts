import { Router } from 'express';
import { createChat } from './useCases/createChat';
import { authMiddleware } from '@shared/middlewares/authMiddleware';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { prismaChatRepository } from './model/prismaChatRepository';

const router = Router();

const createChatHandler = asyncHandler(createChat(prismaChatRepository));

router.post('/', authMiddleware, createChatHandler);

export default router;
