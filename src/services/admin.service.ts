import { Listing, ListingStatus } from "../models/listing.model"
import { User, UserRole } from "../models/user.model"
import { ApiError } from "../utils/ApiError"
import {
  AdminListingQuery,
  AdminUserQuery,
  AdminRequestQuery,
} from "../validators/admin.validator"
import { PurchaseRequest, RequestStatus } from "../models/request.model"
import { Report, ReportStatus } from "../models/report.model"
import { Subject } from "../models/subject.model"
import { notifyListingDecision } from "./notification.service"

const escapeRegex = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export const buildMeta = (total: number, page: number, limit: number) => {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

// listings
export const listListingsForAdmin = async (query: AdminListingQuery) => {
  const { status, page, limit } = query
  const filter = { status: status as ListingStatus }

  const [items, total] = await Promise.all([
    Listing.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate([
        { path: "subject", select: "name colorKey" },
        { path: "gradeLevel", select: "name" },
        { path: "seller", select: "name email phone district" },
      ])
      .lean(),
    Listing.countDocuments(filter),
  ])

  return { items, meta: buildMeta(total, page, limit) }
}

export const approveListing = async (listingId: string) => {
  const listing = await Listing.findOneAndUpdate(
    { _id: listingId, status: ListingStatus.PENDING },
    {
      $set: { status: ListingStatus.AVAILABLE },
      $unset: { rejectionReason: 1 },
    },
    { new: true },
  )

  if (!listing) {
    const exists = await Listing.exists({ _id: listingId })
    throw exists
      ? new ApiError(409, "Only pending listings can be approved")
      : new ApiError(404, "Listing not found")
  }

  await notifyListingDecision(listing, "approved")

  return listing
}

export const rejectListing = async (listingId: string, reason: string) => {
  const listing = await Listing.findOneAndUpdate(
    { _id: listingId, status: ListingStatus.PENDING },
    { $set: { status: ListingStatus.REJECTED, rejectionReason: reason } },
    { new: true },
  )

  if (!listing) {
    const exists = await Listing.exists({ _id: listingId })
    throw exists
      ? new ApiError(409, "Only pending listings can be rejected")
      : new ApiError(404, "Listing not found")
  }

  await notifyListingDecision(listing, "rejected", reason)

  return listing
}

// users
export const listUsers = async (query: AdminUserQuery) => {
  const { q, role, blocked, page, limit } = query
  const filter: Record<string, unknown> = {}

  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i")
    filter.$or = [{ name: pattern }, { email: pattern }]
  }
  if (role) filter.role = role
  if (blocked) filter.isBlocked = blocked === "true"

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ])

  return { items, meta: buildMeta(total, page, limit) }
}

const getManageableUser = async (
  adminId: string,
  userId: string,
  action: string,
) => {
  if (adminId === userId) {
    throw new ApiError(400, `You cannot ${action} your own account`)
  }

  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  if (user.role === UserRole.ADMIN) {
    throw new ApiError(
      403,
      `Admin accounts cannot be ${action === "block" ? "blocked" : "deleted"}`,
    )
  }

  return user
}

export const setUserBlocked = async (
  adminId: string,
  userId: string,
  blocked: boolean,
) => {
  const user = await getManageableUser(adminId, userId, "block")

  user.isBlocked = blocked
  await user.save()

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isBlocked: user.isBlocked,
  }
}

export const deleteUser = async (adminId: string, userId: string) => {
  const user = await getManageableUser(adminId, userId, "delete")

  user.isDeleted = true
  user.deletedAt = new Date()
  await user.save()

  await Listing.updateMany(
    {
      seller: user._id,
      status: {
        $in: [
          ListingStatus.PENDING,
          ListingStatus.AVAILABLE,
          ListingStatus.REJECTED,
        ],
      },
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        status: ListingStatus.REMOVED,
      },
    },
  )
}

// requests
export const listRequestsForAdmin = async (query: AdminRequestQuery) => {
  const { status, page, limit } = query
  const filter: Record<string, unknown> = {}

  if (status) filter.status = status

  const [items, total] = await Promise.all([
    PurchaseRequest.find(filter)
      .select("-deliveryAddress")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate([
        {
          path: "listing",
          select: "title images status",
          options: { withDeleted: true },
        },
        {
          path: "buyer",
          select: "name email district",
          options: { withDeleted: true },
        },
        {
          path: "seller",
          select: "name email district",
          options: { withDeleted: true },
        },
      ])
      .lean(),
    PurchaseRequest.countDocuments(filter),
  ])

  return { items, meta: buildMeta(total, page, limit) }
}

// dashboard statistics
export const getDashboardStats = async () => {
  const [
    students,
    activeListings,
    pendingListings,
    booksSold,
    openReports,
    pendingRequests,
    completedRequests,
    subjects,
    perSubject,
  ] = await Promise.all([
    User.countDocuments({ role: UserRole.USER }),
    Listing.countDocuments({ status: ListingStatus.AVAILABLE }),
    Listing.countDocuments({ status: ListingStatus.PENDING }),
    Listing.countDocuments({ status: ListingStatus.SOLD }),
    Report.countDocuments({ status: ReportStatus.OPEN }),
    PurchaseRequest.countDocuments({ status: RequestStatus.PENDING }),
    PurchaseRequest.countDocuments({ status: RequestStatus.COMPLETED }),
    Subject.find({ isActive: true }).sort({ name: 1 }).lean(),
    Listing.aggregate<{ _id: unknown; count: number }>([
      {
        $match: {
          status: { $in: [ListingStatus.AVAILABLE, ListingStatus.RESERVED] },
          isDeleted: false,
        },
      },
      { $group: { _id: "$subject", count: { $sum: 1 } } },
    ]),
  ])

  const counts = new Map(perSubject.map((row) => [String(row._id), row.count]))

  const bySubject = subjects
    .map((subject) => ({
      name: subject.name,
      colorKey: subject.colorKey,
      count: counts.get(String(subject._id)) ?? 0,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    students,
    activeListings,
    pendingListings,
    booksSold,
    openReports,
    pendingRequests,
    completedRequests,
    bySubject,
  }
}
