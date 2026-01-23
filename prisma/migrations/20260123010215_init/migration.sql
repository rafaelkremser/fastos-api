/*
  Warnings:

  - You are about to drop the column `category_id` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `address_number` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `complement` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `neighborhood` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `zip_code` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the `device_categories` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "device_categories" DROP CONSTRAINT "device_categories_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "devices" DROP CONSTRAINT "devices_category_id_fkey";

-- DropIndex
DROP INDEX "service_orders_tenant_id_entry_date_idx";

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "devices" DROP COLUMN "category_id",
ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "service_orders" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "address",
DROP COLUMN "address_number",
DROP COLUMN "city",
DROP COLUMN "complement",
DROP COLUMN "neighborhood",
DROP COLUMN "plan",
DROP COLUMN "state",
DROP COLUMN "zip_code",
ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP NOT NULL;

-- DropTable
DROP TABLE "device_categories";

-- DropEnum
DROP TYPE "Plan";

-- CreateIndex
CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");
