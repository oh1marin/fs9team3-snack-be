import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { ensureMonthlyBudget, getOrCreateInitialBudget } from "../cron/budgetCron";
import { BadRequestError } from "../utils/customError";

function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * GET /api/super-admin/budget/current
 * 이번 달 예산 + 시작 예산 조회 (없으면 생성 후 반환)
 */
export const getCurrentBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year, month } = getCurrentYearMonth();
    const [budget, initialBudget] = await Promise.all([
      ensureMonthlyBudget(year, month),
      getOrCreateInitialBudget(),
    ]);

    res.status(200).json({
      success: true,
      budget: {
        id: budget.id,
        year: budget.year,
        month: budget.month,
        budget_amount: budget.budget_amount,
        spent_amount: budget.spent_amount,
        remaining: Math.max(0, budget.budget_amount - budget.spent_amount),
        created_at: budget.created_at,
        updated_at: budget.updated_at,
      },
      initial_budget: {
        id: initialBudget.id,
        amount: initialBudget.amount,
        updated_at: initialBudget.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/super-admin/budget/current
 * 월 예산(budget_amount) 또는 시작 예산(initial_budget) 수정
 * body: { budget_amount?: number, spent_amount?: number, initial_budget?: number }
 */
export const patchCurrentBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { budget_amount, spent_amount, initial_budget } = req.body;
    const { year, month } = getCurrentYearMonth();

    const monthlyUpdate: { budget_amount?: number; spent_amount?: number } = {};
    if (budget_amount !== undefined) {
      const n = Number(budget_amount);
      if (!Number.isInteger(n) || n < 0) {
        throw new BadRequestError("budget_amount는 0 이상의 정수여야 합니다.");
      }
      monthlyUpdate.budget_amount = n;
    }
    if (spent_amount !== undefined) {
      const n = Number(spent_amount);
      if (!Number.isInteger(n) || n < 0) {
        throw new BadRequestError("spent_amount는 0 이상의 정수여야 합니다.");
      }
      monthlyUpdate.spent_amount = n;
    }

    let updatedBudget = await ensureMonthlyBudget(year, month);
    let updatedInitial = await getOrCreateInitialBudget();

    if (Object.keys(monthlyUpdate).length > 0) {
      updatedBudget = await prisma.monthlyBudget.update({
        where: { id: updatedBudget.id },
        data: monthlyUpdate,
      });
    }

    if (initial_budget !== undefined) {
      const n = Number(initial_budget);
      if (!Number.isInteger(n) || n < 0) {
        throw new BadRequestError("initial_budget는 0 이상의 정수여야 합니다.");
      }
      updatedInitial = await prisma.initialBudget.update({
        where: { id: updatedInitial.id },
        data: { amount: n },
      });
    }

    if (Object.keys(monthlyUpdate).length === 0 && initial_budget === undefined) {
      throw new BadRequestError("수정할 값(budget_amount, spent_amount, initial_budget 중 하나)을 보내주세요.");
    }

    res.status(200).json({
      success: true,
      message: "예산이 수정되었습니다.",
      budget: {
        id: updatedBudget.id,
        year: updatedBudget.year,
        month: updatedBudget.month,
        budget_amount: updatedBudget.budget_amount,
        spent_amount: updatedBudget.spent_amount,
        remaining: Math.max(0, updatedBudget.budget_amount - updatedBudget.spent_amount),
        created_at: updatedBudget.created_at,
        updated_at: updatedBudget.updated_at,
      },
      initial_budget: {
        id: updatedInitial.id,
        amount: updatedInitial.amount,
        updated_at: updatedInitial.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};
