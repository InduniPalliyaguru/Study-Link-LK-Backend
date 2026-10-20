import { z } from "zod"

const nonEmpty = (value: object) => Object.keys(value).length > 0

export const createMeetupPointSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(80, "Name is too long"),
  district: z
    .string({ error: "District is required" })
    .trim()
    .min(2, "District is required")
    .max(50, "District is too long"),
  address: z.string().trim().max(150, "Address is too long").optional(),
  description: z.string().trim().max(200, "Description is too long").optional(),
})

export const updateMeetupPointSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(80, "Name is too long")
      .optional(),
    district: z
      .string()
      .trim()
      .min(2, "District is required")
      .max(50, "District is too long")
      .optional(),
    address: z.string().trim().max(150, "Address is too long").optional(),
    description: z
      .string()
      .trim()
      .max(200, "Description is too long")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(nonEmpty, "Provide at least one field to update")

export const meetupQuerySchema = z.object({
  district: z.string().trim().max(50).optional(),
})

export type CreateMeetupPointInput = z.infer<typeof createMeetupPointSchema>
export type UpdateMeetupPointInput = z.infer<typeof updateMeetupPointSchema>
