const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      schoolId: true,
      school: {
        select: {
          name: true,
          slug: true,
          isActive: true,
        },
      },
    },
  });
  console.log('--- ALL USERS ---');
  console.log(JSON.stringify(users, null, 2));

  const students = await prisma.student.findMany({
    select: {
      id: true,
      name: true,
      admissionNo: true,
      rollNo: true,
      email: true,
      phone: true,
      bFormNumber: true,
      school: { select: { slug: true } }
    }
  });
  console.log('--- ALL STUDENTS ---');
  console.log(JSON.stringify(students, null, 2));
}

main().finally(() => prisma.$disconnect());
