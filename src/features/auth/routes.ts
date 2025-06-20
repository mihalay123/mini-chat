import { asyncHandler } from '@shared/utils/asyncHandler';
import { Router } from 'express';
import { login } from './useCases/login';
import { prismaAuthRepository } from './model/prismaAuthRepository';
import { register } from './useCases/register';
import { logout } from './useCases/logout';
import { refreshToken } from './useCases/refreshToken';

const router = Router();

const loginHandler = asyncHandler(login(prismaAuthRepository));
const registerHandler = asyncHandler(register(prismaAuthRepository));
const logoutHandler = asyncHandler(logout(prismaAuthRepository));
const refreshTokenHandler = asyncHandler(refreshToken(prismaAuthRepository));

router.post('/login', loginHandler);
router.post('/register', registerHandler);
router.post('/logout', logoutHandler);
router.post('/refresh', refreshTokenHandler);

export default router;
