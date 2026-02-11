import { Router } from "express";
import { getOrdersAdmin, getOrderByIdAdmin } from "../controllers/orderController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const router = Router();

// 구매 요청 관리·내역 관리: 목록/상세 모두 summary_title, total_quantity, items 등 동일 형식
router.get("/orders", authMiddleware, adminMiddleware, getOrdersAdmin);
router.get("/orders/:id", authMiddleware, adminMiddleware, getOrderByIdAdmin);

export default router;
