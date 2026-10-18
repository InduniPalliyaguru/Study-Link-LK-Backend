import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import * as requestService from "../services/request.service"
import { sendSuccess } from "../utils/response"

export const create = async (req: AuthRequest, res: Response) => {
  const data = await requestService.createRequest(req.user!.id, req.body)
  sendSuccess(res, 201, "Request sent to the seller", data)
}

export const sent = async (req: AuthRequest, res: Response) => {
  const data = await requestService.getSentRequests(req.user!.id)
  sendSuccess(res, 200, "Sent requests fetched", data)
}

export const received = async (req: AuthRequest, res: Response) => {
  const data = await requestService.getReceivedRequests(req.user!.id)
  sendSuccess(res, 200, "Received requests fetched", data)
}

export const respond = async (req: AuthRequest, res: Response) => {
  const data = await requestService.respondToRequest(
    req.user!.id,
    String(req.params.id),
    req.body.decision,
  )
  const message =
    req.body.decision === "accept" ? "Request accepted" : "Request rejected"
  sendSuccess(res, 200, message, data)
}

export const cancel = async (req: AuthRequest, res: Response) => {
  const data = await requestService.cancelRequest(
    req.user!.id,
    String(req.params.id),
  )
  sendSuccess(res, 200, "Request cancelled", data)
}
