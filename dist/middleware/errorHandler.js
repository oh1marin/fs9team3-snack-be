"use strict";
// src/middleware/errorHandler.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const customError_1 = require("../utils/customError");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler = (err, req, res, next) => {
    console.error("Error:", err);
    // CustomError: 의도적으로 던진 에러
    if (err instanceof customError_1.CustomError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }
    // JWT 에러: 토큰 만료 또는 유효하지 않음
    if (err instanceof jsonwebtoken_1.default.JsonWebTokenError || err instanceof jsonwebtoken_1.default.TokenExpiredError) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(401).json({
            success: false,
            message: "유효하지 않은 토큰입니다. 다시 로그인해주세요.",
        });
    }
    // 예상치 못한 에러: 500 응답 (원인은 서버 로그에 출력됨)
    console.error("[500]", err.message, err.stack);
    const isDev = process.env.NODE_ENV !== "production";
    res.status(500).json({
        success: false,
        message: "서버 오류가 발생했습니다.",
        ...(isDev && err?.message ? { error: err.message } : {}),
    });
};
exports.errorHandler = errorHandler;
