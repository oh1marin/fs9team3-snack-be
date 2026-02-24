// 인증 관련 타입 정의

export interface User {
  id: string;
  email: string;
  nickname?: string;
  create_at?: Date;
  updated_at?: Date;
}

export interface SignupRequest {
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    nickname: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  nickname: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface LogoutResponse {
  success: boolean;
}
