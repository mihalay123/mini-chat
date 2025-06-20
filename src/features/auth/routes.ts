import { asyncHandler } from '@shared/utils/asyncHandler';
import { Router } from 'express';
import { login } from './useCases/login';
import { prismaAuthRepository } from './model/prismaAuthRepository';
import { register } from './useCases/register';
import { logout } from './useCases/logout';

const router = Router();

const loginHandler = asyncHandler(login(prismaAuthRepository));
const registerHandler = asyncHandler(register(prismaAuthRepository));
const logoutHandler = asyncHandler(logout(prismaAuthRepository));

router.post('/login', loginHandler);
router.post('/register', registerHandler);
router.post('/logout', logoutHandler);

export default router;
