// src/controllers/authController.ts

import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from "../utils/customError";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

/** 배포(HTTPS) 시 Vercel 등 크로스오리진에서 쿠키 전송 가능하도록 옵션 */
function cookieOptions(maxAgeMs: number) {
  const isSecure = process.env.NODE_ENV === "production" || process.env.USE_HTTPS === "true";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? "none" : "lax") as "none" | "lax",
    maxAge: maxAgeMs,
  };
}

// 회원가입
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검사
    if (!email || !password) {
      throw new BadRequestError("이메일과 비밀번호를 입력해주세요.");
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestError("올바른 이메일 형식이 아닙니다.");
    }

    // 비밀번호 길이 검사
    if (password.length < 8) {
      throw new BadRequestError("비밀번호는 최소 8자 이상이어야 합니다.");
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError("이미 사용 중인 이메일입니다.");
    }

    // 비밀번호 해싱 및 사용자 생성
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // JWT 토큰 생성
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // 쿠키 설정 (배포 시 sameSite=none 으로 Vercel 등 크로스오리진 허용)
    res.cookie("accessToken", accessToken, cookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

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
  } catch (error) {
    next(error);
  }
};

// 로그인
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검사
    if (!email || !password) {
      throw new BadRequestError("이메일과 비밀번호를 입력해주세요.");
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    // JWT 토큰 생성
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // 쿠키 설정 (배포 시 sameSite=none 으로 Vercel 등 크로스오리진 허용)
    res.cookie("accessToken", accessToken, cookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

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
  } catch (error) {
    next(error);
  }
};

// 현재 사용자 정보 조회
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 쿠키 또는 헤더에서 토큰 가져오기
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new UnauthorizedError("인증 토큰이 없습니다.");
    }

    // JWT 검증
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        create_at: true,
      },
    });

    if (!user) {
      throw new NotFoundError("사용자를 찾을 수 없습니다.");
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      nickname: user.email.split("@")[0],
    });
  } catch (error) {
    next(error);
  }
};

// 로그아웃
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ 
      success: true,
      message: "로그아웃되었습니다."
    });
  } catch (error) {
    next(error);
  }
};

// 토큰 갱신
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!oldRefreshToken) {
      throw new UnauthorizedError("리프레시 토큰이 없습니다.");
    }

    // 리프레시 토큰 검증
    const decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET) as {
      userId: string;
      email: string;
    };

    // 새 액세스 토큰 생성
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    // 쿠키 업데이트 (배포 시 sameSite=none)
    res.cookie("accessToken", newAccessToken, cookieOptions(15 * 60 * 1000));

    res.status(200).json({ 
      success: true,
      message: "토큰이 갱신되었습니다.",
      accessToken: newAccessToken 
    });
  } catch (error) {
    next(error);
  }
};

// 비밀번호 변경
export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 쿠키 또는 헤더에서 토큰 가져오기
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new UnauthorizedError("인증 토큰이 없습니다.");
    }

    // JWT 검증
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const { password } = req.body;

    // 비밀번호 검사
    if (!password) {
      throw new BadRequestError("비밀번호를 입력해주세요.");
    }

    if (password.length < 8) {
      throw new BadRequestError("비밀번호는 최소 8자 이상이어야 합니다.");
    }

    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new NotFoundError("사용자를 찾을 수 없습니다.");
    }

    // 비밀번호 해싱 및 업데이트
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: "비밀번호가 성공적으로 변경되었습니다! 🔒",
    });
  } catch (error) {
    next(error);
  }
};