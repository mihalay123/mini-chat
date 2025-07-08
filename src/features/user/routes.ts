import { authMiddleware } from '@shared/middlewares/authMiddleware';
import { Router } from 'express';

import { getMe } from './useCases/getMe';
import { asyncHandler } from '@shared/utils/asyncHandler';

const router = Router();

const getMeHandler = asyncHandler(getMe);

router.get('/me', authMiddleware, getMeHandler);

export default router;
