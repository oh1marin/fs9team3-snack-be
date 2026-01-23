// src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/customError";
import jwt from "jsonwebtoken";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  // CustomError: 의도적으로 던진 에러
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  // JWT 에러: 토큰 만료 또는 유효하지 않음
  if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(401).json({
      message: "유효하지 않은 토큰입니다. 다시 로그인해주세요.",
    });
  }

  // 예상치 못한 에러: 500 응답
  res.status(500).json({
    message: "서버 오류가 발생했습니다.",
  });
};