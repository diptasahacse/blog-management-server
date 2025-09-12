import { Request } from 'express';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
