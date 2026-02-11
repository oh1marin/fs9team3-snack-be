import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "./authMiddleware";

const prisma = new PrismaClient();

/** 로그인 사용자가 관리자(is_admin === 'Y')인지 확인. authMiddleware 다음에 사용 */
export const adminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { is_admin: true },
    });
    if (!user || user.is_admin !== "Y") {
      return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "권한 확인에 실패했습니다." });
  }
};
