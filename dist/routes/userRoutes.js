"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// 프로필 조회
router.get("/profile", authMiddleware_1.authMiddleware, userController_1.getProfile);
// 비밀번호 변경
router.patch("/profile/password", authMiddleware_1.authMiddleware, userController_1.updatePassword);
exports.default = router;
