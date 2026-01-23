// src/utils/customError.ts

export class CustomError extends Error {
    statusCode: number;
  
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      this.name = this.constructor.name;
      Object.setPrototypeOf(this, CustomError.prototype);
    }
  }
  
  export class BadRequestError extends CustomError {
    constructor(message: string = "잘못된 요청입니다.") {
      super(message, 400);
    }
  }
  
  export class UnauthorizedError extends CustomError {
    constructor(message: string = "인증이 필요합니다.") {
      super(message, 401);
    }
  }
  
  export class NotFoundError extends CustomError {
    constructor(message: string = "리소스를 찾을 수 없습니다.") {
      super(message, 404);
    }
  }
  
  export class ConflictError extends CustomError {
    constructor(message: string = "이미 존재하는 리소스입니다.") {
      super(message, 409);
    }
  }