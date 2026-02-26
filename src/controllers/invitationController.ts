import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { AuthRequest } from "../middleware/authMiddleware";
import prisma from "../utils/prisma";
import { sendInvitationEmail } from "../utils/emailService";
import { BadRequestError, ConflictError } from "../utils/customError";

const INVITATION_EXPIRES_DAYS = 7;

/**
 * POST /api/super-admin/invitations
 * 최고관리자: 이메일로 가입 초대 링크 발송
 * body: { email: string }
 */
export const sendInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;
    const authReq = req as AuthRequest;
    const creatorId = authReq.user?.id;

    if (!creatorId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    if (!email || typeof email !== "string") {
      throw new BadRequestError("이메일을 입력해주세요.");
    }

    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      throw new BadRequestError("올바른 이메일 형식이 아닙니다.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: emailTrimmed },
    });
    if (existingUser) {
      throw new ConflictError("이미 가입된 이메일입니다.");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRES_DAYS);

    await prisma.invitation.create({
      data: {
        email: emailTrimmed,
        token,
        expires_at: expiresAt,
        created_by: creatorId,
      },
    });

    try {
      await sendInvitationEmail(emailTrimmed, token);
    } catch (emailError) {
      const err = emailError as Error;
      console.error("[초대 이메일 발송 실패]", err.message, err);
      return res.status(502).json({
        success: false,
        message: "이메일 발송에 실패했습니다. SMTP 설정을 확인해주세요.",
        ...(process.env.NODE_ENV !== "production" && err?.message
          ? { error: err.message }
          : {}),
      });
    }

    res.status(201).json({
      success: true,
      message: "초대 이메일을 발송했습니다.",
      email: emailTrimmed,
    });
  } catch (error) {
    next(error);
  }
};
