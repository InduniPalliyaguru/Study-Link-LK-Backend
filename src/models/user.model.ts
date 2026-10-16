import mongoose, { Document, Schema } from "mongoose"

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum EducationLevel {
  OL = "O/L",
  AL = "A/L",
  UNIVERSITY = "University",
  DIPLOMA = "Diploma",
}

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: UserRole
  phone?: string
  district: string
  institution?: string
  educationLevel?: EducationLevel
  isBlocked: boolean
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    phone: { type: String, trim: true },
    district: { type: String, required: true, trim: true },
    institution: { type: String, trim: true },
    educationLevel: { type: String, enum: Object.values(EducationLevel) },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const User = mongoose.model<IUser>("User", userSchema)
