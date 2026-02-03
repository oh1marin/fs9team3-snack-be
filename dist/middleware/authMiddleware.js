"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const authMiddleware = (req, res, next) => {
    try {
        // 헤더에서 토큰 확인 (Authorization: Bearer <token>)
        let token = req.headers.authorization?.split(" ")[1];
        // 헤더에 없으면 쿠키에서 확인
        if (!token) {
            token = req.cookies?.accessToken;
        }
        if (!token) {
            return res.status(401).json({ message: "인증 토큰이 없습니다." });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // req.user 객체 설정 (컨트롤러에서 사용)
        req.user = {
            id: decoded.userId,
            email: decoded.email,
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
};
exports.authMiddleware = authMiddleware;
// 선택적 인증 미들웨어 (토큰이 있으면 인증, 없어도 통과)
const optionalAuthMiddleware = (req, res, next) => {
    try {
        // 헤더에서 토큰 확인 (Authorization: Bearer <token>)
        let token = req.headers.authorization?.split(" ")[1];
        // 헤더에 없으면 쿠키에서 확인
        if (!token) {
            token = req.cookies?.accessToken;
        }
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.userId,
                email: decoded.email,
            };
        }
        next();
    }
    catch (error) {
        // 토큰이 유효하지 않아도 통과
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
