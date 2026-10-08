const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const bcrypt = require('./backend/node_modules/bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: 'hacka6310@gmail.com' }
  });
  console.log('Admin found:', admin?.name, admin?.email, admin?.role);
  
  // Test common passwords
  const candidates = ['Admin@123', 'admin123', '12345678', '123456', 'umair123', 'Umair@123', 'hacka6310', 'password'];
  for (const c of candidates) {
    if (admin) {
      const match = await bcrypt.compare(c, admin.passwordHash);
      if (match) {
        console.log(`>>> MATCH FOR ADMIN hacka6310@gmail.com: "${c}"`);
      }
    }
  }

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { name: true, email: true, passwordHash: true }
  });
  for (const s of students) {
    console.log(`Student user: ${s.name} (${s.email})`);
    for (const c of ['12345678', 'Student@123', 'student123', '123456', 'password', 'umair123', 'hannan123']) {
      const match = await bcrypt.compare(c, s.passwordHash);
      if (match) {
        console.log(`>>> MATCH FOR STUDENT ${s.email}: "${c}"`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
