import { Router } from "express";
import { getCarts, createCart, updateCart, deleteCart } from "../controllers/cartController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// 모든 장바구니 API는 인증 필수
router.get("/", authMiddleware, getCarts);
router.post("/", authMiddleware, createCart);
router.patch("/:cartId", authMiddleware, updateCart);
router.delete("/:cartId", authMiddleware, deleteCart);

export default router;
