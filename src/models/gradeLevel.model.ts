import mongoose, { Document, Schema } from "mongoose"

export interface IGradeLevel extends Document {
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const gradeLevelSchema = new Schema<IGradeLevel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    description: { type: String, trim: true, maxlength: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const GradeLevel = mongoose.model<IGradeLevel>(
  "GradeLevel",
  gradeLevelSchema,
)
