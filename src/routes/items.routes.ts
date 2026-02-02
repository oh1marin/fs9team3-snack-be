import { Router } from "express";
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/itemsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { uploadToS3 } from "../config/upload";

const router = Router();

// 상품 목록 조회 (인증 필요)
// 쿼리 파라미터: category_main, category_sub, sort, page, limit
// 예: /api/items?category_main=음료&category_sub=청량·탄산음료&sort=최신순&page=1&limit=8
router.get("/", authMiddleware, getItems);

// 상품 상세 조회 (인증 필요)
router.get("/:id", authMiddleware, getItemById);

// 상품 등록 (인증 필요)
// multipart/form-data: title, price, category_main, category_sub, image(파일)
// application/json: title, price, image(URL), category_main, category_sub
router.post("/", authMiddleware, uploadToS3.single("image"), createItem);

// 상품 수정 (인증 필요)
router.patch("/:id", authMiddleware, uploadToS3.single("image"), updateItem);
router.put("/:id", authMiddleware, uploadToS3.single("image"), updateItem);

// 상품 삭제 (인증 필요)
router.delete("/:id", authMiddleware, deleteItem);

export default router;
