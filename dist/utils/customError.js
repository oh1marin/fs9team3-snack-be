"use strict";
// src/utils/customError.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.NotFoundError = exports.UnauthorizedError = exports.BadRequestError = exports.CustomError = void 0;
class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, CustomError.prototype);
    }
}
exports.CustomError = CustomError;
class BadRequestError extends CustomError {
    constructor(message = "잘못된 요청입니다.") {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends CustomError {
    constructor(message = "인증이 필요합니다.") {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class NotFoundError extends CustomError {
    constructor(message = "리소스를 찾을 수 없습니다.") {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends CustomError {
    constructor(message = "이미 존재하는 리소스입니다.") {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
