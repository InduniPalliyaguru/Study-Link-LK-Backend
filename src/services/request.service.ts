import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import { Types } from "mongoose"
import {
  PurchaseRequest,
  IRequest,
  RequestStatus,
  DeliveryMethod,
  ACTIVE_STATUSES,
  REVEAL_STATUSES,
} from "../models/request.model"
import { Listing, ListingStatus, DeliveryOption } from "../models/listing.model"
import { ApiError } from "../utils/ApiError"
import { CreateRequestInput } from "../validators/request.validator"
import {
  notifyNewRequest,
  notifyRequestDecision,
  notifyShipped,
} from "./notification.service"

type Plain = Record<string, unknown>

const DAY_MS = 24 * 60 * 60 * 1000
const CODE_VALID_DAYS = 7
const MAX_CODE_ATTEMPTS = 5
const AUTO_COMPLETE_DAYS = 10

// removes private fields from a plain (lean) object
const hide = (target: unknown, keys: string[]) => {
  if (target && typeof target === "object") {
    for (const key of keys) {
      delete (target as Plain)[key]
    }
  }
}

// a plain copy of a request document without the code hash
const safeRequest = (request: IRequest) => {
  const { handoverCodeHash, ...rest } = request.toObject() as Plain
  return rest
}

const generateCode = () => crypto.randomInt(100000, 1000000).toString()

// creates a new code, stores only its hash, and returns the plain code (shown once to the seller)
const issueCode = async (request: IRequest) => {
  const code = generateCode()
  request.handoverCodeHash = await bcrypt.hash(code, 10)
  request.handoverCodeExpires = new Date(Date.now() + CODE_VALID_DAYS * DAY_MS)
  request.handoverAttempts = 0
  return code
}

// request becomes completed and the book is sold
const finishRequest = async (request: IRequest, verified: boolean) => {
  request.status = RequestStatus.COMPLETED
  request.completedAt = new Date()
  request.verified = verified
  await request.save()
  await Listing.updateOne(
    { _id: request.listing },
    { status: ListingStatus.SOLD },
  )
}

const listingPopulate = { path: "listing", select: "title price images status" }

export const createRequest = async (
  buyerId: string,
  input: CreateRequestInput,
) => {
  const listing = await Listing.findById(input.listing)

  const hiddenStatuses = [
    ListingStatus.PENDING,
    ListingStatus.REMOVED,
    ListingStatus.REJECTED,
  ]
  if (!listing || hiddenStatuses.includes(listing.status)) {
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
    const created = await PurchaseRequest.create({
      listing: listing._id,
      buyer: new Types.ObjectId(buyerId),
      seller: listing.seller,
      message: input.message,
      deliveryMethod: input.deliveryMethod as DeliveryMethod,
      deliveryAddress:
        input.deliveryMethod === "courier" ? input.deliveryAddress : undefined,
      status: RequestStatus.PENDING,
    })

    await notifyNewRequest(created)
    return created
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

// requests I sent (as a buyer). Seller contact is shown only after acceptance
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

// requests on my listings (as a seller). Buyer contact and address are shown only after acceptance
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
    await notifyRequestDecision(request, "rejected")
    return {
      request: safeRequest(request),
      handoverCode: undefined as string | undefined,
    }
  }

  // reserve the listing in ONE atomic step: it only succeeds if the listing is still "available"
  const reserved = await Listing.findOneAndUpdate(
    { _id: request.listing, seller: sellerId, status: ListingStatus.AVAILABLE },
    { status: ListingStatus.RESERVED },
    { new: true },
  )

  if (!reserved) {
    throw new ApiError(409, "This listing is no longer available")
  }

  let handoverCode: string | undefined

  try {
    request.status = RequestStatus.ACCEPTED
    request.respondedAt = new Date()

    // meetup deliveries are confirmed with a one-time code
    if (request.deliveryMethod === DeliveryMethod.MEETUP) {
      handoverCode = await issueCode(request)
    }

    await request.save()
  } catch (err) {
    // keep the data consistent: undo the reservation
    await Listing.updateOne(
      { _id: request.listing },
      { status: ListingStatus.AVAILABLE },
    )
    throw err
  }

  await notifyRequestDecision(request, "accepted")

  return { request: safeRequest(request), handoverCode }
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
    // the book is free again
    await Listing.updateOne(
      { _id: request.listing, status: ListingStatus.RESERVED },
      { status: ListingStatus.AVAILABLE },
    )
  }

  return request
}

// seller: the book was posted by courier
export const shipRequest = async (
  sellerId: string,
  requestId: string,
  trackingNumber?: string,
) => {
  const request = await PurchaseRequest.findById(requestId)

  if (!request) {
    throw new ApiError(404, "Request not found")
  }

  if (request.seller.toString() !== sellerId) {
    throw new ApiError(403, "You can only update requests on your own listings")
  }

  if (request.deliveryMethod !== DeliveryMethod.COURIER) {
    throw new ApiError(400, "Only courier requests can be marked as shipped")
  }

  if (request.status !== RequestStatus.ACCEPTED) {
    throw new ApiError(
      409,
      `A ${request.status} request cannot be marked as shipped`,
    )
  }

  request.status = RequestStatus.SHIPPED
  request.shippedAt = new Date()
  request.trackingNumber = trackingNumber || undefined
  await notifyShipped(request)
  await request.save()

  return request
}

// buyer: the book arrived. Meetup needs the code, courier needs the book to be shipped first
export const confirmReceived = async (
  buyerId: string,
  requestId: string,
  code?: string,
) => {
  const request =
    await PurchaseRequest.findById(requestId).select("+handoverCodeHash")

  if (!request) {
    throw new ApiError(404, "Request not found")
  }

  if (request.buyer.toString() !== buyerId) {
    throw new ApiError(403, "You can only confirm your own requests")
  }

  if (
    request.status !== RequestStatus.ACCEPTED &&
    request.status !== RequestStatus.SHIPPED
  ) {
    throw new ApiError(409, `A ${request.status} request cannot be confirmed`)
  }

  if (request.deliveryMethod === DeliveryMethod.MEETUP) {
    if (!code) {
      throw new ApiError(400, "The 6-digit handover code is required")
    }

    if (!request.handoverCodeHash || !request.handoverCodeExpires) {
      throw new ApiError(
        409,
        "No handover code exists. Ask the seller to generate one",
      )
    }

    if (request.handoverCodeExpires.getTime() < Date.now()) {
      throw new ApiError(
        410,
        "The handover code has expired. Ask the seller to generate a new one",
      )
    }

    if (request.handoverAttempts >= MAX_CODE_ATTEMPTS) {
      throw new ApiError(
        429,
        "Too many wrong attempts. Ask the seller to generate a new code",
      )
    }

    const matches = await bcrypt.compare(code, request.handoverCodeHash)

    if (!matches) {
      request.handoverAttempts += 1
      await request.save()
      const left = MAX_CODE_ATTEMPTS - request.handoverAttempts
      throw new ApiError(400, `Wrong code. ${left} attempt(s) left`)
    }
  } else if (request.status !== RequestStatus.SHIPPED) {
    throw new ApiError(
      409,
      "The seller has not marked this book as shipped yet",
    )
  }

  await finishRequest(request, true)
  return safeRequest(request)
}

// seller: create a new code (the old one stops working)
export const regenerateCode = async (sellerId: string, requestId: string) => {
  const request = await PurchaseRequest.findById(requestId)

  if (!request) {
    throw new ApiError(404, "Request not found")
  }

  if (request.seller.toString() !== sellerId) {
    throw new ApiError(403, "You can only update requests on your own listings")
  }

  if (
    request.deliveryMethod !== DeliveryMethod.MEETUP ||
    request.status !== RequestStatus.ACCEPTED
  ) {
    throw new ApiError(
      409,
      "A code can only be generated for an accepted meetup request",
    )
  }

  const handoverCode = await issueCode(request)
  await request.save()

  return { request: safeRequest(request), handoverCode }
}

// seller: the buyer never entered the code. Allowed only after the code has expired (unverified sale)
export const completeManually = async (sellerId: string, requestId: string) => {
  const request = await PurchaseRequest.findById(requestId)

  if (!request) {
    throw new ApiError(404, "Request not found")
  }

  if (request.seller.toString() !== sellerId) {
    throw new ApiError(403, "You can only update requests on your own listings")
  }

  if (
    request.deliveryMethod !== DeliveryMethod.MEETUP ||
    request.status !== RequestStatus.ACCEPTED
  ) {
    throw new ApiError(
      409,
      "Only an accepted meetup request can be completed manually",
    )
  }

  if (
    request.handoverCodeExpires &&
    request.handoverCodeExpires.getTime() > Date.now()
  ) {
    throw new ApiError(
      409,
      "You can complete manually only after the handover code expires",
    )
  }

  await finishRequest(request, false)
  return safeRequest(request)
}

// courier requests that were shipped long ago and never confirmed are completed automatically
export const autoCompleteShippedRequests = async () => {
  const cutoff = new Date(Date.now() - AUTO_COMPLETE_DAYS * DAY_MS)
  const stale = await PurchaseRequest.find({
    status: RequestStatus.SHIPPED,
    shippedAt: { $lte: cutoff },
  })

  for (const request of stale) {
    await finishRequest(request, false)
  }

  return stale.length
}
