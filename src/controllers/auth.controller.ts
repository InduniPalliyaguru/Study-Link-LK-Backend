import { Request, Response } from "express"
import {
  registerUser,
  loginUser,
  getMe,
  refreshAccessToken,
} from "../services/auth.service"
import { AuthRequest } from "../middleware/auth.middleware"
import { sendSuccess } from "../utils/response"

export const register = async (req: Request, res: Response) => {
  const data = await registerUser(req.body)
  sendSuccess(res, 201, "Registered successfully", data)
}

export const login = async (req: Request, res: Response) => {
  const data = await loginUser(req.body)
  sendSuccess(res, 200, "Login successful", data)
}

export const refresh = async (req: Request, res: Response) => {
  const data = await refreshAccessToken(req.body.refreshToken)
  sendSuccess(res, 200, "Token refreshed", data)
}

export const me = async (req: AuthRequest, res: Response) => {
  const data = await getMe(req.user!.id)
  sendSuccess(res, 200, "Profile fetched", data)
}
