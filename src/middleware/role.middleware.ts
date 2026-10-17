import { NextFunction, Response } from "express"
import { UserRole } from "../models/user.model"
import { AuthRequest } from "./auth.middleware"

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      })
      return
    }

    next()
  }
}
