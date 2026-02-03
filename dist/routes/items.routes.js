"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const itemsController_1 = require("../controllers/itemsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// 상품 목록 조회 (인증 없이 허용 - cross-origin 쿠키 미전송 대응)
router.get("/", itemsController_1.getItems);
// Presigned 업로드 URL 발급 (인증 필요)
router.get("/presigned-upload-url", authMiddleware_1.authMiddleware, itemsController_1.getPresignedUploadUrl);
router.get("/presigned-image", authMiddleware_1.authMiddleware, itemsController_1.getPresignedImageUrl);
// 상품 상세 조회 (인증 없이 허용)
router.get("/:id", itemsController_1.getItemById);
// 상품 등록 (인증 필요)
router.post("/", authMiddleware_1.authMiddleware, itemsController_1.createItem);
// 상품 수정 (인증 필요)
router.patch("/:id", authMiddleware_1.authMiddleware, itemsController_1.updateItem);
router.put("/:id", authMiddleware_1.authMiddleware, itemsController_1.updateItem);
// 상품 삭제 (인증 필요)
router.delete("/:id", authMiddleware_1.authMiddleware, itemsController_1.deleteItem);
exports.default = router;
