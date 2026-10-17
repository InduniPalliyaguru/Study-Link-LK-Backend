import { Request, Response, NextFunction } from "express"
import { verifyAccessToken } from "../utils/token"
import { User, UserRole } from "../models/user.model"

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: UserRole
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization

  if (!header || !header.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ success: false, message: "Authentication token is missing" })
    return
  }

  const token = header.split(" ")[1]

  try {
    const payload = verifyAccessToken(token)

    const user = await User.findById(payload.sub)
    if (!user) {
      res.status(401).json({ success: false, message: "User no longer exists" })
      return
    }

    if (user.isBlocked) {
      res
        .status(403)
        .json({ success: false, message: "Your account has been blocked" })
      return
    }

    req.user = { id: user._id.toString(), role: user.role }
    next()
  } catch {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" })
  }
}
