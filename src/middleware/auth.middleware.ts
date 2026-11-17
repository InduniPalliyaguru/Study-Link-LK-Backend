import { Request, Response, NextFunction } from "express"
import { verifyAccessToken } from "../utils/token"
import { User, UserRole } from "../models/user.model"
import { ApiError } from "../utils/ApiError"

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: UserRole
  }
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization

  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication token is missing")
  }

  const token = header.split(" ")[1]

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    throw new ApiError(401, "Invalid or expired token")
  }

  const user = await User.findById(payload.sub)
  if (!user) {
    throw new ApiError(401, "User no longer exists")
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked")
  }

  if (
    user.passwordChangedAt &&
    payload.iat &&
    payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
  ) {
    throw new ApiError(401, "Your password was changed. Please log in again")
  }

  req.user = { id: user._id.toString(), role: user.role }
  next()
}
