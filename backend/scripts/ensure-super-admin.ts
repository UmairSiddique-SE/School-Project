import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD before running this script.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: 'Super Administrator',
        passwordHash,
        role: 'SUPER_ADMIN',
        schoolId: null,
        isActive: true,
        emailVerified: true,
      },
    });
    console.log(`Super Admin updated: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        name: 'Super Administrator',
        email,
        passwordHash,
        role: 'SUPER_ADMIN',
        schoolId: null,
        isActive: true,
        emailVerified: true,
      },
    });
    console.log(`Super Admin created: ${email}`);
  }
}

main()
  .catch((error) => {
    console.error('Failed to ensure Super Admin:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
