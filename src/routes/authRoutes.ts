import { Router } from "express";
import {
  signup,
  login,
  getCurrentUser,
  logout,
  refreshToken,
  updatePassword,
} from "../controllers/authController";

const router = Router();

// 회원가입
router.post("/signup", signup);

// 로그인
router.post(
  "/login",
  (req, res, next) => {
    console.log("실행성공");
    next();
  },
  login,
);

// 현재 유저 정보 (쿠키 기반 인증)
router.get("/me", getCurrentUser);

// 로그아웃
router.post("/logout", logout);

// 토큰 갱신
router.post("/refresh", refreshToken);

// 비밀번호 변경 (쿠키 기반 인증)
router.patch("/password", updatePassword);

export default router;
