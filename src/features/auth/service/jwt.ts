import { ENV } from '@shared/config/env';
import jwt from 'jsonwebtoken';

const JWT_SECRET = ENV.JWT_SECRET;

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
