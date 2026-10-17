import bcrypt from "bcryptjs"
import { User, EducationLevel } from "../models/user.model"
import { ApiError } from "../utils/ApiError"
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/token"
import { RegisterInput, LoginInput } from "../validators/auth.validator"

export const registerUser = async (input: RegisterInput) => {
  const {
    name,
    email,
    password,
    district,
    phone,
    institution,
    educationLevel,
  } = input

  const existing = await User.findOne({ email })
  if (existing) {
    throw new ApiError(409, "Email is already registered")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    district,
    phone,
    institution,
    educationLevel: educationLevel as EducationLevel | undefined,
  })

  return { id: user._id, name: user.name, email: user.email, role: user.role }
}

export const loginUser = async (input: LoginInput) => {
  const { email, password } = input

  const user = await User.findOne({ email }).select("+password")
  if (!user) {
    throw new ApiError(401, "Invalid email or password")
  }

  const passwordMatches = await bcrypt.compare(password, user.password)
  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password")
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked")
  }

  const payload = { sub: user._id.toString(), role: user.role }

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  }
}

export const getMe = async (userId: string) => {
  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    district: user.district,
    institution: user.institution,
    educationLevel: user.educationLevel,
    createdAt: user.createdAt,
  }
}

export const refreshAccessToken = async (refreshToken: string) => {
  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token")
  }

  const user = await User.findById(payload.sub)
  if (!user) {
    throw new ApiError(401, "User no longer exists")
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked")
  }

  return {
    accessToken: signAccessToken({ sub: user._id.toString(), role: user.role }),
  }
}
