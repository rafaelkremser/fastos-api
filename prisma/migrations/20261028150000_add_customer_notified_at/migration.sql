-- When the store last told the customer about the order's current status.
-- Changing the status clears it, so a new notice is due
ALTER TABLE "service_orders" ADD COLUMN "customer_notified_at" TIMESTAMP(3);
