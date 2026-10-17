import { Response, NextFunction } from "express"
import { AuthRequest } from "./auth.middleware"
import { UserRole } from "../models/user.model"
import { ApiError } from "../utils/ApiError"

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required")
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action")
    }

    next()
  }
}