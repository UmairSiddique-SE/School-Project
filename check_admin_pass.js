const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const bcrypt = require('./backend/node_modules/bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: 'hacka6310@gmail.com' }
  });
  console.log('Admin user:', admin?.email, 'passwordHash:', admin?.passwordHash?.slice(0, 15));
  
  // Let's check common words from conversation or school name
  const list = [
    'umair1234', 'umair786', 'umairsiddique', 'Umair123', 'Umair786',
    'admin', 'Admin', 'admin1234', 'Admin1234', 'password123', 'Password123',
    '12345678', '123456789', 'hacka6310@gmail.com', 'hacka6310',
    'umair-model-school', 'umairmodelschool', '11223344', '00000000',
    'P@ssword1', 'P@ssw0rd', 'school123', 'School123'
  ];
  for (const p of list) {
    if (await bcrypt.compare(p, admin.passwordHash)) {
      console.log('>>> FOUND MATCH FOR ADMIN:', p);
      return;
    }
  }
  console.log('No match found in quick list.');
}

main().finally(() => prisma.$disconnect());
