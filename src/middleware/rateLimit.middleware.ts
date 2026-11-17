import { Request, Response, NextFunction } from "express"
import { AuthRequest } from "./auth.middleware"
import { ApiError } from "../utils/ApiError"

const hits = new Map<string, number[]>()

export const limitPerUser = (
  max: number,
  windowMs: number,
  message: string,
) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const key = req.user!.id
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)

    if (recent.length >= max) {
      throw new ApiError(429, message)
    }

    recent.push(now)
    hits.set(key, recent)
    next()
  }
}

export const limitByEmail = (
  max: number,
  windowMs: number,
  message: string,
) => {
  const attempts = new Map<string, number[]>()

  return (req: Request, _res: Response, next: NextFunction) => {
    const key = String(req.body?.email ?? "").toLowerCase()
    const now = Date.now()
    const recent = (attempts.get(key) ?? []).filter(
      (time) => now - time < windowMs,
    )

    if (recent.length >= max) {
      throw new ApiError(429, message)
    }

    recent.push(now)
    attempts.set(key, recent)
    next()
  }
}
