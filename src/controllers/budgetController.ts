import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { ensureMonthlyBudget } from "../cron/budgetCron";
import { BadRequestError } from "../utils/customError";

function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * GET /api/super-admin/budget/current
 * 이번 달 예산 조회 (없으면 생성 후 반환)
 */
export const getCurrentBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year, month } = getCurrentYearMonth();
    const budget = await ensureMonthlyBudget(year, month);

    res.status(200).json({
      success: true,
      budget: {
        id: budget.id,
        year: budget.year,
        month: budget.month,
        budget_amount: budget.budget_amount,
        spent_amount: budget.spent_amount,
        remaining: budget.budget_amount - budget.spent_amount,
        created_at: budget.created_at,
        updated_at: budget.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/super-admin/budget/current
 * 이번 달 예산 설정 또는 사용액 수정
 * body: { budget_amount?: number, spent_amount?: number } (선택)
 */
export const patchCurrentBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { budget_amount, spent_amount } = req.body;
    const { year, month } = getCurrentYearMonth();

    const updateData: { budget_amount?: number; spent_amount?: number } = {};
    if (budget_amount !== undefined) {
      const n = Number(budget_amount);
      if (!Number.isInteger(n) || n < 0) {
        throw new BadRequestError("budget_amount는 0 이상의 정수여야 합니다.");
      }
      updateData.budget_amount = n;
    }
    if (spent_amount !== undefined) {
      const n = Number(spent_amount);
      if (!Number.isInteger(n) || n < 0) {
        throw new BadRequestError("spent_amount는 0 이상의 정수여야 합니다.");
      }
      updateData.spent_amount = n;
    }
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError("수정할 값(budget_amount 또는 spent_amount)을 보내주세요.");
    }

    const budget = await ensureMonthlyBudget(year, month);
    const updated = await prisma.monthlyBudget.update({
      where: { id: budget.id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "예산이 수정되었습니다.",
      budget: {
        id: updated.id,
        year: updated.year,
        month: updated.month,
        budget_amount: updated.budget_amount,
        spent_amount: updated.spent_amount,
        remaining: updated.budget_amount - updated.spent_amount,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};
