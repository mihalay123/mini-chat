import { Request, Response } from 'express';
import { AuthRepository } from '../model/AuthRepository';
import { verifyToken } from '@shared/service/jwt';

export const logout = (authRepo: AuthRepository) => {
  return async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const payload = verifyToken<{ id: string }>(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    await authRepo.revokeRefreshToken(refreshToken);

    return res.status(200).json({ message: 'Logged out successfully' });
  };
};
