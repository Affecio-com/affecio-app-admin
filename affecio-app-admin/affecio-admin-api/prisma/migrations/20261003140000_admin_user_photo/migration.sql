-- AlterTable (idempotent: this DB is shared and migrated via db execute / db push, not migrate deploy)
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "photoKey" TEXT;
