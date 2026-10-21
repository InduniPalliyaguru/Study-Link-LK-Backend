import { z } from "zod"

const nonEmpty = (value: object) => Object.keys(value).length > 0

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{9,15}$/, "Enter a valid phone number")

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name is too long")
      .optional(),
    phone: phone.or(z.literal("")).optional(),
    district: z
      .string()
      .trim()
      .min(2, "District is required")
      .max(50, "District is too long")
      .optional(),
    institution: z
      .string()
      .trim()
      .max(100, "Institution name is too long")
      .optional(),
    educationLevel: z
      .enum(["O/L", "A/L", "University", "Diploma"], {
        error: "Education level must be O/L, A/L, University or Diploma",
      })
      .optional(),
  })
  .refine(nonEmpty, "Provide at least one field to update")

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: "Current password is required" })
      .min(1, "Current password is required"),
    newPassword: z
      .string({ error: "New password is required" })
      .min(8, "New password must be at least 8 characters")
      .max(72, "New password must be at most 72 characters"),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  })

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
