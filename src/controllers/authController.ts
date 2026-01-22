import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

// 회원가입
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, passwordConfirm, name, company_name } = req.body;

    // 유효성 검사
    if (!email || !password || !passwordConfirm) {
      return res.status(400).json({ message: "필수 필드를 입력해주세요." });
    }

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "비밀번호는 최소 8자 이상이어야 합니다.",
      });
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "이미 사용 중인 이메일입니다.",
      });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        company_name: company_name || "코드잇",
      },
    });

    // JWT 토큰 생성
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "15m" } // 15분
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" } // 7일
    );

    // 쿠키 설정
    res.cookie("accessToken", accessToken, {
      httpOnly: true, // JavaScript 접근 불가
      secure: process.env.NODE_ENV === "production", // HTTPS 전용 (프로덕션)
      sameSite: "lax", // CSRF 방어
      maxAge: 15 * 60 * 1000, // 15분
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.name || user.email.split("@")[0], // nickname은 name 또는 이메일 앞부분
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 로그인
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 유효성 검사
    if (!email || !password) {
      return res.status(400).json({
        message: "이메일과 비밀번호를 입력해주세요.",
      });
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    // JWT 토큰 생성
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "15m" } // 15분
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" } // 7일
    );

    // 쿠키 설정
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15분
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.name || user.email.split("@")[0],
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 현재 사용자 정보 조회 (쿠키 기반)
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // 쿠키에서 토큰 가져오기 (우선순위: 쿠키 > Authorization 헤더)
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "인증 토큰이 없습니다." });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        company_name: true,
        create_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 프론트엔드 요구사항에 맞춘 응답 형식
    res.status(200).json({
      id: user.id,
      email: user.email,
      nickname: user.name || user.email.split("@")[0],
    });
  } catch (error) {
    console.error("Get current user error:", error);
    
    // JWT 에러 (만료, 유효하지 않은 서명 등)
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      // 유효하지 않은 토큰이므로 쿠키 삭제
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(401).json({ 
        message: "유효하지 않은 토큰입니다. 다시 로그인해주세요." 
      });
    }
    
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 로그아웃
export const logout = async (req: Request, res: Response) => {
  try {
    // 쿠키 삭제
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 토큰 갱신
export const refreshToken = async (req: Request, res: Response) => {
  try {
    // 쿠키 또는 body에서 refreshToken 가져오기
    const oldRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!oldRefreshToken) {
      return res.status(401).json({ message: "리프레시 토큰이 없습니다." });
    }

    // 리프레시 토큰 검증
    const decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET) as {
      userId: string;
      email: string;
    };

    // 새로운 액세스 토큰 생성
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    // 쿠키 업데이트
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "유효하지 않은 리프레시 토큰입니다." });
    }
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};
