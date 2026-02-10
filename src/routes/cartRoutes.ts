import { Router } from "express";
import {
  getCarts,
  createCart,
  updateCart,
  deleteCart,
  clearCart,
} from "../controllers/cartController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// FE: GET /api/cart, POST /api/cart/items, PATCH/DELETE /api/cart/items/:id, DELETE /api/cart
router.get("/", authMiddleware, getCarts);
router.post("/items", authMiddleware, createCart);
router.patch("/items/:id", authMiddleware, updateCart);
router.delete("/items/:id", authMiddleware, deleteCart);
router.delete("/", authMiddleware, clearCart);

export default router;
