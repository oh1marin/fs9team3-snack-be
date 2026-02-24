"use strict";
// src/controllers/authController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.refreshToken = exports.logout = exports.getCurrentUser = exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const customError_1 = require("../utils/customError");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
// 회원가입
const signup = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // 필수 필드 검사
        if (!email || !password) {
            throw new customError_1.BadRequestError("이메일과 비밀번호를 입력해주세요.");
        }
        // 이메일 형식 검사
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new customError_1.BadRequestError("올바른 이메일 형식이 아닙니다.");
        }
        // 비밀번호 길이 검사
        if (password.length < 8) {
            throw new customError_1.BadRequestError("비밀번호는 최소 8자 이상이어야 합니다.");
        }
        // 이메일 중복 확인
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new customError_1.ConflictError("이미 사용 중인 이메일입니다.");
        }
        // 비밀번호 해싱 및 사용자 생성
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });
        // JWT 토큰 생성
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
        // 쿠키 설정
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.USE_HTTPS === "true",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.USE_HTTPS === "true",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({
            success: true,
            message: "회원가입이 완료되었습니다! 🎉",
            user: {
                id: user.id,
                email: user.email,
                nickname: user.email.split("@")[0],
            },
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.signup = signup;
// 로그인
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // 필수 필드 검사
        if (!email || !password) {
            throw new customError_1.BadRequestError("이메일과 비밀번호를 입력해주세요.");
        }
        // 사용자 찾기
        const user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new customError_1.UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        // 비밀번호 확인
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new customError_1.UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        // JWT 토큰 생성
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
        // 쿠키 설정
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.USE_HTTPS === "true",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.USE_HTTPS === "true",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            success: true,
            message: "로그인 성공! 👋",
            user: {
                id: user.id,
                email: user.email,
                nickname: user.email.split("@")[0],
            },
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
// 현재 사용자 정보 조회
const getCurrentUser = async (req, res, next) => {
    try {
        // 쿠키 또는 헤더에서 토큰 가져오기
        const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
        if (!token) {
            throw new customError_1.UnauthorizedError("인증 토큰이 없습니다.");
        }
        // JWT 검증
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                create_at: true,
            },
        });
        if (!user) {
            throw new customError_1.NotFoundError("사용자를 찾을 수 없습니다.");
        }
        res.status(200).json({
            id: user.id,
            email: user.email,
            nickname: user.email.split("@")[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCurrentUser = getCurrentUser;
// 로그아웃
const logout = async (req, res, next) => {
    try {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({
            success: true,
            message: "로그아웃되었습니다."
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
// 토큰 갱신
const refreshToken = async (req, res, next) => {
    try {
        const oldRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        if (!oldRefreshToken) {
            throw new customError_1.UnauthorizedError("리프레시 토큰이 없습니다.");
        }
        // 리프레시 토큰 검증
        const decoded = jsonwebtoken_1.default.verify(oldRefreshToken, JWT_REFRESH_SECRET);
        // 새 액세스 토큰 생성
        const newAccessToken = jsonwebtoken_1.default.sign({ userId: decoded.userId, email: decoded.email }, JWT_SECRET, { expiresIn: "15m" });
        // 쿠키 업데이트
        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.USE_HTTPS === "true",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
        });
        res.status(200).json({
            success: true,
            message: "토큰이 갱신되었습니다.",
            accessToken: newAccessToken
        });
    }
    catch (error) {
        next(error);
    }
};
exports.refreshToken = refreshToken;
// 비밀번호 변경
const updatePassword = async (req, res, next) => {
    try {
        // 쿠키 또는 헤더에서 토큰 가져오기
        const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
        if (!token) {
            throw new customError_1.UnauthorizedError("인증 토큰이 없습니다.");
        }
        // JWT 검증
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const { password } = req.body;
        // 비밀번호 검사
        if (!password) {
            throw new customError_1.BadRequestError("비밀번호를 입력해주세요.");
        }
        if (password.length < 8) {
            throw new customError_1.BadRequestError("비밀번호는 최소 8자 이상이어야 합니다.");
        }
        // 사용자 확인
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!user) {
            throw new customError_1.NotFoundError("사용자를 찾을 수 없습니다.");
        }
        // 비밀번호 해싱 및 업데이트
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await prisma_1.default.user.update({
            where: { id: decoded.userId },
            data: { password: hashedPassword },
        });
        res.status(200).json({
            success: true,
            message: "비밀번호가 성공적으로 변경되었습니다! 🔒",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updatePassword = updatePassword;
