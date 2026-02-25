import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  authMiddleware,
  optionalAuthMiddleware,
  AuthRequest,
} from "./authMiddleware";

jest.mock("jsonwebtoken");

const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe("authMiddleware", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      headers: {},
      cookies: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  test("Authorization 헤더(Bearer)의 유효한 토큰이 있으면 req.user를 설정하고 next()를 호출한다", () => {
    const decodedPayload = { userId: "user-123", email: "test@example.com" };
    mockReq.headers = { authorization: "Bearer valid-token" };
    mockedJwt.verify.mockReturnValue(decodedPayload as never);

    authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockedJwt.verify).toHaveBeenCalledWith(
      "valid-token",
      expect.any(String),
    );
    expect(mockReq.user).toEqual({
      id: "user-123",
      email: "test@example.com",
    });
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test("헤더에 토큰이 없고 쿠키에 accessToken이 있으면 해당 토큰으로 검증한다", () => {
    const decodedPayload = { userId: "user-456", email: "cookie@example.com" };
    mockReq.cookies = { accessToken: "cookie-token" };
    mockedJwt.verify.mockReturnValue(decodedPayload as never);

    authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockedJwt.verify).toHaveBeenCalledWith(
      "cookie-token",
      expect.any(String),
    );
    expect(mockReq.user).toEqual({
      id: "user-456",
      email: "cookie@example.com",
    });
    expect(mockNext).toHaveBeenCalled();
  });

  test("Authorization 헤더와 쿠키 모두에 토큰이 있으면 헤더의 토큰을 우선 사용한다", () => {
    mockReq.headers = { authorization: "Bearer header-token" };
    mockReq.cookies = { accessToken: "cookie-token" };
    mockedJwt.verify.mockReturnValue({
      userId: "header-user",
      email: "header@example.com",
    } as never);

    authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockedJwt.verify).toHaveBeenCalledWith(
      "header-token",
      expect.any(String),
    );
    expect(mockReq.user?.id).toBe("header-user");
  });

  test("토큰이 없으면 401과 '인증 토큰이 없습니다.' 메시지를 반환한다", () => {
    authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "인증 토큰이 없습니다.",
    });
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockedJwt.verify).not.toHaveBeenCalled();
  });

  test("유효하지 않은 토큰이면 401과 '유효하지 않은 토큰입니다.' 메시지를 반환한다", () => {
    mockReq.headers = { authorization: "Bearer invalid-token" };
    mockedJwt.verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "유효하지 않은 토큰입니다.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("Authorization 헤더에 'Bearer ' 없이 토큰만 있으면 토큰을 찾지 못한다", () => {
    mockReq.headers = { authorization: "some-other-format" };
    authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockedJwt.verify).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "인증 토큰이 없습니다.",
    });
  });
});

describe("optionalAuthMiddleware", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      headers: {},
      cookies: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  test("유효한 토큰이 있으면 req.user를 설정하고 next()를 호출한다", () => {
    const decodedPayload = { userId: "user-789", email: "opt@example.com" };
    mockReq.headers = { authorization: "Bearer valid-token" };
    mockedJwt.verify.mockReturnValue(decodedPayload as never);

    optionalAuthMiddleware(
      mockReq as AuthRequest,
      mockRes as Response,
      mockNext,
    );

    expect(mockReq.user).toEqual({
      id: "user-789",
      email: "opt@example.com",
    });
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test("토큰이 없어도 next()를 호출한다", () => {
    optionalAuthMiddleware(
      mockReq as AuthRequest,
      mockRes as Response,
      mockNext,
    );

    expect(mockReq.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockedJwt.verify).not.toHaveBeenCalled();
  });

  test("유효하지 않은 토큰이어도 next()를 호출한다 (통과)", () => {
    mockReq.headers = { authorization: "Bearer invalid-token" };
    mockedJwt.verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    optionalAuthMiddleware(
      mockReq as AuthRequest,
      mockRes as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockReq.user).toBeUndefined();
  });
});
