import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const url = process.env.DATABASE_URL || '';
const isProduction = process.env.NODE_ENV === 'production';
const schemaPath = resolve(process.cwd(), 'prisma/schema.prisma');
const schema = readFileSync(schemaPath, 'utf8');
const provider = schema.match(/datasource\s+db\s*\{[\s\S]*?provider\s*=\s*"([^"]+)"/)?.[1] || '';

if (!url) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

if (isProduction) {
  if (!/^postgres(?:ql)?:\/\//i.test(url)) {
    console.error('Production database validation failed: DATABASE_URL must use PostgreSQL.');
    process.exit(1);
  }

  if (provider !== 'postgresql') {
    console.error(`Production database validation failed: Prisma datasource provider is "${provider || 'unknown'}"; it must be "postgresql" before production deployment.`);
    process.exit(1);
  }
}

console.log(`Database configuration valid for ${isProduction ? 'production' : 'development'} environment (Prisma provider: ${provider || 'unknown'}).`);
