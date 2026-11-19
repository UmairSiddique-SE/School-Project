-- Remove the previously seeded Super Admin credential from installations where
-- the password was never changed. Accounts that were rotated are left intact.
DELETE FROM "User"
WHERE "email" = 'superadmin@edusphere.com'
  AND "passwordHash" = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsCIafs9Y9JuMd3e8IvMhL4EEGDK';
