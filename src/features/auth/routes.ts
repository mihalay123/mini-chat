// import { asyncHandler } from '@shared/utils/asyncHandler';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { Router } from 'express';
import { login } from './useCases/login';
import { prismaAuthRepository } from './model/prismaAuthRepository';
import { register } from './useCases/register';

const router = Router();

const loginHandler = asyncHandler(login(prismaAuthRepository));
const registerHandler = asyncHandler(register(prismaAuthRepository));

router.post('/login', loginHandler);
router.post('/register', registerHandler);

export default router;
