import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/shared/service/hash'; // Импортируем функцию хеширования пароля

const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      {
        username: 'admin',
        password: await hashPassword('admin-password'),
      },
      {
        username: 'user',
        password: await hashPassword('user-password'),
      },
    ],
    skipDuplicates: true, // пропустит, если пользователь уже существует
  });
}

main()
  .then(() => {
    console.log('✅ Seed completed');
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error('❌ Seed error:', e);
    return prisma.$disconnect();
  });
