import mongoose, { Document, Schema, Types } from "mongoose"

export interface ISavedListing extends Document {
  user: Types.ObjectId
  listing: Types.ObjectId
  createdAt: Date
}

const savedListingSchema = new Schema<ISavedListing>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

savedListingSchema.index({ user: 1, listing: 1 }, { unique: true })
savedListingSchema.index({ user: 1, createdAt: -1 })

export const SavedListing = mongoose.model<ISavedListing>(
  "SavedListing",
  savedListingSchema,
)
