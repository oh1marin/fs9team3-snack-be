"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.getProfile = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
// 프로필 조회
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "로그인이 필요합니다." });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                create_at: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
        res.json(user);
    }
    catch (error) {
        console.error("프로필 조회 오류:", error);
        res.status(500).json({ message: "프로필 조회에 실패했습니다." });
    }
};
exports.getProfile = getProfile;
// 비밀번호 변경
const updatePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { password } = req.body;
        if (!userId) {
            return res.status(401).json({ message: "로그인이 필요합니다." });
        }
        if (!password || password.length < 8) {
            return res
                .status(400)
                .json({ message: "비밀번호는 8자 이상이어야 합니다." });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        res.json({
            success: true,
            message: "비밀번호가 성공적으로 변경되었습니다! 🔒"
        });
    }
    catch (error) {
        console.error("비밀번호 변경 오류:", error);
        res.status(500).json({ message: "비밀번호 변경에 실패했습니다." });
    }
};
exports.updatePassword = updatePassword;
