import { Router } from "express";
import {
  signup,
  login,
  getCurrentUser,
  logout,
  refreshToken,
} from "../controllers/authController";

const router = Router();

// 회원가입
router.post("/signup", signup);

// 로그인
router.post("/login", login);

// 현재 유저 정보 (쿠키 기반 인증)
router.get("/me", getCurrentUser);

// 로그아웃
router.post("/logout", logout);

// 토큰 갱신
router.post("/refresh", refreshToken);

export default router;
