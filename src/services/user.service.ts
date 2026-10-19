import { User } from "../models/user.model"
import { Listing, ListingStatus } from "../models/listing.model"
import { ApiError } from "../utils/ApiError"
import { getRatingSummary } from "./review.service"

// only safe, public information (no email, phone or role)
export const getPublicProfile = async (userId: string) => {
  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const [booksSold, rating] = await Promise.all([
    Listing.countDocuments({ seller: user._id, status: ListingStatus.SOLD }),
    getRatingSummary(userId),
  ])

  return {
    id: user._id,
    name: user.name,
    district: user.district,
    joinedAt: user.createdAt,
    booksSold,
    rating,
  }
}
