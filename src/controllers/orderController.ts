import { Response } from "express";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";
import { addSpentToBudget } from "../cron/budgetCron";

const prisma = new PrismaClient();

/** 주문 품목으로 대표 상품명(가나다 순 첫 상품 + 및 N개)과 총 수량 계산 - 목록/상세 공통 */
function getOrderSummary(
  orderItems: Array<{ quantity: number; item?: { title?: string } | null }>,
): { summary_title: string; total_quantity: number } {
  const totalQuantity = orderItems.reduce((sum, oi) => sum + oi.quantity, 0);
  const sorted = [...orderItems].sort((a, b) =>
    (a.item?.title ?? "").localeCompare(b.item?.title ?? "", "ko"),
  );
  const firstTitle = sorted[0]?.item?.title ?? "";
  const summaryTitle =
    sorted.length === 0
      ? ""
      : sorted.length === 1
        ? firstTitle
        : `${firstTitle} 및 ${sorted.length - 1}개`;
  return { summary_title: summaryTitle, total_quantity: totalQuantity };
}

/** FE 대표 이미지·상품명·총 수량: 주문 목록/여러 페이지에서 공통 사용 */
function withOrderListImage(order: {
  order_items: Array<{
    quantity: number;
    item?: {
      image?: string | null;
      title?: string;
      category_main?: string;
      category_sub?: string;
    } | null;
  }>;
}) {
  const withCategory = order.order_items.map((oi) => ({
    ...oi,
    category: oi.item?.category_sub ?? oi.item?.category_main ?? "",
    category_sub: oi.item?.category_sub ?? "",
    category_main: oi.item?.category_main ?? "",
  }));

  const { summary_title, total_quantity } = getOrderSummary(withCategory);
  const sorted = [...withCategory].sort((a, b) =>
    (a.item?.title ?? "").localeCompare(b.item?.title ?? "", "ko"),
  );
  const img = sorted[0]?.item?.image ?? order.order_items[0]?.item?.image ?? "";
  return {
    ...order,
    first_item_image: img,
    image: img,
    image_url: img,
    items: withCategory,
    order_items: withCategory,
    summary_title,
    total_quantity,
  };
}

/** FE 품목 이미지: 각 항목 최상위 image / image_url, item 안에도 image 있음 */
function withOrderItemImage<
  T extends { item?: { image?: string | null } | null },
>(row: T) {
  const img = row.item?.image ?? "";
  return { ...row, image: img, image_url: img };
}

/** 주문 취소/반려 시 해당 주문 품목을 유저 장바구니에 다시 넣기 (트랜잭션 내부에서 호출) */
async function restoreOrderItemsToCart(
  tx: { cart: typeof prisma.cart },
  userId: string,
  orderItems: Array<{
    item_id: string;
    quantity: number;
    item?: { price: number } | null;
  }>,
) {
  for (const oi of orderItems) {
    const price = oi.item?.price ?? 0;
    const existing = await tx.cart.findUnique({
      where: { user_id_item_id: { user_id: userId, item_id: oi.item_id } },
    });
    const newQty = (existing?.quantity ?? 0) + oi.quantity;
    await tx.cart.upsert({
      where: { user_id_item_id: { user_id: userId, item_id: oi.item_id } },
      create: {
        user_id: userId,
        item_id: oi.item_id,
        quantity: oi.quantity,
        total_price: price * oi.quantity,
      },
      update: { quantity: newQty, total_price: price * newQty },
    });
  }
}

/** GET /api/orders - 구매 요청 목록 (page, limit, sort=request_date:desc 등) */
export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(String(req.query.limit), 10) || 10),
    );
    const sortParam = String(
      req.query.sort || "request_date:desc",
    ).toLowerCase();
    const skip = (page - 1) * limit;

    let orderBy:
      | { request_date?: "asc" | "desc"; created_at?: "asc" | "desc" }
      | { total_amount?: "asc" | "desc" } = {
      request_date: "desc",
    };
    if (sortParam === "request_date:asc") orderBy = { request_date: "asc" };
    else if (sortParam === "request_date:desc")
      orderBy = { request_date: "desc" };
    else if (sortParam === "created_at:asc") orderBy = { created_at: "asc" };
    else if (sortParam === "created_at:desc") orderBy = { created_at: "desc" };
    else if (sortParam === "order_amount:asc")
      orderBy = { total_amount: "asc" };
    else if (sortParam === "order_amount:desc")
      orderBy = { total_amount: "desc" };

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

/** GET /api/admin/orders - 관리자용 주문 목록. query.status: pending(기본, 구매요청관리) | approved(구매내역) | all. 응답에 is_instant_purchase 포함. */
export const getOrdersAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(String(req.query.limit), 10) || 10),
    );
    const sortParam = String(
      req.query.sort || "request_date:desc",
    ).toLowerCase();
    const statusParam = String(req.query.status || "pending").toLowerCase();
    const skip = (page - 1) * limit;

    let orderBy:
      | { request_date?: "asc" | "desc"; created_at?: "asc" | "desc" }
      | { total_amount?: "asc" | "desc" } = {
      request_date: "desc",
    };
    if (sortParam === "request_date:asc") orderBy = { request_date: "asc" };
    else if (sortParam === "request_date:desc")
      orderBy = { request_date: "desc" };
    else if (sortParam === "created_at:asc") orderBy = { created_at: "asc" };
    else if (sortParam === "created_at:desc") orderBy = { created_at: "desc" };
    else if (sortParam === "order_amount:asc")
      orderBy = { total_amount: "asc" };
    else if (sortParam === "order_amount:desc")
      orderBy = { total_amount: "desc" };

    const where =
      statusParam === "approved"
        ? { status: OrderStatus.approved }
        : statusParam === "all"
          ? {}
          : { status: OrderStatus.pending };

    const [ordersRaw, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          order_items: { include: { item: true } },
          user: { select: { email: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const data = ordersRaw.map((o) => {
      const user = o.user as { email?: string } | null;
      const requester = user?.email?.split("@")[0] ?? "";
      return {
        ...withOrderListImage(o),
        requester,
        is_instant_purchase:
          (o as { is_instant_purchase?: boolean }).is_instant_purchase ?? false,
      };
    });
    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("관리자 주문 목록 조회 오류:", error);
    res.status(500).json({ message: "주문 목록 조회에 실패했습니다." });
  }
};

/** GET /api/admin/orders/:id - 관리자용 주문 상세 (아무 주문이나 조회, 동일 응답 형식) */
export const getOrderByIdAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = (Array.isArray(idParam) ? idParam[0] : idParam)?.trim();
    if (!id) {
      return res.status(400).json({ message: "주문 ID가 필요합니다." });
    }

    const orderRaw = await prisma.order.findUnique({
      where: { id },
      include: {
        order_items: { include: { item: true } },
        user: { select: { email: true } },
      },
    });
    if (!orderRaw) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }

    const orderItemsWithImage = orderRaw.order_items.map(withOrderItemImage);
    const { summary_title, total_quantity } = getOrderSummary(
      orderRaw.order_items,
    );
    const requester =
      (orderRaw.user as { email?: string })?.email?.split("@")[0] ?? "";
    const order = {
      ...orderRaw,
      order_items: orderItemsWithImage,
      items: orderItemsWithImage,
      summary_title,
      total_quantity,
      requester,
      is_instant_purchase:
        (orderRaw as { is_instant_purchase?: boolean }).is_instant_purchase ??
        false,
    };
    res.json(order);
  } catch (error) {
    console.error("관리자 주문 상세 조회 오류:", error);
    res.status(500).json({ message: "주문 조회에 실패했습니다." });
  }
};

/** GET /api/orders/:id - 주문 상세 */
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const idParam = req.params.id;
    const id = (Array.isArray(idParam) ? idParam[0] : idParam)?.trim();
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

    const orderItemsWithImage = orderRaw.order_items.map(withOrderItemImage);
    const { summary_title, total_quantity } = getOrderSummary(
      orderRaw.order_items,
    );
    const order = {
      ...orderRaw,
      order_items: orderItemsWithImage,
      items: orderItemsWithImage,
      summary_title,
      total_quantity,
      is_instant_purchase:
        (orderRaw as { is_instant_purchase?: boolean }).is_instant_purchase ??
        false,
    };
    res.json(order);
  } catch (error) {
    console.error("주문 상세 조회 오류:", error);
    res.status(500).json({ message: "주문 조회에 실패했습니다." });
  }
};

/** POST /api/orders - 주문 생성 (장바구니 기반 또는 body로 items 전달). body.instant_purchase === true 이면 관리자만 즉시 승인 주문 생성 */
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const instantPurchase = req.body?.instant_purchase === true;

    if (instantPurchase) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { is_admin: true },
      });
      if (user?.is_admin !== "Y") {
        return res
          .status(403)
          .json({ message: "즉시 구매는 관리자만 가능합니다." });
      }
    }

    // body에 items 없거나 빈 배열이면 현재 장바구니로 주문 생성 (items: [] 보내면 빈 주문 방지)
    const bodyItems = req.body?.items as
      | Array<{ item_id: string; quantity?: number }>
      | undefined;
    console.log("bodyItems", bodyItems);
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
    const itemMap = await prisma.item
      .findMany({ where: { id: { in: itemIds } } })
      .then((list) => Object.fromEntries(list.map((it) => [it.id, it])));

    let total_amount = 0;
    const orderItemsData: {
      item_id: string;
      quantity: number;
      total_price: number;
    }[] = [];
    for (const row of items) {
      const item = itemMap[row.item_id];
      if (!item) {
        return res
          .status(400)
          .json({ message: `상품을 찾을 수 없습니다: ${row.item_id}` });
      }
      const total_price = item.price * row.quantity;
      total_amount += total_price;
      orderItemsData.push({
        item_id: row.item_id,
        quantity: row.quantity,
        total_price,
      });
    }

    const now = new Date();
    const isInstant = instantPurchase;

    // 주문 생성 + 요청한 품목 장바구니 삭제를 한 트랜잭션으로 처리 (하나라도 실패하면 둘 다 롤백)
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          user_id: userId,
          status: isInstant ? OrderStatus.approved : OrderStatus.pending,
          total_amount,
          ...(isInstant && { approved_at: now }),
          ...(isInstant && { is_instant_purchase: true }),
          order_items: {
            create: orderItemsData,
          },
        } as Parameters<typeof tx.order.create>[0]["data"],
        include: { order_items: { include: { item: true } } },
      });
      // 요청한 상품은 장바구니에서 삭제 (해당 user_id + item_id만 삭제, 남은 상품은 유지)
      await tx.cart.deleteMany({
        where: { user_id: userId, item_id: { in: itemIds } },
      });
      // 즉시 구매(관리자): 예산 사용액 차감 (상품금액 + 배송비)
      if (isInstant) {
        await addSpentToBudget(total_amount, tx);
      }
      return created;
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

/** PATCH /api/admin/orders/:id - 관리자 승인/반려. 권한: 관리자만. 대상: 어떤 사용자의 주문이든 id만 맞으면 수정. body: { status: "approved" | "cancelled" } */
export const patchOrderStatusAdmin = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const idParam = req.params.id;
    const id = (Array.isArray(idParam) ? idParam[0] : idParam)?.trim();
    if (!id) {
      return res.status(400).json({ message: "주문 ID가 필요합니다." });
    }

    const status = req.body?.status;
    if (status !== "approved" && status !== "cancelled") {
      return res.status(400).json({
        message:
          "status는 'approved'(승인) 또는 'cancelled'(반려)만 가능합니다.",
      });
    }

    // 본인 주문 아님. 해당 id의 주문만 있으면 수정 가능 (관리자)
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }
    if (order.status !== OrderStatus.pending) {
      return res.status(400).json({
        message: "승인 대기 중인 주문만 승인/반려할 수 있습니다.",
      });
    }

    // 승인/반려를 주문 테이블 컬럼(approved_at, canceled_at)에 직접 반영.
    // 반려 시 해당 주문 품목은 장바구니에 복원.
    const updated = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const patchData =
        status === "approved"
          ? {
              status: OrderStatus.approved,
              approved_at: now,
              canceled_at: null,
            }
          : { status: OrderStatus.canceled, canceled_at: now };

      const o = await tx.order.update({
        where: { id },
        data: patchData,
        include: { order_items: { include: { item: true } } },
      });
      if (status === "cancelled") {
        await restoreOrderItemsToCart(tx, order.user_id, o.order_items);
      }
      // 승인 시 예산 사용액 차감 (상품금액 + 배송비)
      if (status === "approved") {
        await addSpentToBudget(order.total_amount, tx);
      }
      return o;
    });

    const orderItemsWithImage = updated.order_items.map(withOrderItemImage);
    const { summary_title, total_quantity } = getOrderSummary(
      updated.order_items,
    );
    const result = {
      ...updated,
      order_items: orderItemsWithImage,
      items: orderItemsWithImage,
      summary_title,
      total_quantity,
    };

    res.json({
      success: true,
      message: status === "approved" ? "승인되었습니다." : "반려되었습니다.",
      data: result,
    });
  } catch (error) {
    console.error("주문 승인/반려 오류:", error);
    res.status(500).json({ message: "처리에 실패했습니다." });
  }
};

/** GET /api/orders/history - 내 구매 확정 이력 (주문 중 승인된 건) */
export const getPurchaseHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(String(req.query.limit), 10) || 10),
    );
    const skip = (page - 1) * limit;

    const historyWhere = { user_id: userId, status: OrderStatus.approved };
    const [list, total] = await Promise.all([
      prisma.order.findMany({
        where: historyWhere,
        include: { order_items: { include: { item: true } } },
        orderBy: { approved_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: historyWhere }),
    ]);

    const data = list.map((order) => {
      const withCat = order.order_items.map((oi) => ({
        ...oi,
        category: oi.item?.category_sub ?? oi.item?.category_main ?? "",
      }));
      const { summary_title, total_quantity } = getOrderSummary(
        order.order_items,
      );
      return {
        id: order.id,
        order_id: order.id,
        total_amount: order.total_amount,
        approved_at: order.approved_at,
        created_at: order.created_at,
        summary_title,
        total_quantity,
        items: withCat,
        order_items: withCat,
        is_instant_purchase:
          (order as { is_instant_purchase?: boolean }).is_instant_purchase ??
          false,
      };
    });

    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("구매 이력 조회 오류:", error);
    res.status(500).json({ message: "구매 이력 조회에 실패했습니다." });
  }
};

/** DELETE /api/orders/:id - 요청 취소. 취소 후 해당 주문 품목을 장바구니에 다시 넣음 (트랜잭션). */
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const idParam = req.params.id;
    const id = (Array.isArray(idParam) ? idParam[0] : idParam)?.trim();
    if (!id) {
      return res.status(400).json({ message: "주문 ID가 필요합니다." });
    }

    const order = await prisma.order.findFirst({
      where: { id, user_id: userId },
      include: { order_items: { include: { item: true } } },
    });
    if (!order) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }
    if (order.status !== OrderStatus.pending) {
      return res
        .status(400)
        .json({ message: "대기 중인 주문만 취소할 수 있습니다." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.canceled, canceled_at: new Date() },
      });
      await restoreOrderItemsToCart(tx, userId, order.order_items);
    });

    res.json({
      success: true,
      message: "요청이 취소되었습니다. 해당 상품이 장바구니에 다시 담겼습니다.",
    });
  } catch (error) {
    console.error("주문 취소 오류:", error);
    res.status(500).json({ message: "주문 취소에 실패했습니다." });
  }
};
