const url = process.env.DATABASE_URL || '';
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !/^postgres(?:ql)?:\/\//i.test(url)) {
  console.error('Production database validation failed: DATABASE_URL must use PostgreSQL.');
  process.exit(1);
}

if (!url) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

console.log(`Database configuration valid for ${isProduction ? 'production' : 'development'} environment.`);
