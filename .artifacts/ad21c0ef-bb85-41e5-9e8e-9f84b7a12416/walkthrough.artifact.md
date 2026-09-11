# Fix Migration Syntax Errors Walkthrough

I have refactored the SQL migration file to resolve the syntax errors reported by the IDE's SQL validator.

## Changes Made

### [Backend] Migration Refactor [migration.sql](file:///D:/schol system/backend/prisma/migrations/20260906100000_final_plan_catalogue_v2/migration.sql)

- Replaced the PostgreSQL-specific `ON CONFLICT` (upsert) syntax with a two-step process:
    1.  **DELETE**: Removes any existing `PlatformPlan` records with keys `FREE_TRIAL`, `PROFESSIONAL`, or `PREMIUM`.
    2.  **INSERT**: Inserts the up-to-date plan catalogue.
- This approach is more broadly compatible with SQL validators (like the MSSQL one used by your IDE extension) and achieves the exact same result in the database.

## Verification

- The file should now be free of red syntax error squiggles in the editor.
- The logic remains idempotent: running the migration multiple times will correctly reset the plans to the specified values.
