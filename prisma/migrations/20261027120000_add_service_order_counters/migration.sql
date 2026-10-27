-- CreateTable
CREATE TABLE "service_order_counters" (
    "tenant_id" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL,

    CONSTRAINT "service_order_counters_pkey" PRIMARY KEY ("tenant_id")
);

-- Start each tenant's counter at its highest existing number
INSERT INTO "service_order_counters" ("tenant_id", "last_number")
SELECT "tenant_id", MAX("number") FROM "service_orders" GROUP BY "tenant_id";

-- AddForeignKey
ALTER TABLE "service_order_counters" ADD CONSTRAINT "service_order_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
