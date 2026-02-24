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

// 액세스 토큰: 짧은 만료 (기본 10분)
const ACCESS_TOKEN_EXPIRY_STR = process.env.JWT_ACCESS_EXPIRY || "10m";
// 리프레시 토큰: 24시간
const REFRESH_TOKEN_EXPIRY_STR = process.env.JWT_REFRESH_EXPIRY || "24h";

/** 만료 문자열을 밀리초로 변환 (10m, 24h, 7d 등) */
function expiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 10 * 60 * 1000; // 기본 10분
  const [, num, unit] = match;
  const n = parseInt(num!, 10);
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return n * (multipliers[unit!] ?? 60000);
}

const ACCESS_TOKEN_EXPIRY_MS = expiryToMs(ACCESS_TOKEN_EXPIRY_STR);
const REFRESH_TOKEN_EXPIRY_MS = expiryToMs(REFRESH_TOKEN_EXPIRY_STR);

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

// 회원가입 (선택: invitationToken/token 있으면 초대 링크로 가입, 이메일은 초대 이메일과 일치해야 함)
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, invitationToken, token } = req.body;
    const invToken = invitationToken ?? token; // FE가 쿼리 param token을 body에 token으로 보낼 수 있음

    // 필수 필드 검사
    if (!email || !password) {
      throw new BadRequestError("이메일과 비밀번호를 입력해주세요.");
    }

    const emailTrimmed = String(email).trim();
    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      throw new BadRequestError("올바른 이메일 형식이 아닙니다.");
    }

    // 비밀번호 길이 검사
    if (password.length < 8) {
      throw new BadRequestError("비밀번호는 최소 8자 이상이어야 합니다.");
    }

    let invitationId: string | null = null;
    if (invToken && typeof invToken === "string") {
      try {
        const invitation = await prisma.invitation.findFirst({
          where: {
            token: invToken.trim(),
            used_at: null,
            expires_at: { gt: new Date() },
          },
        });
        if (!invitation) {
          throw new BadRequestError("유효하지 않거나 만료된 초대 링크입니다.");
        }
        if (invitation.email.toLowerCase() !== emailTrimmed.toLowerCase()) {
          throw new BadRequestError("초대된 이메일과 일치해야 합니다.");
        }
        invitationId = invitation.id;
      } catch (e) {
        if (e instanceof BadRequestError) throw e;
        console.error("[signup] invitation 조회/검증 실패:", e);
        // DB 테이블 없음 등: "relation \"invitations\" does not exist"
        const msg = e instanceof Error && e.message?.includes("invitations") ? "초대 기능을 사용하려면 DB 마이그레이션이 필요합니다. (npx prisma db push)" : "유효하지 않거나 만료된 초대 링크입니다.";
        throw new BadRequestError(msg);
      }
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: emailTrimmed },
    });

    if (existingUser) {
      throw new ConflictError("이미 사용 중인 이메일입니다.");
    }

    // 비밀번호 해싱 및 사용자 생성
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: emailTrimmed,
        password: hashedPassword,
      },
    });

    // 초대 링크로 가입한 경우 사용 처리
    if (invitationId) {
      try {
        await prisma.invitation.update({
          where: { id: invitationId },
          data: { used_at: new Date() },
        });
      } catch (e) {
        console.error("[signup] invitation 사용 처리 실패:", e);
      }
    }

    // JWT 토큰 생성 (액세스: 10분, 리프레시: 24시간)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000) }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_REFRESH_SECRET,
      { expiresIn: Math.floor(REFRESH_TOKEN_EXPIRY_MS / 1000) }
    );

    // 쿠키 설정 (배포 시 sameSite=none 으로 Vercel 등 크로스오리진 허용)
    res.cookie("accessToken", accessToken, cookieOptions(ACCESS_TOKEN_EXPIRY_MS));
    res.cookie("refreshToken", refreshToken, cookieOptions(REFRESH_TOKEN_EXPIRY_MS));

    res.status(201).json({
      success: true,
      message: "회원가입이 완료되었습니다! 🎉",
      user: {
        id: user.id,
        email: user.email,
        nickname: user.email.split("@")[0],
        is_admin: (user as { is_admin?: string }).is_admin ?? "N",
        is_super_admin: (user as { is_super_admin?: string }).is_super_admin ?? "N",
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("[signup] 500 원인:", error);
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

    // JWT 토큰 생성 (액세스: 10분, 리프레시: 24시간)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000) }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_REFRESH_SECRET,
      { expiresIn: Math.floor(REFRESH_TOKEN_EXPIRY_MS / 1000) }
    );

    // 쿠키 설정 (배포 시 sameSite=none 으로 Vercel 등 크로스오리진 허용)
    res.cookie("accessToken", accessToken, cookieOptions(ACCESS_TOKEN_EXPIRY_MS));
    res.cookie("refreshToken", refreshToken, cookieOptions(REFRESH_TOKEN_EXPIRY_MS));

    res.status(200).json({
      success: true,
      message: "로그인 성공! 👋",
      user: {
        id: user.id,
        email: user.email,
        nickname: user.email.split("@")[0],
        is_admin: (user as { is_admin?: string }).is_admin ?? "N",
        is_super_admin: (user as { is_super_admin?: string }).is_super_admin ?? "N",
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
    });

    if (!user) {
      throw new NotFoundError("사용자를 찾을 수 없습니다.");
    }

    const u = user as typeof user & { is_admin?: string; is_super_admin?: string };
    res.status(200).json({
      id: u.id,
      email: u.email,
      nickname: u.email.split("@")[0],
      is_admin: u.is_admin ?? "N",
      is_super_admin: u.is_super_admin ?? "N",
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

// 토큰 갱신 (리프레시 토큰으로 액세스+리프레시 둘 다 새로 발급, 회전)
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

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) {
      throw new UnauthorizedError("사용자를 찾을 수 없습니다.");
    }

    // 새 액세스 토큰 (10분)
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      JWT_SECRET,
      { expiresIn: Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000) }
    );

    // 새 리프레시 토큰 (24시간, 회전으로 보안 강화)
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      JWT_REFRESH_SECRET,
      { expiresIn: Math.floor(REFRESH_TOKEN_EXPIRY_MS / 1000) }
    );

    // 쿠키 업데이트 (둘 다 새로 설정)
    res.cookie("accessToken", newAccessToken, cookieOptions(ACCESS_TOKEN_EXPIRY_MS));
    res.cookie("refreshToken", newRefreshToken, cookieOptions(REFRESH_TOKEN_EXPIRY_MS));

    res.status(200).json({
      success: true,
      message: "토큰이 갱신되었습니다.",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
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