import jwt, { JwtPayload } from 'jsonwebtoken';

interface TokenPayload extends JwtPayload {
  id: string;
  username: string;
}

export const verifyToken = (token: string) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!);

  if (typeof decoded === 'object' && decoded != null && 'username' in decoded) {
    return decoded as TokenPayload;
  }

  throw new Error('Invalid token');
};
