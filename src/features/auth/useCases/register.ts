import { Request, Response } from 'express';
import { AuthRepository } from '../model/AuthRepository';

import { generateAccessToken, generateRefreshToken } from '../service/jwt';
import { mapUserToDto } from '@shared/types/user';
import { hashPassword } from '@shared/service/hash';

export const register = (authRepo: AuthRepository) => {
  return async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await authRepo.findUserByUsername(username);

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await authRepo.createUser(username, hashedPassword);

    const accessToken = generateAccessToken({ id: user.id, username: user.username });
    const refreshToken = generateRefreshToken({ id: user.id, username: user.username });

    await authRepo.saveRefreshToken(user.id, refreshToken, {
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    return res.status(201).json({
      user: mapUserToDto(user),
      accessToken,
      refreshToken,
    });
  };
};
