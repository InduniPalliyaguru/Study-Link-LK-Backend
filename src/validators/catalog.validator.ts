import { z } from "zod"

const noEmpty = (obj: object) => Object.keys(obj).length > 0

export const createSubjectSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long"),
  colorKey: z.number().int().min(0).max(9).optional(),
})

export const updateSubjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name is too long")
      .optional(),
    colorKey: z.number().int().min(0).max(9).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(noEmpty, "Provide at least one field to update")

export const createGradeLevelSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(30, "Name is too long"),
  description: z.string().trim().max(100).optional(),
})

export const updateGradeLevelSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(30, "Name is too long")
      .optional(),
    description: z.string().trim().max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(noEmpty, "Provide at least one field to update")

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>
export type CreateGradeLevelInput = z.infer<typeof createGradeLevelSchema>
export type UpdateGradeLevelInput = z.infer<typeof updateGradeLevelSchema>
