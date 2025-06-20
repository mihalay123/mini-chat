import { User } from '@shared/types/user';

export interface AuthRepository {
  findUserByUsername(username: string): Promise<User | null>;
  saveUser(username: string, hashedPassword: string): Promise<void>;
  saveRefreshToken(userId: string, token: string, meta: { ip: string; userAgent: string }): Promise<void>;
}
