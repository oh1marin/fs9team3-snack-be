import { Router } from "express";
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/itemsController";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/authMiddleware";

const router = Router();

// 상품 목록 조회 (공개 - 로그인 선택)
// 쿼리 파라미터: category_main, category_sub, sort, page, limit
// 예: /api/items?category_main=음료&category_sub=청량·탄산음료&sort=최신순&page=1&limit=8
router.get("/", authMiddleware, getItems);

// 상품 상세 조회 (공개 - 로그인 선택)
router.get("/:id", authMiddleware, getItemById);

// 상품 등록 (인증 필요)
router.post("/", authMiddleware, createItem);

// 상품 수정 (인증 필요)
router.patch("/:id", authMiddleware, updateItem);

// 상품 삭제 (인증 필요)
router.delete("/:id", authMiddleware, deleteItem);

export default router;
