import { Types } from "mongoose"
import {
  PurchaseRequest,
  RequestStatus,
  DeliveryMethod,
  ACTIVE_STATUSES,
  REVEAL_STATUSES,
} from "../models/request.model"
import { Listing, ListingStatus, DeliveryOption } from "../models/listing.model"
import { ApiError } from "../utils/ApiError"
import { CreateRequestInput } from "../validators/request.validator"

type Plain = Record<string, unknown>

const hide = (target: unknown, keys: string[]) => {
  if (target && typeof target === "object") {
    for (const key of keys) {
      delete (target as Plain)[key]
    }
  }
}

const listingPopulate = { path: "listing", select: "title price images status" }

export const createRequest = async (
  buyerId: string,
  input: CreateRequestInput,
) => {
  const listing = await Listing.findById(input.listing)

  if (
    !listing ||
    listing.status === ListingStatus.PENDING ||
    listing.status === ListingStatus.REMOVED
  ) {
    throw new ApiError(404, "Listing not found")
  }

  if (listing.status !== ListingStatus.AVAILABLE) {
    throw new ApiError(409, "This listing is not available right now")
  }

  if (listing.seller.toString() === buyerId) {
    throw new ApiError(400, "You cannot send a request for your own listing")
  }

  if (
    listing.deliveryOptions !== DeliveryOption.BOTH &&
    listing.deliveryOptions !== (input.deliveryMethod as string)
  ) {
    throw new ApiError(
      400,
      `This seller only offers ${listing.deliveryOptions} delivery`,
    )
  }

  const alreadyRequested = await PurchaseRequest.findOne({
    listing: listing._id,
    buyer: buyerId,
    status: { $in: ACTIVE_STATUSES },
  })
  if (alreadyRequested) {
    throw new ApiError(
      409,
      "You already have an active request for this listing",
    )
  }

  try {
    return await PurchaseRequest.create({
      listing: listing._id,
      buyer: new Types.ObjectId(buyerId),
      seller: listing.seller,
      message: input.message,
      deliveryMethod: input.deliveryMethod as DeliveryMethod,
      deliveryAddress:
        input.deliveryMethod === "courier" ? input.deliveryAddress : undefined,
      status: RequestStatus.PENDING,
    })
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new ApiError(
        409,
        "You already have an active request for this listing",
      )
    }
    throw err
  }
}

export const getSentRequests = async (buyerId: string) => {
  const items = await PurchaseRequest.find({ buyer: buyerId })
    .sort({ createdAt: -1 })
    .populate([
      listingPopulate,
      { path: "seller", select: "name district phone email" },
    ])
    .lean()

  return items.map((item) => {
    if (!REVEAL_STATUSES.includes(item.status)) {
      hide(item.seller, ["phone", "email"])
    }
    return item
  })
}

export const getReceivedRequests = async (sellerId: string) => {
  const items = await PurchaseRequest.find({ seller: sellerId })
    .sort({ createdAt: -1 })
    .populate([
      listingPopulate,
      { path: "buyer", select: "name district phone email" },
    ])
    .lean()

  return items.map((item) => {
    if (!REVEAL_STATUSES.includes(item.status)) {
      hide(item.buyer, ["phone", "email"])
      hide(item, ["deliveryAddress"])
    }
    return item
  })
}

export const respondToRequest = async (
  sellerId: string,
  requestId: string,
  decision: "accept" | "reject",
) => {
  const request = await PurchaseRequest.findById(requestId)

  if (!request) {
    throw new ApiError(404, "Request not found")
  }

  if (request.seller.toString() !== sellerId) {
    throw new ApiError(
      403,
      "You can only respond to requests on your own listings",
    )
  }

  if (request.status !== RequestStatus.PENDING) {
    throw new ApiError(409, `This request is already ${request.status}`)
  }

  if (decision === "reject") {
    request.status = RequestStatus.REJECTED
    request.respondedAt = new Date()
    await request.save()
    return request
  }

  const reserved = await Listing.findOneAndUpdate(
    { _id: request.listing, seller: sellerId, status: ListingStatus.AVAILABLE },
    { status: ListingStatus.RESERVED },
    { new: true },
  )

  if (!reserved) {
    throw new ApiError(409, "This listing is no longer available")
  }

  try {
    request.status = RequestStatus.ACCEPTED
    request.respondedAt = new Date()
    await request.save()
  } catch (err) {
    await Listing.updateOne(
      { _id: request.listing },
      { status: ListingStatus.AVAILABLE },
    )
    throw err
  }

  return request
}

export const cancelRequest = async (buyerId: string, requestId: string) => {
  const request = await PurchaseRequest.findById(requestId)

  if (!request) {
    throw new ApiError(404, "Request not found")
  }

  if (request.buyer.toString() !== buyerId) {
    throw new ApiError(403, "You can only cancel your own requests")
  }

  if (
    request.status !== RequestStatus.PENDING &&
    request.status !== RequestStatus.ACCEPTED
  ) {
    throw new ApiError(409, `A ${request.status} request cannot be cancelled`)
  }

  const wasAccepted = request.status === RequestStatus.ACCEPTED

  request.status = RequestStatus.CANCELLED
  await request.save()

  if (wasAccepted) {
    await Listing.updateOne(
      { _id: request.listing, status: ListingStatus.RESERVED },
      { status: ListingStatus.AVAILABLE },
    )
  }

  return request
}
