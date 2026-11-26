# SchoolOS Production Database

## Target

Production must use a managed PostgreSQL database (for example Neon PostgreSQL). SQLite is suitable only for local development.

## Current repository state

`schema.prisma` uses the PostgreSQL provider, and `prisma/migrations` contains the PostgreSQL migration history, including the pending school registration table and its later schema updates. Deploy all migrations before routing registration traffic to the new application version.

## Production guard

Run this before a production deployment:

```bash
cd backend
NODE_ENV=production DATABASE_URL="$DATABASE_URL" npm run validate:production-db
```

The validator checks both the connection-string protocol and the Prisma datasource provider. It fails closed when production is configured with SQLite or a non-PostgreSQL URL.

## Production deployment

1. Provision a managed PostgreSQL database and back it up before schema changes.
2. Set `DATABASE_URL` and `NODE_ENV=production` in the deployment environment.
3. Run `npm run validate:production-db`.
4. Run `npm run db:deploy` once as a release step, before routing traffic to the new backend.
5. Run backend build and tests against staging, then deploy the backend and frontend.

The Docker image applies migrations before starting the API. For Vercel, Railway, Render, or other deployments that do not use the Docker image, configure a one-off release/pre-deploy command to run `npm run db:deploy`; do not rely on the application build to migrate production data.

## Safety rules

- Never run `prisma migrate reset` against production.
- Never use `prisma db push` as the production schema deployment mechanism.
- Keep `DATABASE_URL` and all credentials out of Git.
- Take a database backup before any production migration.
- Verify tenant isolation and subscription/payment data after migration.
- Do not route traffic to a release until its migrations complete successfully.

## CI verification checkpoint

Every production-readiness code change must pass the repository CI build before the next implementation step is marked complete.

## Environment

Use `backend/.env.example` as the template. Production `DATABASE_URL` must be a PostgreSQL connection string and should normally include `schema=public`.
