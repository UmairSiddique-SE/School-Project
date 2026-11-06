const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
env.split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const students = await prisma.student.findMany({
    select: { id: true, name: true, deletedAt: true, schoolId: true }
  });
  console.log('Students:', students.length, 'Non-deleted:', students.filter(x => !x.deletedAt).length, students);

  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true, deletedAt: true, schoolId: true }
  });
  console.log('Teachers:', teachers.length, 'Non-deleted:', teachers.filter(x => !x.deletedAt).length, teachers);

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, deletedAt: true, schoolId: true }
  });
  console.log('Users:', users.length, 'Non-deleted:', users.filter(x => !x.deletedAt).length, users);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
