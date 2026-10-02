-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP(3);
