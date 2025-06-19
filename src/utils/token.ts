import { Request } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

export const generateAccessToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h',
  });
};

export const generateRefreshToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const saveRefreshToken = (
  db: any,
  token: string,
  userId: string,
  req: Request
) => {
  return db.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip,
    },
  });
};
