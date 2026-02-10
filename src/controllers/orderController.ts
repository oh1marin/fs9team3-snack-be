import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

/** FE 대표 이미지: 주문 최상위 first_item_image / image / image_url */
function withOrderListImage(
  order: { order_items: Array<{ item?: { image?: string | null } | null }> },
) {
  const img = order.order_items[0]?.item?.image ?? "";
  return { ...order, first_item_image: img, image: img, image_url: img };
}

/** FE 품목 이미지: 각 항목 최상위 image / image_url, item 안에도 image 있음 */
function withOrderItemImage<T extends { item?: { image?: string | null } | null }>(row: T) {
  const img = row.item?.image ?? "";
  return { ...row, image: img, image_url: img };
}

/** GET /api/orders - 구매 요청 목록 (page, limit, sort=request_date:desc 등) */
export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 10));
    const sortParam = String(req.query.sort || "request_date:desc").toLowerCase();
    const skip = (page - 1) * limit;

    let orderBy: { request_date?: "asc" | "desc"; created_at?: "asc" | "desc" } = {
      request_date: "desc",
    };
    if (sortParam === "request_date:asc") orderBy = { request_date: "asc" };
    else if (sortParam === "request_date:desc") orderBy = { request_date: "desc" };
    else if (sortParam === "created_at:asc") orderBy = { created_at: "asc" };
    else if (sortParam === "created_at:desc") orderBy = { created_at: "desc" };

    const [ordersRaw, total] = await Promise.all([
      prisma.order.findMany({
        where: { user_id: userId },
        include: { order_items: { include: { item: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { user_id: userId } }),
    ]);

    const data = ordersRaw.map(withOrderListImage);
    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("주문 목록 조회 오류:", error);
    res.status(500).json({ message: "주문 목록 조회에 실패했습니다." });
  }
};

/** GET /api/orders/:id - 주문 상세 */
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const id = req.params.id?.trim();
    if (!id) {
      return res.status(400).json({ message: "주문 ID가 필요합니다." });
    }

    const orderRaw = await prisma.order.findFirst({
      where: { id, user_id: userId },
      include: { order_items: { include: { item: true } } },
    });
    if (!orderRaw) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }

    const order = {
      ...orderRaw,
      order_items: orderRaw.order_items.map(withOrderItemImage),
      items: orderRaw.order_items.map(withOrderItemImage),
    };
    res.json(order);
  } catch (error) {
    console.error("주문 상세 조회 오류:", error);
    res.status(500).json({ message: "주문 조회에 실패했습니다." });
  }
};

/** POST /api/orders - 주문 생성 (장바구니 기반 또는 body로 items 전달) */
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    // body에 items 없으면 현재 장바구니로 주문 생성
    const bodyItems = req.body?.items as Array<{ item_id: string; quantity?: number }> | undefined;
    let items: { item_id: string; quantity: number }[];

    if (Array.isArray(bodyItems) && bodyItems.length > 0) {
      items = bodyItems.map((row) => ({
        item_id: String(row.item_id),
        quantity: Math.max(1, parseInt(String(row.quantity), 10) || 1),
      }));
    } else {
      const carts = await prisma.cart.findMany({
        where: { user_id: userId },
        include: { item: true },
      });
      if (carts.length === 0) {
        return res.status(400).json({ message: "장바구니가 비어 있습니다." });
      }
      items = carts.map((c) => ({ item_id: c.item_id, quantity: c.quantity }));
    }

    const itemIds = items.map((i) => i.item_id);
    const itemMap = await prisma.item.findMany({ where: { id: { in: itemIds } } }).then((list) =>
      Object.fromEntries(list.map((it) => [it.id, it])),
    );

    let total_amount = 0;
    const orderItemsData: { item_id: string; quantity: number; total_price: number }[] = [];
    for (const row of items) {
      const item = itemMap[row.item_id];
      if (!item) {
        return res.status(400).json({ message: `상품을 찾을 수 없습니다: ${row.item_id}` });
      }
      const total_price = item.price * row.quantity;
      total_amount += total_price;
      orderItemsData.push({ item_id: row.item_id, quantity: row.quantity, total_price });
    }

    const order = await prisma.order.create({
      data: {
        user_id: userId,
        status: "pending",
        total_amount,
        order_items: {
          create: orderItemsData,
        },
      },
      include: { order_items: { include: { item: true } } },
    });

    res.status(201).json({
      message: "주문이 생성되었습니다.",
      data: order,
    });
  } catch (error) {
    console.error("주문 생성 오류:", error);
    res.status(500).json({ message: "주문 생성에 실패했습니다." });
  }
};

/** DELETE /api/orders/:id - 주문 취소 */
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const id = req.params.id?.trim();
    if (!id) {
      return res.status(400).json({ message: "주문 ID가 필요합니다." });
    }

    const order = await prisma.order.findFirst({
      where: { id, user_id: userId },
    });
    if (!order) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }
    if (order.status !== "pending") {
      return res.status(400).json({ message: "대기 중인 주문만 취소할 수 있습니다." });
    }

    await prisma.order.update({
      where: { id },
      data: { status: "cancelled" },
    });

    res.json({ success: true, message: "주문이 취소되었습니다." });
  } catch (error) {
    console.error("주문 취소 오류:", error);
    res.status(500).json({ message: "주문 취소에 실패했습니다." });
  }
};
