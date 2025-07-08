import { Router } from 'express';
import { createChat } from './useCases/createChat';
import { authMiddleware } from '@shared/middlewares/authMiddleware';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { prismaChatRepository } from './model/prismaChatRepository';
import { getChats } from './useCases/getChats';

const router = Router();

const createChatHandler = asyncHandler(createChat(prismaChatRepository));
const getChatsHandler = asyncHandler(getChats(prismaChatRepository));

router.post('/', authMiddleware, createChatHandler);
router.get('/', authMiddleware, getChatsHandler);

export default router;
