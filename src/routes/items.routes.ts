import { Router } from "express";
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getPresignedUploadUrl,
  getPresignedImageUrl,
} from "../controllers/itemsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { uploadToS3 } from "../config/upload";

const router = Router();

// 상품 목록 조회 (인증 없이 허용 - cross-origin 쿠키 미전송 대응)
router.get("/", getItems);

// Presigned 업로드 URL 발급 (인증 필요)
router.get("/presigned-upload-url", authMiddleware, getPresignedUploadUrl);
router.get("/presigned-image", authMiddleware, getPresignedImageUrl);

// 상품 상세 조회 (인증 없이 허용)
router.get("/:id", getItemById);

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
