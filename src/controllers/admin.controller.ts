import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import * as adminService from "../services/admin.service"
import {
  adminListingQuerySchema,
  adminUserQuerySchema,
  adminRequestQuerySchema,
} from "../validators/admin.validator"
import { sendSuccess } from "../utils/response"

export const getListings = async (req: AuthRequest, res: Response) => {
  const query = adminListingQuerySchema.parse(req.query)
  const { items, meta } = await adminService.listListingsForAdmin(query)
  sendSuccess(res, 200, "Listings fetched", items, meta)
}

export const approve = async (req: AuthRequest, res: Response) => {
  const data = await adminService.approveListing(String(req.params.id))
  sendSuccess(res, 200, "Listing approved", data)
}

export const reject = async (req: AuthRequest, res: Response) => {
  const data = await adminService.rejectListing(
    String(req.params.id),
    req.body.reason,
  )
  sendSuccess(res, 200, "Listing rejected", data)
}

export const getUsers = async (req: AuthRequest, res: Response) => {
  const query = adminUserQuerySchema.parse(req.query)
  const { items, meta } = await adminService.listUsers(query)
  sendSuccess(res, 200, "Users fetched", items, meta)
}

export const blockUser = async (req: AuthRequest, res: Response) => {
  const data = await adminService.setUserBlocked(
    req.user!.id,
    String(req.params.id),
    req.body.blocked,
  )
  sendSuccess(
    res,
    200,
    req.body.blocked ? "User blocked" : "User unblocked",
    data,
  )
}

export const removeUser = async (req: AuthRequest, res: Response) => {
  await adminService.deleteUser(req.user!.id, String(req.params.id))
  sendSuccess(res, 200, "User deleted")
}

export const getRequests = async (req: AuthRequest, res: Response) => {
  const query = adminRequestQuerySchema.parse(req.query)
  const { items, meta } = await adminService.listRequestsForAdmin(query)
  sendSuccess(res, 200, "Requests fetched", items, meta)
}

export const getStats = async (_req: AuthRequest, res: Response) => {
  const data = await adminService.getDashboardStats()
  sendSuccess(res, 200, "Statistics fetched", data)
}
