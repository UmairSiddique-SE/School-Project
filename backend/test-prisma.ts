import { PrismaClient } from '@prisma/client';

console.log('Testing PrismaClient datasources options...');
try {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./dev.db'
      }
    }
  });
  console.log('PrismaClient constructed successfully with datasources!');
} catch (err: any) {
  console.error('Failed constructor:', err.message);
}
