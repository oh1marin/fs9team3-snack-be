import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";
import { createPresignedUpload, getPresignedDownloadUrl, getPublicObjectUrl } from "../config/upload";

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

    console.log("🔍 상품 목록 조회:", { where, orderBy, page: pageNum, limit: limitNum });

    // 전체 개수 조회
    const totalCount = await prisma.item.count({ where });

    // 상품 목록 조회
    const items = await prisma.item.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
    });

    console.log("📊 조회 결과:", { totalCount, returnedCount: items.length, items: items.map(i => ({ id: i.id, title: i.title, category_main: i.category_main, category_sub: i.category_sub })) });

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
            email: true,
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
        email: item.user.email,
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

// S3 업로드 시 location (SDK v3는 미반환 → bucket+key로 URL 생성)
type FileWithLocation = Express.Multer.File & { location?: string; bucket?: string; key?: string };

function getImageUrl(file: FileWithLocation | undefined, bodyImage: string | undefined): string {
  if (!file || typeof file !== "object") return bodyImage ?? "";
  if (typeof file.location === "string" && file.location) return file.location;
  if (typeof file.bucket === "string" && typeof file.key === "string") return getPublicObjectUrl(file.bucket, file.key);
  return bodyImage ?? "";
}

// FormData는 모든 값을 문자열로 보냄. 배열이 올 수 있으므로 단일값으로 정규화
function first(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value.length ? String(value[0]) : undefined;
  return String(value);
}

// 상품 등록
export const createItem = async (req: AuthRequest, res: Response) => {
  try {
    const title = first(req.body?.title);
    const price = first(req.body?.price);
    const image = first(req.body?.image);
    const category_main = first(req.body?.category_main);
    const category_sub = first(req.body?.category_sub);
    const userId = req.user?.id;
    const imageUrl = getImageUrl(req.file as FileWithLocation, image);

    console.log("📦 상품 등록 요청:", { title, price, image, category_main, category_sub, userId });

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
            email: true,
          },
        },
      },
    });

    console.log("✅ 상품 등록 성공:", { id: item.id, title: item.title, category_main: item.category_main, category_sub: item.category_sub });

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
          email: item.user.email,
        },
      },
    });
  } catch (error) {
    const err = error as Error;
    const errMessage = err?.message ?? String(error);
    console.error("상품 등록 오류:", errMessage, err?.stack);
    res.status(500).json({
      message: "상품 등록에 실패했습니다.",
      error: errMessage,
    });
  }
};

// 상품 수정
export const updateItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id: itemIdParam } = req.params;
    const itemId = parseItemId(itemIdParam);

    console.log("✏️ 상품 수정 요청:", { itemId, userId: req.user?.id, body: req.body });

    if (!itemId) {
      return res.status(400).json({ message: "유효하지 않은 상품 id입니다." });
    }

    const { title, price, image, category_main, category_sub, link } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      console.log("❌ 수정 실패: 로그인 필요");
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      console.log("❌ 수정 실패: 상품을 찾을 수 없음");
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    console.log("📋 기존 상품 정보:", { itemId: existingItem.id, ownerId: existingItem.user_id, requestUserId: userId });

    if (existingItem.user_id !== userId) {
      console.log("❌ 수정 실패: 권한 없음");
      return res.status(403).json({ message: "수정 권한이 없습니다." });
    }

    const data: any = {};
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return res.status(400).json({ message: "상품명을 입력해주세요." });
      }
      data.title = title.trim();
    }
    const imageUrl = getImageUrl(req.file as FileWithLocation, image);
    if (imageUrl !== undefined && imageUrl !== "") data.image = imageUrl;
    if (category_main !== undefined) data.category_main = category_main;
    if (category_sub !== undefined) data.category_sub = category_sub;
    if (link !== undefined) data.link = link;

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
            email: true,
          },
        },
      },
    });

    console.log("✅ 상품 수정 성공:", { itemId, title: item.title });

    res.json({
      message: "상품이 수정되었습니다.",
      item: {
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        category_main: item.category_main,
        category_sub: item.category_sub,
        link: item.link,
        count: item.count,
        updated_at: item.updated_at,
        seller: {
          id: item.user.id,
          email: item.user.email,
        },
      },
    });
  } catch (error) {
    console.error("❌ 상품 수정 오류:", error);
    res.status(500).json({ message: "상품 수정에 실패했습니다." });
  }
};

// Presigned 업로드 URL 발급 (클라이언트가 이 URL로 PUT → imageUrl을 상품 등록/수정 시 image로 전달)
export const getPresignedUploadUrl = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    const filename = typeof req.query.filename === "string" ? req.query.filename : undefined;
    const result = await createPresignedUpload(filename);
    res.json(result);
  } catch (error) {
    console.error("Presigned URL 발급 오류:", error);
    res.status(500).json({ message: "Presigned URL 발급에 실패했습니다." });
  }
};

// Presigned 다운로드 URL (프라이빗 버킷 객체 조회용)
export const getPresignedImageUrl = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    const key = typeof req.query.key === "string" ? req.query.key : "";
    const bucket = process.env.AWS_PRIVATE_BUCKET_NAME;
    if (!bucket || !key) {
      return res.status(400).json({ message: "key 쿼리와 AWS_PRIVATE_BUCKET_NAME이 필요합니다." });
    }
    const url = await getPresignedDownloadUrl(bucket, key);
    res.json({ url });
  } catch (error) {
    console.error("Presigned 다운로드 URL 오류:", error);
    res.status(500).json({ message: "Presigned URL 발급에 실패했습니다." });
  }
};

// 상품 삭제
export const deleteItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id: itemIdParam } = req.params;
    const itemId = parseItemId(itemIdParam);

    console.log("🗑️ 상품 삭제 요청:", { itemId, userId: req.user?.id });

    if (!itemId) {
      return res.status(400).json({ message: "유효하지 않은 상품 id입니다." });
    }

    const userId = req.user?.id;
    if (!userId) {
      console.log("❌ 삭제 실패: 로그인 필요");
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      console.log("❌ 삭제 실패: 상품을 찾을 수 없음");
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    console.log("📋 기존 상품 정보:", { itemId: existingItem.id, ownerId: existingItem.user_id, requestUserId: userId });

    if (existingItem.user_id !== userId) {
      console.log("❌ 삭제 실패: 권한 없음");
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }

    await prisma.item.delete({
      where: { id: itemId },
    });

    console.log("✅ 상품 삭제 성공:", { itemId, title: existingItem.title });

    res.json({
      success: true,
      message: "상품이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("❌ 상품 삭제 오류:", error);
    res.status(500).json({ message: "상품 삭제에 실패했습니다." });
  }
};
