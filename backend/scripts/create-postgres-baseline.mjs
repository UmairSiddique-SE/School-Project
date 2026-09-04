import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schema = resolve(root, 'prisma', 'schema.prisma');
const migrationsDir = resolve(root, 'prisma', 'migrations');
const migrationName = process.env.MIGRATION_NAME || '20260904120000_postgresql_baseline';
const outputDir = resolve(migrationsDir, migrationName);
const outputFile = resolve(outputDir, 'migration.sql');

if (!existsSync(schema)) {
  throw new Error(`Prisma schema not found: ${schema}`);
}

const schemaText = readFileSync(schema, 'utf8');
if (!/provider\s*=\s*"postgresql"/.test(schemaText)) {
  throw new Error('Refusing to create a PostgreSQL baseline: schema.prisma is not configured for PostgreSQL yet.');
}

if (existsSync(outputFile)) {
  throw new Error(`Baseline already exists: ${outputFile}`);
}

mkdirSync(outputDir, { recursive: true });

const prismaBin = resolve(root, 'node_modules', '.bin', process.platform === 'win32' ? 'prisma.cmd' : 'prisma');
if (!existsSync(prismaBin)) {
  throw new Error('Prisma CLI is not installed. Run npm ci/npm install in backend first.');
}

const sql = execFileSync(
  prismaBin,
  ['migrate', 'diff', '--from-empty', '--to-schema-datamodel', schema, '--script'],
  { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
);

writeFileSync(outputFile, sql, 'utf8');
console.log(`PostgreSQL baseline created: ${outputFile}`);
console.log('Validate it on an EMPTY PostgreSQL database before using prisma migrate deploy.');
