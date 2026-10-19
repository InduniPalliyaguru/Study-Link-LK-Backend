import { Request, Response } from "express"
import * as userService from "../services/user.service"
import { sendSuccess } from "../utils/response"

export const publicProfile = async (req: Request, res: Response) => {
  const data = await userService.getPublicProfile(String(req.params.id))
  sendSuccess(res, 200, "Profile fetched", data)
}
