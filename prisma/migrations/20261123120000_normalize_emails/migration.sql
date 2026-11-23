-- E-mails are compared without case from now on (A10). Accounts whose
-- e-mails differ only in case would collide, so the migration stops and names
-- them (by id) instead of picking one
DO $$
DECLARE
  repeated text;
BEGIN
  SELECT string_agg(account, ', ') INTO repeated
  FROM (
    SELECT 'user ' || u."id" AS account
    FROM "users" u
    WHERE EXISTS (
      SELECT 1 FROM "users" o
      WHERE o."id" <> u."id"
        AND o."tenant_id" = u."tenant_id"
        AND lower(btrim(o."email")) = lower(btrim(u."email"))
    )
    UNION ALL
    SELECT 'tenant ' || t."id"
    FROM "tenants" t
    WHERE EXISTS (
      SELECT 1 FROM "tenants" o
      WHERE o."id" <> t."id"
        AND lower(btrim(o."email")) = lower(btrim(t."email"))
    )
  ) AS accounts;

  IF repeated IS NOT NULL THEN
    RAISE EXCEPTION 'Accounts whose e-mails differ only in case: %', repeated;
  END IF;
END $$;

UPDATE "users" SET "email" = lower(btrim("email"))
WHERE "email" <> lower(btrim("email"));

UPDATE "tenants" SET "email" = lower(btrim("email"))
WHERE "email" <> lower(btrim("email"));

-- A write that skips normalizeEmail fails here, instead of quietly creating a
-- second account for the same person
ALTER TABLE "users" ADD CONSTRAINT "users_email_normalized"
  CHECK ("email" = lower(btrim("email")));

ALTER TABLE "tenants" ADD CONSTRAINT "tenants_email_normalized"
  CHECK ("email" = lower(btrim("email")));
