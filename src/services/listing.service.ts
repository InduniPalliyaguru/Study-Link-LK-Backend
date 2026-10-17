import { Types } from "mongoose"
import {
  Listing,
  ListingCondition,
  ListingStatus,
  DeliveryOption,
} from "../models/listing.model"
import { Subject } from "../models/subject.model"
import { GradeLevel } from "../models/gradeLevel.model"
import { UserRole } from "../models/user.model"
import { ApiError } from "../utils/ApiError"
import {
  CreateListingInput,
  UpdateListingInput,
} from "../validators/listing.validator"

const PUBLIC_STATUSES = [
  ListingStatus.AVAILABLE,
  ListingStatus.RESERVED,
  ListingStatus.SOLD,
]

const publicPopulate = [
  { path: "subject", select: "name colorKey" },
  { path: "gradeLevel", select: "name" },
  { path: "seller", select: "name district createdAt" },
]

const ownerPopulate = [
  { path: "subject", select: "name colorKey" },
  { path: "gradeLevel", select: "name" },
]

const ensureCatalogExists = async (
  subjectId?: string,
  gradeLevelId?: string,
) => {
  if (subjectId) {
    const subject = await Subject.findOne({ _id: subjectId, isActive: true })
    if (!subject) {
      throw new ApiError(400, "Selected subject does not exist")
    }
  }

  if (gradeLevelId) {
    const gradeLevel = await GradeLevel.findOne({
      _id: gradeLevelId,
      isActive: true,
    })
    if (!gradeLevel) {
      throw new ApiError(400, "Selected grade level does not exist")
    }
  }
}

export const createListing = async (
  sellerId: string,
  input: CreateListingInput,
) => {
  await ensureCatalogExists(input.subject, input.gradeLevel)

  return Listing.create({
    title: input.title,
    description: input.description,
    price: input.price,
    condition: input.condition as ListingCondition,
    district: input.district,
    deliveryOptions: input.deliveryOptions as DeliveryOption | undefined,
    seller: new Types.ObjectId(sellerId),
    subject: new Types.ObjectId(input.subject),
    gradeLevel: new Types.ObjectId(input.gradeLevel),
    status: ListingStatus.PENDING,
  })
}

export const getMyListings = (sellerId: string) => {
  return Listing.find({ seller: sellerId })
    .sort({ createdAt: -1 })
    .populate(ownerPopulate)
}

export const getPublicListingById = async (id: string) => {
  const listing = await Listing.findOne({
    _id: id,
    status: { $in: PUBLIC_STATUSES },
  }).populate(publicPopulate)

  if (!listing) {
    throw new ApiError(404, "Listing not found")
  }

  return listing
}

export const updateListing = async (
  id: string,
  userId: string,
  input: UpdateListingInput,
) => {
  const listing = await Listing.findById(id)

  if (!listing) {
    throw new ApiError(404, "Listing not found")
  }

  if (listing.seller.toString() !== userId) {
    throw new ApiError(403, "You can only edit your own listings")
  }

  if (
    listing.status !== ListingStatus.PENDING &&
    listing.status !== ListingStatus.AVAILABLE
  ) {
    throw new ApiError(409, "A reserved or sold listing cannot be edited")
  }

  await ensureCatalogExists(input.subject, input.gradeLevel)

  const { subject, gradeLevel, condition, deliveryOptions, ...rest } = input
  Object.assign(listing, rest)

  if (subject) listing.subject = new Types.ObjectId(subject)
  if (gradeLevel) listing.gradeLevel = new Types.ObjectId(gradeLevel)
  if (condition) listing.condition = condition as ListingCondition
  if (deliveryOptions)
    listing.deliveryOptions = deliveryOptions as DeliveryOption

  listing.status = ListingStatus.PENDING

  await listing.save()
  return listing
}

export const deleteListing = async (
  id: string,
  userId: string,
  role: UserRole,
) => {
  const listing = await Listing.findById(id)

  if (!listing) {
    throw new ApiError(404, "Listing not found")
  }

  if (role !== UserRole.ADMIN && listing.seller.toString() !== userId) {
    throw new ApiError(403, "You can only delete your own listings")
  }

  if (listing.status === ListingStatus.RESERVED) {
    throw new ApiError(
      409,
      "A reserved listing cannot be deleted. Cancel the request first",
    )
  }

  listing.isDeleted = true
  listing.deletedAt = new Date()
  listing.status = ListingStatus.REMOVED

  await listing.save()
}
