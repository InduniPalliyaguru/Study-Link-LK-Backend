import mongoose, { Document, Schema } from "mongoose"

export interface IMeetupPoint extends Document {
  name: string
  district: string
  address?: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const meetupPointSchema = new Schema<IMeetupPoint>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 80,
    },
    district: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    address: { type: String, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 200 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

meetupPointSchema.index({ name: 1, district: 1 }, { unique: true })
meetupPointSchema.index({ district: 1, isActive: 1 })

export const MeetupPoint = mongoose.model<IMeetupPoint>(
  "MeetupPoint",
  meetupPointSchema,
)
