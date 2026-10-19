import { Types } from "mongoose"
import { Review } from "../models/review.model"
import { PurchaseRequest, RequestStatus } from "../models/request.model"
import { User } from "../models/user.model"
import { ApiError } from "../utils/ApiError"
import { CreateReviewInput, ReviewQuery } from "../validators/review.validator"

export const getRatingSummary = async (userId: string) => {
  const [result] = await Review.aggregate<{ average: number; count: number }>([
    { $match: { reviewee: new Types.ObjectId(userId) } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ])

  return {
    average: result ? Math.round(result.average * 10) / 10 : 0,
    count: result ? result.count : 0,
  }
}

export const createReview = async (
  buyerId: string,
  input: CreateReviewInput,
) => {
  const request = await PurchaseRequest.findById(input.request)

  if (!request) {
    throw new ApiError(404, "Request not found")
  }

  if (request.buyer.toString() !== buyerId) {
    throw new ApiError(403, "You can only review your own purchases")
  }

  if (request.status !== RequestStatus.COMPLETED) {
    throw new ApiError(
      409,
      "You can review the seller only after the request is completed",
    )
  }

  const existing = await Review.exists({ request: request._id })
  if (existing) {
    throw new ApiError(409, "You have already reviewed this purchase")
  }

  try {
    return await Review.create({
      request: request._id,
      reviewer: request.buyer,
      reviewee: request.seller,
      rating: input.rating,
      comment: input.comment,
      verified: request.verified,
    })
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new ApiError(409, "You have already reviewed this purchase")
    }
    throw err
  }
}

export const getReviewsForUser = async (userId: string, query: ReviewQuery) => {
  const { page, limit } = query

  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const [items, total, summary] = await Promise.all([
    Review.find({ reviewee: userId })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "reviewer", select: "name" })
      .select("rating comment verified createdAt reviewer")
      .lean(),
    Review.countDocuments({ reviewee: userId }),
    getRatingSummary(userId),
  ])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return {
    items,
    summary,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}
