import { Request, Response } from "express"
import * as meetupService from "../services/meetup.service"
import { meetupQuerySchema } from "../validators/meetup.validator"
import { sendSuccess } from "../utils/response"

// public
export const getPoints = async (req: Request, res: Response) => {
  const { district } = meetupQuerySchema.parse(req.query)
  const data = await meetupService.listMeetupPoints(district)
  sendSuccess(res, 200, "Meet-up points fetched", data)
}

// admin
export const adminGetPoints = async (req: Request, res: Response) => {
  const { district } = meetupQuerySchema.parse(req.query)
  const data = await meetupService.listMeetupPoints(district, true)
  sendSuccess(res, 200, "Meet-up points fetched", data)
}

export const adminCreatePoint = async (req: Request, res: Response) => {
  const data = await meetupService.createMeetupPoint(req.body)
  sendSuccess(res, 201, "Meet-up point created", data)
}

export const adminUpdatePoint = async (req: Request, res: Response) => {
  const data = await meetupService.updateMeetupPoint(
    String(req.params.id),
    req.body,
  )
  sendSuccess(res, 200, "Meet-up point updated", data)
}

export const adminDeactivatePoint = async (req: Request, res: Response) => {
  const data = await meetupService.deactivateMeetupPoint(String(req.params.id))
  sendSuccess(res, 200, "Meet-up point deactivated", data)
}
