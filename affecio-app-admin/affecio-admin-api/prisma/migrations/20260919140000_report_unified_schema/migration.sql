-- Align shared Report table with mobile schema + admin moderation fields (no DROP).

DO $$ BEGIN
  CREATE TYPE "ReportContext" AS ENUM ('VIDEO_CALL', 'PROFILE', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportStatus" AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportType" AS ENUM ('user', 'media', 'message', 'profile');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "status" "ReportStatus" NOT NULL DEFAULT 'open';
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "type" "ReportType";
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Report"
SET "type" = CASE
  WHEN "context" = 'PROFILE'::"ReportContext" THEN 'profile'::"ReportType"
  WHEN "context" = 'VIDEO_CALL'::"ReportContext" THEN 'user'::"ReportType"
  ELSE 'user'::"ReportType"
END
WHERE "type" IS NULL;

ALTER TABLE "Report" ALTER COLUMN "type" SET DEFAULT 'user'::"ReportType";
ALTER TABLE "Report" ALTER COLUMN "type" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Report_status_idx" ON "Report"("status");
CREATE INDEX IF NOT EXISTS "Report_type_idx" ON "Report"("type");
