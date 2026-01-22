import { Router } from "express";
import { getProfile, updatePassword } from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// 프로필 조회
router.get("/profile", authMiddleware, getProfile);

// 비밀번호 변경
router.patch("/profile/password", authMiddleware, updatePassword);

export default router;
