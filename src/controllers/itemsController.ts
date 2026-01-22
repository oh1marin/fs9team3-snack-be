import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

function parseItemId(raw: unknown) {
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  if (!v) return null;
  return v;
}

// 상품 목록 조회 (페이지네이션 지원)
export const getItems = async (req: AuthRequest, res: Response) => {
  try {
    const { category_main, category_sub, sort, page = "1", limit = "8" } = req.query;

    const where: any = {};

    // 카테고리 필터링
    if (typeof category_main === "string" && category_main.length > 0) {
      where.category_main = category_main;
    }
    if (typeof category_sub === "string" && category_sub.length > 0) {
      where.category_sub = category_sub;
    }

    // 정렬 옵션
    let orderBy: any = { create_at: "desc" }; // 기본: 최신순
    if (sort === "판매순") orderBy = { count: "desc" };
    else if (sort === "낮은가격순") orderBy = { price: "asc" };
    else if (sort === "높은가격순") orderBy = { price: "desc" };
    else if (sort === "최신순") orderBy = { create_at: "desc" };

    // 페이지네이션 계산
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 8));
    const skip = (pageNum - 1) * limitNum;

    // 전체 개수 조회
    const totalCount = await prisma.item.count({ where });

    // 상품 목록 조회
    const items = await prisma.item.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        user: {
          select: {
            name: true,
            company_name: true,
          },
        },
      },
    });

    // 페이지네이션 정보 계산
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;

    res.json({
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error("상품 조회 오류:", error);
    res.status(500).json({ message: "상품 조회에 실패했습니다." });
  }
};

// 상품 상세 조회
export const getItemById = async (req: AuthRequest, res: Response) => {
  try {
    const { id: itemIdParam } = req.params;
    const itemId = parseItemId(itemIdParam);

    if (!itemId) {
      return res.status(400).json({ message: "유효하지 않은 상품 id입니다." });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company_name: true,
          },
        },
      },
    });

    if (!item) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    // 프론트엔드 친화적인 응답 형식
    const response = {
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      category_main: item.category_main,
      category_sub: item.category_sub,
      count: item.count, // 구매 횟수
      created_at: item.create_at,
      updated_at: item.updated_at,
      seller: {
        id: item.user.id,
        name: item.user.name,
        email: item.user.email,
        company_name: item.user.company_name,
      },
      // 프론트엔드에서 필요한 추가 정보
      purchaseCount: item.count,
      isOwner: req.user?.id === item.user_id, // 현재 로그인한 유저가 판매자인지
    };

    res.json(response);
  } catch (error) {
    console.error("상품 조회 오류:", error);
    res.status(500).json({ message: "상품 조회에 실패했습니다." });
  }
};

// 상품 등록
export const createItem = async (req: AuthRequest, res: Response) => {
  try {
    const { title, price, image, category_main, category_sub } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    // 유효성 검사
    if (!title || price === undefined || !category_main || !category_sub) {
      return res
        .status(400)
        .json({ message: "필수 입력 항목이 누락되었습니다. (title, price, category_main, category_sub)" });
    }

    if (typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ message: "상품명을 입력해주세요." });
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: "가격이 올바르지 않습니다." });
    }

    // 상품 생성
    const item = await prisma.item.create({
      data: {
        title: title.trim(),
        price: Math.trunc(parsedPrice),
        image: image || "",
        category_main,
        category_sub,
        user_id: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            company_name: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "상품이 등록되었습니다.",
      item: {
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        category_main: item.category_main,
        category_sub: item.category_sub,
        count: item.count,
        created_at: item.create_at,
        seller: {
          id: item.user.id,
          name: item.user.name,
          company_name: item.user.company_name,
        },
      },
    });
  } catch (error) {
    console.error("상품 등록 오류:", error);
    res.status(500).json({ message: "상품 등록에 실패했습니다." });
  }
};

// 상품 수정
export const updateItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id: itemIdParam } = req.params;
    const itemId = parseItemId(itemIdParam);

    if (!itemId) {
      return res.status(400).json({ message: "유효하지 않은 상품 id입니다." });
    }

    const { title, price, image, category_main, category_sub } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    if (existingItem.user_id !== userId) {
      return res.status(403).json({ message: "수정 권한이 없습니다." });
    }

    const data: any = {};
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return res.status(400).json({ message: "상품명을 입력해주세요." });
      }
      data.title = title.trim();
    }
    if (image !== undefined) data.image = image;
    if (category_main !== undefined) data.category_main = category_main;
    if (category_sub !== undefined) data.category_sub = category_sub;

    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: "가격이 올바르지 않습니다." });
      }
      data.price = Math.trunc(parsedPrice);
    }

    const item = await prisma.item.update({
      where: { id: itemId },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            company_name: true,
          },
        },
      },
    });

    res.json({
      message: "상품이 수정되었습니다.",
      item: {
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        category_main: item.category_main,
        category_sub: item.category_sub,
        count: item.count,
        updated_at: item.updated_at,
        seller: {
          id: item.user.id,
          name: item.user.name,
          company_name: item.user.company_name,
        },
      },
    });
  } catch (error) {
    console.error("상품 수정 오류:", error);
    res.status(500).json({ message: "상품 수정에 실패했습니다." });
  }
};

// 상품 삭제
export const deleteItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id: itemIdParam } = req.params;
    const itemId = parseItemId(itemIdParam);

    if (!itemId) {
      return res.status(400).json({ message: "유효하지 않은 상품 id입니다." });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    if (existingItem.user_id !== userId) {
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }

    await prisma.item.delete({
      where: { id: itemId },
    });

    res.json({
      success: true,
      message: "상품이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("상품 삭제 오류:", error);
    res.status(500).json({ message: "상품 삭제에 실패했습니다." });
  }
};
