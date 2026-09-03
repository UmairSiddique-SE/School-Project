import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database seed is disabled in production.');
  }

  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD before running the seed.');
  }

  if (password.length < 12) {
    throw new Error('SUPER_ADMIN_PASSWORD must be at least 12 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const superAdmin = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Super Administrator',
      passwordHash,
      role: 'SUPER_ADMIN',
      schoolId: null,
      isActive: true,
      emailVerified: true,
    },
    create: {
      name: 'Super Administrator',
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log(`Super Admin ready: ${superAdmin.email}`);
  console.log('No demo school, student, teacher, parent, payment, or other fake records were created.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
