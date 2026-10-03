-- Idempotent schema sync for admin-only tables.
-- Runs on every `npm start` (see package.json "prestart") via `prisma db execute`.
-- This DB is shared with the main Affecio API, so we never use `prisma migrate deploy`
-- or `migrate reset` here. Only touch admin-owned tables, and only with IF NOT EXISTS.

ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP(3);
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "photoKey" TEXT;
