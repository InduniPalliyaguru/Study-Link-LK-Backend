import bcrypt from "bcryptjs"
import { User, EducationLevel } from "../models/user.model"
import { ApiError } from "../utils/ApiError"
import { signAccessToken, signRefreshToken } from "../utils/token"

export interface RegisterInput {
  name?: string
  email?: string
  password?: string
  district?: string
  phone?: string
  institution?: string
  educationLevel?: EducationLevel
}

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

  if (!name || !email || !password || !district) {
    throw new ApiError(400, "name, email, password and district are required")
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters")
  }

  const existing = await User.findOne({ email })
  if (existing) {
    throw new ApiError(409, "Email is already registered")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      district,
      phone,
      institution,
      educationLevel,
    })

    return { id: user._id, name: user.name, email: user.email, role: user.role }
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new ApiError(409, "Email is already registered")
    }
    throw err
  }
}

export interface LoginInput {
  email?: string
  password?: string
}

export const loginUser = async (input: LoginInput) => {
  const { email, password } = input

  if (!email || !password) {
    throw new ApiError(400, "email and password are required")
  }

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
