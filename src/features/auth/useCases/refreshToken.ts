import { Request, Response } from 'express';
import { AuthRepository } from '../model/AuthRepository';
import { verifyToken } from '@shared/service/jwt';
import { generateAccessToken } from '../service/jwt';

export const refreshToken = (authRepo: AuthRepository) => {
  return async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    const payload = verifyToken<{ id: string; username: string }>(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokenRecord = await authRepo.findRefreshToken(refreshToken);
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Refresh token not found or expired' });
    }

    const accessToken = generateAccessToken({
      id: payload.id,
      username: payload.username,
    });

    res.status(200).json({ accessToken });
  };
};
