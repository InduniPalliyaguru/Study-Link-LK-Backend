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
import { uploadImages, removeImages } from "./storage.service"
import {
  CreateListingInput,
  UpdateListingInput,
  ListingQuery,
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
  files: Express.Multer.File[],
) => {
  if (files.length === 0) {
    throw new ApiError(400, "At least one image is required")
  }

  await ensureCatalogExists(input.subject, input.gradeLevel)

  const images = await uploadImages(files)

  try {
    return await Listing.create({
      title: input.title,
      description: input.description,
      price: input.price,
      condition: input.condition as ListingCondition,
      district: input.district,
      deliveryOptions: input.deliveryOptions as DeliveryOption | undefined,
      images,
      seller: new Types.ObjectId(sellerId),
      subject: new Types.ObjectId(input.subject),
      gradeLevel: new Types.ObjectId(input.gradeLevel),
      status: ListingStatus.PENDING,
    })
  } catch (err) {
    await removeImages(images)
    throw err
  }
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
  files: Express.Multer.File[] = [],
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

  if (Object.keys(input).length === 0 && files.length === 0) {
    throw new ApiError(422, "Provide at least one field or image to update")
  }

  await ensureCatalogExists(input.subject, input.gradeLevel)

  const { subject, gradeLevel, condition, deliveryOptions, ...rest } = input
  Object.assign(listing, rest)

  if (subject) listing.subject = new Types.ObjectId(subject)
  if (gradeLevel) listing.gradeLevel = new Types.ObjectId(gradeLevel)
  if (condition) listing.condition = condition as ListingCondition
  if (deliveryOptions)
    listing.deliveryOptions = deliveryOptions as DeliveryOption

  const oldImages = [...listing.images]
  let newImages: string[] = []

  if (files.length > 0) {
    newImages = await uploadImages(files)
    listing.images = newImages
  }

  listing.status = ListingStatus.PENDING

  try {
    await listing.save()
  } catch (err) {
    await removeImages(newImages)
    throw err
  }

  if (newImages.length > 0) {
    await removeImages(oldImages)
  }

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

const sortOptions = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: -1 },
} as const

export const searchListings = async (query: ListingQuery) => {
  const {
    q,
    subject,
    gradeLevel,
    condition,
    district,
    minPrice,
    maxPrice,
    free,
    sort,
    page,
    limit,
  } = query

  const filter: Record<string, any> = { status: ListingStatus.AVAILABLE }

  if (q) filter.$text = { $search: q }
  if (subject) filter.subject = subject
  if (gradeLevel) filter.gradeLevel = gradeLevel
  if (condition) filter.condition = condition
  if (district)
    filter.district = new RegExp(
      `^${district.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    )

  if (free === "true") {
    filter.price = 0
  } else if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {
      ...(minPrice !== undefined && { $gte: minPrice }),
      ...(maxPrice !== undefined && { $lte: maxPrice }),
    }
  }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Listing.find(filter)
      .select(
        "title price condition district images deliveryOptions subject gradeLevel seller createdAt",
      )
      .populate([
        { path: "subject", select: "name colorKey" },
        { path: "gradeLevel", select: "name" },
        { path: "seller", select: "name district" },
      ])
      .sort(sortOptions[sort])
      .skip(skip)
      .limit(limit)
      .lean(),
    Listing.countDocuments(filter),
  ])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return {
    items,
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
