import mongoose, { Document, Schema, Types } from "mongoose"

export enum RequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  SHIPPED = "shipped",
  COMPLETED = "completed",
}

export enum DeliveryMethod {
  MEETUP = "meetup",
  COURIER = "courier",
}

export const ACTIVE_STATUSES = [
  RequestStatus.PENDING,
  RequestStatus.ACCEPTED,
  RequestStatus.SHIPPED,
]

export const REVEAL_STATUSES = [
  RequestStatus.ACCEPTED,
  RequestStatus.SHIPPED,
  RequestStatus.COMPLETED,
]

export interface IRequest extends Document {
  listing: Types.ObjectId
  buyer: Types.ObjectId
  seller: Types.ObjectId
  message?: string
  deliveryMethod: DeliveryMethod
  deliveryAddress?: string
  status: RequestStatus
  respondedAt?: Date
  handoverCodeHash?: string
  handoverCodeExpires?: Date
  handoverAttempts: number
  trackingNumber?: string
  shippedAt?: Date
  completedAt?: Date
  verified: boolean
  createdAt: Date
  updatedAt: Date
}

const requestSchema = new Schema<IRequest>(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, trim: true, maxlength: 300 },
    deliveryMethod: {
      type: String,
      enum: Object.values(DeliveryMethod),
      required: true,
    },
    deliveryAddress: { type: String, trim: true, maxlength: 300 },
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.PENDING,
    },
    respondedAt: { type: Date },
    handoverCodeHash: { type: String, select: false },
    handoverCodeExpires: { type: Date },
    handoverAttempts: { type: Number, default: 0 },
    trackingNumber: { type: String, trim: true, maxlength: 50 },
    shippedAt: { type: Date },
    completedAt: { type: Date },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true },
)

requestSchema.index(
  { listing: 1, buyer: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ACTIVE_STATUSES } },
  },
)
requestSchema.index({ buyer: 1, createdAt: -1 })
requestSchema.index({ seller: 1, createdAt: -1 })
requestSchema.index({ status: 1, shippedAt: 1 })

export const PurchaseRequest = mongoose.model<IRequest>(
  "Request",
  requestSchema,
)
