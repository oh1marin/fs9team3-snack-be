import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { superAdminMiddleware } from "../middleware/superAdminMiddleware";
import { sendInvitation } from "../controllers/invitationController";
import { getUsers, patchUserGrade, deleteUser } from "../controllers/superAdminUserController";
import { getCurrentBudget, patchCurrentBudget } from "../controllers/budgetController";

const router = Router();

// 최고관리자: 이메일로 가입 초대 링크 발송 (nodemailer)
router.post(
  "/invitations",
  authMiddleware,
  superAdminMiddleware,
  sendInvitation
);

// 최고관리자: 전체 유저 목록 조회 (등급 포함)
router.get("/users", authMiddleware, superAdminMiddleware, getUsers);

// 최고관리자: 유저 등급 수정 (is_admin, is_super_admin)
router.patch("/users/:id", authMiddleware, superAdminMiddleware, patchUserGrade);

// 최고관리자: 유저 계정 탈퇴(삭제)
router.delete("/users/:id", authMiddleware, superAdminMiddleware, deleteUser);

// 최고관리자: 예산 관리 (이번 달 예산, 매달 시작 예산)
router.get("/budget/current", authMiddleware, superAdminMiddleware, getCurrentBudget);
router.patch("/budget/current", authMiddleware, superAdminMiddleware, patchCurrentBudget);

export default router;
