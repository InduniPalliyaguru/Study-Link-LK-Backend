import { Request, Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import * as reviewService from "../services/review.service"
import { reviewQuerySchema } from "../validators/review.validator"
import { sendSuccess } from "../utils/response"

export const create = async (req: AuthRequest, res: Response) => {
  const data = await reviewService.createReview(req.user!.id, req.body)
  sendSuccess(res, 201, "Review submitted", data)
}

export const getForUser = async (req: Request, res: Response) => {
  const query = reviewQuerySchema.parse(req.query)
  const { items, summary, meta } = await reviewService.getReviewsForUser(
    String(req.params.id),
    query,
  )
  sendSuccess(res, 200, "Reviews fetched", { reviews: items, summary }, meta)
}
