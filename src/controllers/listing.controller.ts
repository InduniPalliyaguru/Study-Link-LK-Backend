import { Request, Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import * as listingService from "../services/listing.service"
import { sendSuccess } from "../utils/response"
import { listingQuerySchema } from "../validators/listing.validator"

const getFiles = (req: AuthRequest): Express.Multer.File[] => {
  return (req.files as Express.Multer.File[] | undefined) ?? []
}

export const create = async (req: AuthRequest, res: Response) => {
  const data = await listingService.createListing(
    req.user!.id,
    req.body,
    getFiles(req),
  )
  sendSuccess(res, 201, "Listing submitted for approval", data)
}

export const getMine = async (req: AuthRequest, res: Response) => {
  const data = await listingService.getMyListings(req.user!.id)
  sendSuccess(res, 200, "Your listings fetched", data)
}

export const getOne = async (req: Request, res: Response) => {
  const data = await listingService.getPublicListingById(String(req.params.id))
  sendSuccess(res, 200, "Listing fetched", data)
}

export const update = async (req: AuthRequest, res: Response) => {
  const data = await listingService.updateListing(
    String(req.params.id),
    req.user!.id,
    req.body,
    getFiles(req),
  )
  sendSuccess(res, 200, "Listing updated and sent for approval", data)
}

export const remove = async (req: AuthRequest, res: Response) => {
  await listingService.deleteListing(
    String(req.params.id),
    req.user!.id,
    req.user!.role,
  )
  sendSuccess(res, 200, "Listing deleted")
}

export const search = async (req: Request, res: Response) => {
  const query = listingQuerySchema.parse(req.query)
  const { items, meta } = await listingService.searchListings(query)
  sendSuccess(res, 200, "Listings fetched", items, meta)
}
