import { z } from "zod"

const required = (label: string) => z.string({ error: `${label} is required` })

export const registerSchema = z.object({
  name: required("Name")
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long"),
  email: required("Email")
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
  password: required("Password")
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  district: required("District").trim().min(2, "District is required"),
  phone: z.string().trim().optional(),
  institution: z.string().trim().optional(),
  educationLevel: z.enum(["O/L", "A/L", "University", "Diploma"]).optional(),
})

export const loginSchema = z.object({
  email: required("Email")
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
  password: required("Password").min(1, "Password is required"),
})

export const refreshSchema = z.object({
  refreshToken: required("refreshToken").min(1, "refreshToken is required"),
})

export const forgotSchema = z.object({
  email: required("Email")
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
})

export const resetSchema = z.object({
  token: required("Reset token").regex(
    /^[a-f0-9]{64}$/,
    "This reset link is not valid",
  ),
  newPassword: required("New password")
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotInput = z.infer<typeof forgotSchema>
export type ResetInput = z.infer<typeof resetSchema>
