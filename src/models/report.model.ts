import mongoose, { Document, Schema, Types } from "mongoose"

export enum ReportReason {
  WRONG_PRICE = "wrong_price",
  WRONG_SUBJECT = "wrong_subject",
  SPAM = "spam",
  INAPPROPRIATE = "inappropriate",
  OTHER = "other",
}

export enum ReportStatus {
  OPEN = "open",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}

export enum ReportAction {
  DISMISSED = "dismissed",
  LISTING_REMOVED = "listing_removed",
  SELLER_BLOCKED = "seller_blocked",
}

export interface IReport extends Document {
  listing: Types.ObjectId
  reporter: Types.ObjectId
  reason: ReportReason
  details?: string
  status: ReportStatus
  action?: ReportAction
  resolvedBy?: Types.ObjectId
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const reportSchema = new Schema<IReport>(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, enum: Object.values(ReportReason), required: true },
    details: { type: String, trim: true, maxlength: 300 },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.OPEN,
    },
    action: { type: String, enum: Object.values(ReportAction) },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
)

// a user can have only ONE open report per listing
reportSchema.index(
  { listing: 1, reporter: 1 },
  { unique: true, partialFilterExpression: { status: ReportStatus.OPEN } },
)
reportSchema.index({ status: 1, createdAt: -1 })

export const Report = mongoose.model<IReport>("Report", reportSchema)
