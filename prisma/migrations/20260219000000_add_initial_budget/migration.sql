-- CreateTable
CREATE TABLE "initial_budgets" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "initial_budgets_pkey" PRIMARY KEY ("id")
);

-- 기본 시작 예산 300만원 (싱글톤)
INSERT INTO "initial_budgets" ("id", "amount", "created_at", "updated_at")
VALUES (gen_random_uuid()::text, 3000000, NOW(), NOW());
