"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// 회원가입
router.post("/signup", authController_1.signup);
// 로그인
router.post("/login", authController_1.login);
// 현재 유저 정보 (쿠키 기반 인증)
router.get("/me", authController_1.getCurrentUser);
// 로그아웃
router.post("/logout", authController_1.logout);
// 토큰 갱신
router.post("/refresh", authController_1.refreshToken);
// 비밀번호 변경 (쿠키 기반 인증)
router.patch("/password", authController_1.updatePassword);
exports.default = router;
