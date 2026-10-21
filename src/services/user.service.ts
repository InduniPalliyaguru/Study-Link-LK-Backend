import bcrypt from "bcryptjs"
import { User, EducationLevel } from "../models/user.model"
import { Listing, ListingStatus } from "../models/listing.model"
import { ApiError } from "../utils/ApiError"
import { getRatingSummary } from "./review.service"
import { getMe } from "./auth.service"
import {
  UpdateProfileInput,
  ChangePasswordInput,
} from "../validators/user.validator"

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

export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput,
) => {
  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  if (input.name !== undefined) user.name = input.name
  if (input.district !== undefined) user.district = input.district
  if (input.phone !== undefined) user.phone = input.phone || undefined
  if (input.institution !== undefined)
    user.institution = input.institution || undefined
  if (input.educationLevel !== undefined)
    user.educationLevel = input.educationLevel as EducationLevel

  await user.save()

  return getMe(userId)
}

export const changePassword = async (
  userId: string,
  input: ChangePasswordInput,
) => {
  const user = await User.findById(userId).select("+password")

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const matches = await bcrypt.compare(input.currentPassword, user.password)

  if (!matches) {
    throw new ApiError(400, "Current password is incorrect")
  }

  user.password = await bcrypt.hash(input.newPassword, 10)
  await user.save()
}
