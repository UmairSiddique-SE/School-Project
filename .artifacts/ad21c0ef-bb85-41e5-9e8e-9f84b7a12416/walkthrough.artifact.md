# Fix Migration Syntax Warnings Walkthrough

I have updated the migration file to resolve syntax warnings triggered by the IDE's SQL validator.

## Changes Made

### [Backend] Migration Update [migration.sql](file:///D:/schol system/backend/prisma/migrations/20260710163617_add_school_request/migration.sql)

- Replaced all instances of `ON DELETE RESTRICT` with `ON DELETE NO ACTION`.
- This change satisfies the **Microsoft SQL Server (MSSQL)** validator used by your IDE, as `RESTRICT` is not a recognized keyword in that dialect for foreign key actions.
- `NO ACTION` behaves identically to `RESTRICT` in PostgreSQL and SQLite, ensuring that the database logic remains unchanged.

## Verification

- The red syntax error squiggles for `RESTRICT` should now be gone from the file.
- Database integrity is maintained as deletions will still be prevented if child records exist.
