-- Items are read by their order (loading an order, the metrics), and
-- Postgres does not index a foreign key by itself
CREATE INDEX "service_order_items_service_order_id_idx" ON "service_order_items"("service_order_id");
