import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";
import { ensureMonthlyBudget, getCurrentYearMonth, getShippingFee, getOrCreateInitialBudget } from "../cron/budgetCron";
import prismaDefault from "../utils/prisma";

const prisma = new PrismaClient();

/** FE 이미지 필드: 최상위 image / image_url, item 안에도 image 있음 */
function withCartImage<T extends { item?: { image?: string | null; price?: number } | null }>(row: T) {
  const img = row.item?.image ?? "";
  const unitPrice = row.item?.price ?? 0;
  return { ...row, image: img, image_url: img, price: unitPrice, unit_price: unitPrice };
}

/* GET /api/cart - 현재 사용자 장바구니 목록. 관리자/최고관리자는 예산 정보 포함 */
export const getCarts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const [carts, user] = await Promise.all([
      prisma.cart.findMany({
        where: { user_id: userId },
        include: { item: true },
        orderBy: { created_at: "desc" },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { is_admin: true, is_super_admin: true },
      }),
    ]);

    const items = carts.map(withCartImage);
    const total_amount = items.reduce((sum, it) => sum + ((it as { total_price?: number }).total_price ?? 0), 0);
    const shipping_fee = getShippingFee();

    let budget: { budget_amount: number; spent_amount: number; remaining: number; initial_budget: number } | null = null;
    if (user?.is_admin === "Y" || user?.is_super_admin === "Y") {
      const { year, month } = getCurrentYearMonth();
      const [b, initial] = await Promise.all([
        ensureMonthlyBudget(year, month, prismaDefault),
        getOrCreateInitialBudget(prismaDefault),
      ]);
      budget = {
        budget_amount: b.budget_amount,
        spent_amount: b.spent_amount,
        remaining: Math.max(0, b.budget_amount - b.spent_amount),
        initial_budget: initial.amount,
      };
    }

    res.json({
      data: items,
      items,
      total_amount,
      shipping_fee,
      ...(budget && { budget }),
    });
  } catch (error) {
    console.error("장바구니 조회 오류:", error);
    res.status(500).json({ message: "장바구니 조회에 실패했습니다." });
  }
};

/*POST /api/carts - 장바구니에 담기 */
export const createCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const { item_id, quantity = 1 } = req.body;
    if (!item_id || typeof item_id !== "string") {
      return res.status(400).json({ message: "item_id가 필요합니다." });
    }
    const qty = Math.max(1, parseInt(String(quantity), 10) || 1);

    const item = await prisma.item.findUnique({ where: { id: item_id } });
    if (!item) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    const total_price = item.price * qty;

    await prisma.cart.upsert({
      where: {
        user_id_item_id: { user_id: userId!, item_id },
      },
      create: {
        user_id: userId!,
        item_id,
        quantity: qty,
        total_price,
      },
      update: {
        quantity: qty,
        total_price,
      },
      include: { item: true },
    });

    // FE CartContext가 res.items로 전체 개수 동기화하므로, 추가 후 전체 장바구니 반환
    const [carts, user] = await Promise.all([
      prisma.cart.findMany({
        where: { user_id: userId },
        include: { item: true },
        orderBy: { created_at: "desc" },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { is_admin: true, is_super_admin: true },
      }),
    ]);
    const items = carts.map(withCartImage);
    const total_amount = items.reduce((sum, it) => sum + ((it as { total_price?: number }).total_price ?? 0), 0);
    let budget: { budget_amount: number; spent_amount: number; remaining: number; initial_budget: number } | null = null;
    if (user?.is_admin === "Y" || user?.is_super_admin === "Y") {
      const { year, month } = getCurrentYearMonth();
      const [b, initial] = await Promise.all([
        ensureMonthlyBudget(year, month, prismaDefault),
        getOrCreateInitialBudget(prismaDefault),
      ]);
      budget = {
        budget_amount: b.budget_amount,
        spent_amount: b.spent_amount,
        remaining: Math.max(0, b.budget_amount - b.spent_amount),
        initial_budget: initial.amount,
      };
    }

    res.status(201).json({
      message: "장바구니에 담았습니다.",
      items,
      data: items,
      total_amount,
      shipping_fee: getShippingFee(),
      ...(budget && { budget }),
    });
  } catch (error) {
    console.error("장바구니 담기 오류:", error);
    res.status(500).json({ message: "장바구니 담기에 실패했습니다." });
  }
};

/* PATCH /api/cart/items/:id - 수량/금액 수정 */
export const updateCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const idParam = req.params.id;
    const cartId = (typeof idParam === "string" ? idParam : idParam?.[0] ?? "").trim();
    if (!cartId) {
      return res.status(400).json({ message: "항목 ID가 필요합니다." });
    }

    const existing = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { item: true },
    });
    if (!existing) {
      return res.status(404).json({ message: "장바구니 항목을 찾을 수 없습니다." });
    }
    if (existing.user_id !== userId) {
      return res.status(403).json({ message: "수정 권한이 없습니다." });
    }

    const { quantity } = req.body;
    const qty = quantity !== undefined ? Math.max(1, parseInt(String(quantity), 10) || 1) : existing.quantity;
    const total_price = existing.item.price * qty;

    const cart = await prisma.cart.update({
      where: { id: cartId },
      data: { quantity: qty, total_price },
      include: { item: true },
    });

    res.json({
      message: "장바구니가 수정되었습니다.",
      cart: withCartImage(cart),
    });
  } catch (error) {
    console.error("장바구니 수정 오류:", error);
    res.status(500).json({ message: "장바구니 수정에 실패했습니다." });
  }
};

/* DELETE /api/cart/items/:id - 1개 삭제 */
export const deleteCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const idParam = req.params.id;
    const cartId = (typeof idParam === "string" ? idParam : idParam?.[0] ?? "").trim();
    if (!cartId) {
      return res.status(400).json({ message: "항목 ID가 필요합니다." });
    }

    const existing = await prisma.cart.findUnique({
      where: { id: cartId },
    });
    if (!existing) {
      return res.status(404).json({ message: "장바구니 항목을 찾을 수 없습니다." });
    }
    if (existing.user_id !== userId) {
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }

    await prisma.cart.delete({ where: { id: cartId } });

    res.json({
      success: true,
      message: "장바구니에서 삭제되었습니다.",
    });
  } catch (error) {
    console.error("장바구니 삭제 오류:", error);
    res.status(500).json({ message: "장바구니 삭제에 실패했습니다." });
  }
};

/* DELETE /api/cart - 장바구니 비우기 */
export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    await prisma.cart.deleteMany({ where: { user_id: userId! } });

    res.json({
      success: true,
      message: "장바구니를 비웠습니다.",
    });
  } catch (error) {
    console.error("장바구니 비우기 오류:", error);
    res.status(500).json({ message: "장바구니 비우기에 실패했습니다." });
  }
};
