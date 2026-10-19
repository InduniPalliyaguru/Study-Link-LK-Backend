import { Types } from "mongoose"
import {
  Report,
  ReportReason,
  ReportStatus,
  ReportAction,
} from "../models/report.model"
import { Listing, IListing, ListingStatus } from "../models/listing.model"
import { PurchaseRequest, RequestStatus } from "../models/request.model"
import { ApiError } from "../utils/ApiError"
import { setUserBlocked, buildMeta } from "./admin.service"
import {
  CreateReportInput,
  ResolveAction,
  AdminReportQuery,
} from "../validators/report.validator"

const REPORTABLE = [
  ListingStatus.AVAILABLE,
  ListingStatus.RESERVED,
  ListingStatus.SOLD,
]

export const createReport = async (
  reporterId: string,
  input: CreateReportInput,
) => {
  const listing = await Listing.findOne({
    _id: input.listing,
    status: { $in: REPORTABLE },
  })

  if (!listing) {
    throw new ApiError(404, "Listing not found")
  }

  if (listing.seller.toString() === reporterId) {
    throw new ApiError(400, "You cannot report your own listing")
  }

  const alreadyReported = await Report.findOne({
    listing: listing._id,
    reporter: reporterId,
    status: ReportStatus.OPEN,
  })
  if (alreadyReported) {
    throw new ApiError(409, "You have already reported this listing")
  }

  try {
    return await Report.create({
      listing: listing._id,
      reporter: new Types.ObjectId(reporterId),
      reason: input.reason as ReportReason,
      details: input.details,
    })
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new ApiError(409, "You have already reported this listing")
    }
    throw err
  }
}

export const listReportsForAdmin = async (query: AdminReportQuery) => {
  const { status, page, limit } = query
  const filter = { status: status as ReportStatus }

  const [items, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate([
        {
          path: "listing",
          select: "title images status isDeleted seller",
          options: { withDeleted: true },
          populate: { path: "seller", select: "name email district isBlocked" },
        },
        { path: "reporter", select: "name" },
        { path: "resolvedBy", select: "name" },
      ])
      .lean(),
    Report.countDocuments(filter),
  ])

  return { items, meta: buildMeta(total, page, limit) }
}

const removeListingForModeration = async (listing: IListing) => {
  await PurchaseRequest.updateMany(
    {
      listing: listing._id,
      status: { $in: [RequestStatus.PENDING, RequestStatus.ACCEPTED] },
    },
    { $set: { status: RequestStatus.CANCELLED } },
  )

  listing.isDeleted = true
  listing.deletedAt = new Date()
  listing.status = ListingStatus.REMOVED
  await listing.save()
}

export const resolveReport = async (
  adminId: string,
  reportId: string,
  action: ResolveAction,
) => {
  const report = await Report.findById(reportId)

  if (!report) {
    throw new ApiError(404, "Report not found")
  }

  if (report.status !== ReportStatus.OPEN) {
    throw new ApiError(409, `This report is already ${report.status}`)
  }

  const now = new Date()
  const adminObjectId = new Types.ObjectId(adminId)

  if (action === "dismiss") {
    report.status = ReportStatus.DISMISSED
    report.action = ReportAction.DISMISSED
    report.resolvedBy = adminObjectId
    report.resolvedAt = now
    await report.save()
    return report
  }

  const listing = await Listing.findById(report.listing).setOptions({
    withDeleted: true,
  })

  if (!listing) {
    throw new ApiError(404, "The reported listing no longer exists")
  }

  if (!listing.isDeleted) {
    const beingShipped = await PurchaseRequest.exists({
      listing: listing._id,
      status: RequestStatus.SHIPPED,
    })
    if (beingShipped) {
      throw new ApiError(
        409,
        "A book is already being shipped for this listing",
      )
    }
  }

  if (action === "block_seller") {
    await setUserBlocked(adminId, listing.seller.toString(), true)
  }

  if (!listing.isDeleted) {
    await removeListingForModeration(listing)
  }

  const finalAction =
    action === "block_seller"
      ? ReportAction.SELLER_BLOCKED
      : ReportAction.LISTING_REMOVED

  // other open reports about the same listing are resolved with it
  await Report.updateMany(
    {
      listing: listing._id,
      status: ReportStatus.OPEN,
      _id: { $ne: report._id },
    },
    {
      $set: {
        status: ReportStatus.RESOLVED,
        action: finalAction,
        resolvedBy: adminObjectId,
        resolvedAt: now,
      },
    },
  )

  report.status = ReportStatus.RESOLVED
  report.action = finalAction
  report.resolvedBy = adminObjectId
  report.resolvedAt = now
  await report.save()

  return report
}
