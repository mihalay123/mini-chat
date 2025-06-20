import { Request, Response } from 'express';
import { AuthRepository } from '../model/AuthRepository';
import { comparePassword } from '../service/hash';
import { generateAccessToken, generateRefreshToken } from '../service/jwt';

export const login = (authRepo: AuthRepository) => {
  return async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

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
        user: { id: user.id, username: user.username },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};
