import cron from "node-cron";
import type { PrismaClient } from "@prisma/client";
import prisma from "../utils/prisma";

const SHIPPING_FEE = Number(process.env.SHIPPING_FEE) || 3000;

/** 이번 달 year, month 반환 (month 1~12) */
export function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** 배송비 (환경변수 SHIPPING_FEE, 기본 3000) */
export function getShippingFee() {
  return SHIPPING_FEE;
}

/** 시작 예산(initial_budget) 싱글톤 조회. 없으면 기본 300만원으로 생성 */
export async function getOrCreateInitialBudget(client?: PrismaClient) {
  const db = client ?? prisma;
  let row = await db.initialBudget.findFirst();
  if (!row) {
    row = await db.initialBudget.create({
      data: { amount: 3000000 },
    });
  }
  return row;
}

/** 해당 연·월 예산 레코드 없으면 생성 (새 월은 initial_budget.amount로 budget_amount 시작) */
export async function ensureMonthlyBudget(
  year: number,
  month: number,
  db?: PrismaClient
) {
  const client = db ?? prisma;
  const initial = await getOrCreateInitialBudget(client);
  return client.monthlyBudget.upsert({
    where: { year_month: { year, month } },
    create: { year, month, budget_amount: initial.amount, spent_amount: 0 },
    update: {},
  });
}

/** 주문 승인 시 예산 사용액 증가 (상품금액 + 배송비). tx 있으면 트랜잭션 내에서 실행 */
export async function addSpentToBudget(
  orderTotal: number,
  tx?: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
) {
  const client = (tx ?? prisma) as PrismaClient;
  const { year, month } = getCurrentYearMonth();
  const budget = await ensureMonthlyBudget(year, month, client);
  const amount = orderTotal + SHIPPING_FEE;
  return client.monthlyBudget.update({
    where: { id: budget.id },
    data: { spent_amount: { increment: amount } },
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
