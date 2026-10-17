import jwt, { SignOptions } from "jsonwebtoken"
import { UserRole } from "../models/user.model"

export interface TokenPayload {
  sub: string
  role: UserRole
}

const getSecret = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is missing in the .env file`)
  }
  return value
}

export const signAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getSecret("JWT_ACCESS_SECRET"), {
    expiresIn: (process.env.ACCESS_TOKEN_EXPIRES ||
      "15m") as SignOptions["expiresIn"],
  })
}

export const signRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getSecret("JWT_REFRESH_SECRET"), {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRES ||
      "7d") as SignOptions["expiresIn"],
  })
}
