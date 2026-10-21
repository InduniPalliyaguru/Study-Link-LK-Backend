import { Request, Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import * as userService from "../services/user.service"
import { sendSuccess } from "../utils/response"

export const publicProfile = async (req: Request, res: Response) => {
  const data = await userService.getPublicProfile(String(req.params.id))
  sendSuccess(res, 200, "Profile fetched", data)
}

export const updateMe = async (req: AuthRequest, res: Response) => {
  const data = await userService.updateProfile(req.user!.id, req.body)
  sendSuccess(res, 200, "Profile updated", data)
}

export const changeMyPassword = async (req: AuthRequest, res: Response) => {
  await userService.changePassword(req.user!.id, req.body)
  sendSuccess(res, 200, "Password changed successfully")
}
