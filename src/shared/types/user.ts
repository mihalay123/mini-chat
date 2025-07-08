import { User as PrismaUser } from '@prisma/client';

export type UserDto = {
  id: string;
  username: string;
};

export type User = PrismaUser;

export const mapUserToDto = (user: PrismaUser): UserDto => {
  return {
    id: user.id,
    username: user.username,
  };
};
