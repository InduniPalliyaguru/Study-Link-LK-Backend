import { Response } from "express"

export const sendSuccess = <T>(
  res: Response,
  status: number,
  message: string,
  data?: T,
) => {
  res.status(status).json({ success: true, message, data })
}
