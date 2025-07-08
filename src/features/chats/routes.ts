import { Router } from 'express';
import { createChat } from './useCases/createChat';
import { authMiddleware } from '@shared/middlewares/authMiddleware';

const router = Router();

router.post('/', authMiddleware, createChat);

export default router;
