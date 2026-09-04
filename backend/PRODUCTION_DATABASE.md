# EduSphere Production Database

## Target

Production must use a managed PostgreSQL database (for example Neon PostgreSQL). SQLite is suitable only for local development.

## Current repository state

`schema.prisma` is currently configured with the SQLite provider. The existing Prisma migration history was generated for SQLite, so changing the provider without creating a PostgreSQL baseline would make `prisma migrate deploy` unsafe.

## Production guard

Run this before a production deployment:

```bash
cd backend
NODE_ENV=production DATABASE_URL="$DATABASE_URL" npm run validate:production-db
```

The validator checks both the connection-string protocol and the Prisma datasource provider. It fails closed when production is configured with SQLite or a non-PostgreSQL URL.

## Required production cutover

1. Provision a PostgreSQL database.
2. Create a PostgreSQL migration baseline from the current Prisma schema.
3. Validate the baseline on an empty PostgreSQL database.
4. Run `prisma migrate deploy` against a staging PostgreSQL database.
5. Run the backend build and test suite against staging.
6. Configure `DATABASE_URL` with the managed PostgreSQL connection string.
7. Run the production database validator.
8. Run the production deployment only after staging migration succeeds.

## Safety rules

- Never run `prisma migrate reset` against production.
- Never use `prisma db push` as the production schema deployment mechanism.
- Keep `DATABASE_URL` and all credentials out of Git.
- Take a database backup before any production migration.
- Verify tenant isolation and subscription/payment data after migration.
- Do not claim PostgreSQL production readiness while `schema.prisma` still uses the SQLite provider.

## CI verification checkpoint

Every production-readiness code change must pass the repository CI build before the next implementation step is marked complete.

## Environment

Use `backend/.env.example` as the template. Production `DATABASE_URL` must be a PostgreSQL connection string and should normally include `schema=public`.
