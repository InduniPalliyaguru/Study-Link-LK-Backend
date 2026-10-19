import { SavedListing } from "../models/savedListing.model"
import { Listing, ListingStatus } from "../models/listing.model"
import { ApiError } from "../utils/ApiError"

const SAVEABLE = [ListingStatus.AVAILABLE, ListingStatus.RESERVED]
const VISIBLE = [
  ListingStatus.AVAILABLE,
  ListingStatus.RESERVED,
  ListingStatus.SOLD,
]

export const saveListing = async (userId: string, listingId: string) => {
  const listing = await Listing.findOne({
    _id: listingId,
    status: { $in: SAVEABLE },
  })

  if (!listing) {
    throw new ApiError(404, "Listing not found")
  }

  if (listing.seller.toString() === userId) {
    throw new ApiError(400, "You cannot save your own listing")
  }

  try {
    await SavedListing.updateOne(
      { user: userId, listing: listing._id },
      { $setOnInsert: { user: userId, listing: listing._id } },
      { upsert: true },
    )
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) {
      throw err
    }
  }
}

export const unsaveListing = async (userId: string, listingId: string) => {
  await SavedListing.deleteOne({ user: userId, listing: listingId })
}

export const getSavedListings = async (userId: string) => {
  const items = await SavedListing.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate({
      path: "listing",
      select:
        "title price condition district images status subject gradeLevel seller createdAt",
      match: { status: { $in: VISIBLE } },
      populate: [
        { path: "subject", select: "name colorKey" },
        { path: "gradeLevel", select: "name" },
        { path: "seller", select: "name district" },
      ],
    })
    .lean()

  return items
    .filter((item) => item.listing)
    .map((item) => ({ savedAt: item.createdAt, listing: item.listing }))
}

export const getSavedIds = async (userId: string) => {
  const rows = await SavedListing.find({ user: userId })
    .select("listing")
    .lean()
  return rows.map((row) => row.listing.toString())
}
