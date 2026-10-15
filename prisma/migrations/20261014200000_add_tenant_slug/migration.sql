-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "slug" TEXT;

-- Backfill tenants created before slugs existed
UPDATE "tenants" SET "slug" = 'tenant-' || substr("id", 1, 8) WHERE "slug" IS NULL;

ALTER TABLE "tenants" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
