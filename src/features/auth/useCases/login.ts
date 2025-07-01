import { Request, Response } from 'express';
import { AuthRepository } from '../model/AuthRepository';
import { comparePassword } from '../service/hash';
import { generateAccessToken, generateRefreshToken } from '../service/jwt';
import { mapUserToDto } from '@shared/types/user';

export const login = (authRepo: AuthRepository) => {
  return async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = await authRepo.findUserByUsername(username);
    const isValidPassword = await comparePassword(password, user?.password || '');
    if (!user || !isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken({ id: user.id, username: user.username });
    const refreshToken = generateRefreshToken({ id: user.id, username: user.username });

    await authRepo.saveRefreshToken(user.id, refreshToken, {
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    return res.status(200).json({
      user: mapUserToDto(user),
      accessToken,
      refreshToken,
    });
  };
};
