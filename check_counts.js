require('dotenv').config({ path: './backend/.env' });
const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({
    select: { id: true, name: true, deletedAt: true, schoolId: true }
  });
  console.log('Students count in DB:', students.length);
  console.log('Non-deleted students:', students.filter(s => !s.deletedAt).length);
  console.log('Deleted students:', students.filter(s => s.deletedAt).length);

  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true, deletedAt: true, schoolId: true }
  });
  console.log('Teachers count in DB:', teachers.length);
  console.log('Non-deleted teachers:', teachers.filter(t => !t.deletedAt).length);
  console.log('Deleted teachers:', teachers.filter(t => t.deletedAt).length);
  
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, deletedAt: true, schoolId: true }
  });
  console.log('Users count in DB:', users.length);
  console.log('Non-deleted users:', users.filter(u => !u.deletedAt).length);
  console.log('Deleted users:', users.filter(u => u.deletedAt).length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
