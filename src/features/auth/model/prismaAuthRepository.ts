import { prisma } from '@shared/prisma';
import { AuthRepository } from './AuthRepository';
import { User } from '@shared/types/user';

export const prismaAuthRepository: AuthRepository = {
  async findUserByUsername(username) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return null;
    }

    const userEntity: User = {
      id: user.id,
      username: user.username,
      password: user.password,
    };
    return userEntity;
  },

  async createUser(username, hashedPassword) {
    return await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
  },

  async saveRefreshToken(userId, token, meta) {
    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent: meta.userAgent,
        ip: meta.ip,
      },
    });
  },

  async revokeRefreshToken(token) {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  },
};
