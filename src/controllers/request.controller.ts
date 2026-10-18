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
  const { request, handoverCode } = await requestService.respondToRequest(
    req.user!.id,
    String(req.params.id),
    req.body.decision,
  )
  const message =
    req.body.decision === "accept" ? "Request accepted" : "Request rejected"
  sendSuccess(res, 200, message, { ...request, handoverCode })
}

export const cancel = async (req: AuthRequest, res: Response) => {
  const data = await requestService.cancelRequest(
    req.user!.id,
    String(req.params.id),
  )
  sendSuccess(res, 200, "Request cancelled", data)
}

export const ship = async (req: AuthRequest, res: Response) => {
  const data = await requestService.shipRequest(
    req.user!.id,
    String(req.params.id),
    req.body.trackingNumber,
  )
  sendSuccess(res, 200, "Request marked as shipped", data)
}

export const confirm = async (req: AuthRequest, res: Response) => {
  const data = await requestService.confirmReceived(
    req.user!.id,
    String(req.params.id),
    req.body.code,
  )
  sendSuccess(res, 200, "Receipt confirmed. The book is now sold", data)
}

export const regenerate = async (req: AuthRequest, res: Response) => {
  const { request, handoverCode } = await requestService.regenerateCode(
    req.user!.id,
    String(req.params.id),
  )
  sendSuccess(res, 200, "New handover code generated", {
    ...request,
    handoverCode,
  })
}

export const completeManual = async (req: AuthRequest, res: Response) => {
  const data = await requestService.completeManually(
    req.user!.id,
    String(req.params.id),
  )
  sendSuccess(res, 200, "Request completed (unverified)", data)
}
