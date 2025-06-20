import { User } from '@shared/types/user';

export interface AuthRepository {
  findUserByUsername(username: string): Promise<User | null>;
  createUser(username: string, hashedPassword: string): Promise<User>;
  saveRefreshToken(userId: string, token: string, meta: { ip: string; userAgent: string }): Promise<void>;
  revokeRefreshToken(token: string): Promise<void>;
}
