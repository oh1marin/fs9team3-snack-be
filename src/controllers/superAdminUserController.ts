import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import prisma from "../utils/prisma";
import { BadRequestError, NotFoundError } from "../utils/customError";

/** 응답용 유저 필드 (비밀번호 제외) */
const userSelect = {
  id: true,
  email: true,
  is_admin: true,
  is_super_admin: true,
  create_at: true,
  updated_at: true,
};

/**
 * GET /api/super-admin/users
 * 최고관리자: 전체 유저 목록 (등급 포함, 비밀번호 제외)
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { create_at: "desc" },
    });

    res.status(200).json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    next(error);
  }
};

/** body 값을 "Y" | "N"으로 정규화 (boolean, "true"/"false" 허용) */
function toYN(value: unknown): "Y" | "N" | null {
  if (value === "Y" || value === "N") return value;
  if (value === true || value === "true") return "Y";
  if (value === false || value === "false") return "N";
  return null;
}

/**
 * PATCH /api/super-admin/users/:id
 * 최고관리자: 특정 유저 등급(is_admin, is_super_admin) 수정
 * body: { is_admin?: "Y"|"N"|boolean, is_super_admin?: "Y"|"N"|boolean } (둘 다 선택)
 */
export const patchUserGrade = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const body = req.body as Record<string, unknown>;
    const isAdminRaw = body.is_admin ?? body.isAdmin;
    const isSuperAdminRaw = body.is_super_admin ?? body.isSuperAdmin;

    if (!id) {
      throw new BadRequestError("유저 ID가 필요합니다.");
    }

    const updateData: { is_admin?: string; is_super_admin?: string } = {};
    if (isAdminRaw !== undefined) {
      const v = toYN(isAdminRaw);
      if (v === null) {
        throw new BadRequestError("is_admin은 'Y', 'N', true, false 중 하나여야 합니다.");
      }
      updateData.is_admin = v;
    }
    if (isSuperAdminRaw !== undefined) {
      const v = toYN(isSuperAdminRaw);
      if (v === null) {
        throw new BadRequestError("is_super_admin은 'Y', 'N', true, false 중 하나여야 합니다.");
      }
      updateData.is_super_admin = v;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError("수정할 등급(is_admin, is_super_admin)을 하나 이상 보내주세요.");
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundError("해당 유저를 찾을 수 없습니다.");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });

    res.status(200).json({
      success: true,
      message: "등급이 수정되었습니다.",
      user: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/super-admin/users/:id
 * 최고관리자: 해당 유저 계정 탈퇴(삭제). 본인은 삭제 불가.
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const currentUserId = authReq.user?.id;

    if (!id) {
      throw new BadRequestError("유저 ID가 필요합니다.");
    }
    if (currentUserId === id) {
      throw new BadRequestError("본인 계정은 탈퇴시킬 수 없습니다.");
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundError("해당 유저를 찾을 수 없습니다.");
    }

    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "계정이 탈퇴 처리되었습니다.",
      deleted: { id: user.id, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};
