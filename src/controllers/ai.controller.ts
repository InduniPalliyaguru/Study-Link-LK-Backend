import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import { assistListing } from "../services/ai.service"
import { sendSuccess } from "../utils/response"

export const listingAssist = async (req: AuthRequest, res: Response) => {
  const data = await assistListing(req.body)
  sendSuccess(res, 200, "Listing draft ready", data)
}
