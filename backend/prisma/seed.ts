import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME || 'Platform Administrator';

  if (!email || !password) throw new Error('BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required for seeding.');
  if (password.length < 12) throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.');

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: 'SUPER_ADMIN', isActive: true, emailVerified: true, schoolId: null },
    create: { name, email, passwordHash, role: 'SUPER_ADMIN', isActive: true, emailVerified: true },
  });

  console.log(`Bootstrap super admin ready: ${admin.email}`);
  console.log('No demo school, students, teachers, parents, or fake finance records are seeded.');
}

main().catch(error => { console.error(error); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
