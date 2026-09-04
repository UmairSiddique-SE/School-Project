const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  try {
    const name = await ask('Name: ');
    const email = (await ask('Email/Login ID: ')).trim().toLowerCase();
    const password = await ask('Password: ');

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('This email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
        emailVerified: true,
        schoolId: null,
        mustChangePassword: false,
      },
    });

    console.log('\n================================');
    console.log('SUCCESS: Super Admin created');
    console.log('Login:', user.email);
    console.log('Role:', user.role);
    console.log('================================');
  } catch (error) {
    console.error('\nERROR:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();