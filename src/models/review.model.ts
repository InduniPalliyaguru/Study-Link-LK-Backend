import mongoose, { Document, Schema, Types } from "mongoose"

export interface IReview extends Document {
  request: Types.ObjectId
  reviewer: Types.ObjectId
  reviewee: Types.ObjectId
  rating: number
  comment?: string
  verified: boolean
  createdAt: Date
  updatedAt: Date
}

const reviewSchema = new Schema<IReview>(
  {
    // one review per completed request
    request: {
      type: Schema.Types.ObjectId,
      ref: "Request",
      required: true,
      unique: true,
    },
    reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 300 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true },
)

reviewSchema.index({ reviewee: 1, createdAt: -1 })

export const Review = mongoose.model<IReview>("Review", reviewSchema)
