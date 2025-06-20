import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

export const verifyToken = <T = any>(token: string): T => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'object' && decoded !== null) {
      return decoded as T;
    }
    throw new Error('Invalid token');
  } catch (error) {
    console.warn(`Token verification failed: ${(error as Error).message}`);
    return null as T;
  }
};
