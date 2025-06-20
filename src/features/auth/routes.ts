// import { asyncHandler } from '@shared/utils/asyncHandler';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { Router } from 'express';
import { login } from './useCases/login';
import { prismaAuthRepository } from './model/prismaAuthRepository';

const router = Router();

const loginHandler = asyncHandler(login(prismaAuthRepository));

router.post('/login', loginHandler);

export default router;
