import { Response } from "express"

export const sendSuccess = <T, M = undefined>(
  res: Response,
  status: number,
  message: string,
  data?: T,
  meta?: M,
) => {
  res.status(status).json({ success: true, message, data, meta })
}
