import cron from "node-cron";
import prisma from "../utils/prisma";

/** 이번 달 year, month 반환 (month 1~12) */
function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** 해당 연·월 예산 레코드 없으면 생성 */
export async function ensureMonthlyBudget(year: number, month: number) {
  return prisma.monthlyBudget.upsert({
    where: { year_month: { year, month } },
    create: { year, month, budget_amount: 0, spent_amount: 0 },
    update: {},
  });
}

/**
 * 매월 1일 00:00에 해당 월 예산 레코드 생성 (매달 시작 예산)
 * cron: "0 0 1 * *" = 매월 1일 00:00
 */
export function startBudgetCron() {
  cron.schedule("0 0 1 * *", async () => {
    try {
      const { year, month } = getCurrentYearMonth();
      await ensureMonthlyBudget(year, month);
      console.log(`[cron] ${year}년 ${month}월 예산 레코드 확인/생성 완료`);
    } catch (e) {
      console.error("[cron] 월별 예산 생성 실패:", e);
    }
  });
  console.log("[cron] 매월 1일 00:00 예산 초기화 스케줄 등록됨");
}
