import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import { assistListing, scanCover } from "../services/ai.service"
import { ApiError } from "../utils/ApiError"
import { sendSuccess } from "../utils/response"

export const listingAssist = async (req: AuthRequest, res: Response) => {
  const data = await assistListing(req.body)
  sendSuccess(res, 200, "Listing draft ready", data)
}

export const coverScan = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, "Please choose a photo of the book cover")
  }

  const data = await scanCover(req.file)
  sendSuccess(res, 200, "Cover scanned", data)
}
