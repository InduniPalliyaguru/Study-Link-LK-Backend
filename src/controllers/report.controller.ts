import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import * as reportService from "../services/report.service"
import { adminReportQuerySchema } from "../validators/report.validator"
import { sendSuccess } from "../utils/response"

export const create = async (req: AuthRequest, res: Response) => {
  const data = await reportService.createReport(req.user!.id, req.body)
  sendSuccess(
    res,
    201,
    "Report submitted. Thank you for helping us keep StudyLink safe",
    data,
  )
}

export const adminGetReports = async (req: AuthRequest, res: Response) => {
  const query = adminReportQuerySchema.parse(req.query)
  const { items, meta } = await reportService.listReportsForAdmin(query)
  sendSuccess(res, 200, "Reports fetched", items, meta)
}

export const adminResolveReport = async (req: AuthRequest, res: Response) => {
  const data = await reportService.resolveReport(
    req.user!.id,
    String(req.params.id),
    req.body.action,
  )
  sendSuccess(res, 200, "Report resolved", data)
}
