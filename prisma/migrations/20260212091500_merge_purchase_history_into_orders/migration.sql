-- purchase_history 제거 및 orders 컬럼으로 이관
ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "canceled_at" TIMESTAMP(3);

-- 기존 purchase_history의 승인 시각을 orders.approved_at으로 백필
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'purchase_history'
  ) THEN
    UPDATE "orders" o
    SET "approved_at" = ph."approved_at"
    FROM "purchase_history" ph
    WHERE ph."order_id" = o."id"
      AND o."approved_at" IS NULL;
  END IF;
END $$;

-- 과거 취소건에 취소 시각이 비어 있으면 updated_at으로 보정
UPDATE "orders"
SET "canceled_at" = "updated_at"
WHERE "status" = 'cancelled'
  AND "canceled_at" IS NULL;

DROP TABLE IF EXISTS "purchase_history";
