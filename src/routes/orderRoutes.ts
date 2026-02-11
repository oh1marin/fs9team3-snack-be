import { Router } from "express";
import {
  getOrders,
  getOrderById,
  getPurchaseHistory,
  createOrder,
  cancelOrder,
} from "../controllers/orderController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, getOrders);
router.get("/history", authMiddleware, getPurchaseHistory); // /history는 /:id보다 위에
router.get("/:id", authMiddleware, getOrderById);
router.post("/", authMiddleware, createOrder);
router.delete("/:id", authMiddleware, cancelOrder);

export default router;
