import mongoose, { Document, Schema } from "mongoose"

export interface ISubject extends Document {
  name: string
  colorKey: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const subjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    colorKey: { type: Number, min: 0, max: 9, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const Subject = mongoose.model<ISubject>("Subject", subjectSchema)
