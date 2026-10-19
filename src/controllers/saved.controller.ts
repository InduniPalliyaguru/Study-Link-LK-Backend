import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import * as savedService from "../services/saved.service"
import { sendSuccess } from "../utils/response"

export const save = async (req: AuthRequest, res: Response) => {
  await savedService.saveListing(req.user!.id, String(req.params.listingId))
  sendSuccess(res, 200, "Listing saved")
}

export const unsave = async (req: AuthRequest, res: Response) => {
  await savedService.unsaveListing(req.user!.id, String(req.params.listingId))
  sendSuccess(res, 200, "Listing removed from saved")
}

export const list = async (req: AuthRequest, res: Response) => {
  const data = await savedService.getSavedListings(req.user!.id)
  sendSuccess(res, 200, "Saved listings fetched", data)
}

export const ids = async (req: AuthRequest, res: Response) => {
  const data = await savedService.getSavedIds(req.user!.id)
  sendSuccess(res, 200, "Saved listing ids fetched", data)
}
