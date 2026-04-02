-- Align legacy "User" rows (e.g. avatar, missing Prisma fields) with prisma/schema.prisma.
-- Safe to re-run on DBs that already match init_auth (IF NOT EXISTS / guarded rename).

DO $m$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'avatar'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'image'
  ) THEN
    ALTER TABLE "User" RENAME COLUMN "avatar" TO "image";
  END IF;
END
$m$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT;
UPDATE "User" SET "role" = 'user' WHERE "role" IS NULL;
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user';
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMP(3);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "premiumEligible" BOOLEAN;
UPDATE "User" SET "premiumEligible" = false WHERE "premiumEligible" IS NULL;
ALTER TABLE "User" ALTER COLUMN "premiumEligible" SET DEFAULT false;
ALTER TABLE "User" ALTER COLUMN "premiumEligible" SET NOT NULL;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
UPDATE "User" SET "updatedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP) WHERE "updatedAt" IS NULL;
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "name" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
