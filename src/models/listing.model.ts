import mongoose, { Document, Schema, Types } from "mongoose"

export enum ListingCondition {
  NEW = "New",
  GOOD = "Good",
  FAIR = "Fair",
}

export enum ListingStatus {
  PENDING = "pending",
  AVAILABLE = "available",
  RESERVED = "reserved",
  SOLD = "sold",
  REMOVED = "removed",
  REJECTED = "rejected",
}

export enum DeliveryOption {
  MEETUP = "meetup",
  COURIER = "courier",
  BOTH = "both",
}

export interface IListing extends Document {
  title: string
  description: string
  price: number
  condition: ListingCondition
  district: string
  images: string[]
  status: ListingStatus
  deliveryOptions: DeliveryOption
  aiGenerated: boolean
  rejectionReason?: string
  seller: Types.ObjectId
  subject: Types.ObjectId
  gradeLevel: Types.ObjectId
  isDeleted: boolean
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const listingSchema = new Schema<IListing>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1500,
    },
    price: { type: Number, required: true, min: 0 },
    condition: {
      type: String,
      enum: Object.values(ListingCondition),
      required: true,
    },
    district: { type: String, required: true, trim: true },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (value: string[]) => value.length <= 4,
        message: "A listing can have at most 4 images",
      },
    },
    status: {
      type: String,
      enum: Object.values(ListingStatus),
      default: ListingStatus.PENDING,
    },
    deliveryOptions: {
      type: String,
      enum: Object.values(DeliveryOption),
      default: DeliveryOption.BOTH,
    },
    aiGenerated: { type: Boolean, default: false },
    rejectionReason: { type: String, trim: true, maxlength: 200 },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    gradeLevel: {
      type: Schema.Types.ObjectId,
      ref: "GradeLevel",
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
)

listingSchema.index({ title: "text", description: "text" })
listingSchema.index({ status: 1, subject: 1, gradeLevel: 1 })
listingSchema.index({ price: 1 })
listingSchema.index({ district: 1 })
listingSchema.index({ seller: 1 })

listingSchema.pre(
  /^(find|count)/,
  async function (this: mongoose.Query<unknown, IListing>) {
    const options = this.getOptions() as { withDeleted?: boolean }
    if (!options.withDeleted) {
      this.where({ isDeleted: false })
    }
  },
)

export const Listing = mongoose.model<IListing>("Listing", listingSchema)
