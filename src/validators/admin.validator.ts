import { z } from "zod"

const paging = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
}

export const adminListingQuerySchema = z.object({
  status: z
    .enum(["pending", "available", "reserved", "sold", "rejected"])
    .default("pending"),
  ...paging,
})

export const adminUserQuerySchema = z.object({
  q: z.string().trim().max(60).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  blocked: z.enum(["true", "false"]).optional(),
  ...paging,
})

export const rejectListingSchema = z.object({
  reason: z
    .string({ error: "Reason is required" })
    .trim()
    .min(5, "Reason must be at least 5 characters")
    .max(200, "Reason is too long"),
})

export const blockUserSchema = z.object({
  blocked: z.boolean({ error: "blocked must be true or false" }),
})

export type AdminListingQuery = z.infer<typeof adminListingQuerySchema>
export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>

export const adminRequestQuerySchema = z.object({
  status: z
    .enum([
      "pending",
      "accepted",
      "rejected",
      "cancelled",
      "shipped",
      "completed",
    ])
    .optional(),
  ...paging,
})

export type AdminRequestQuery = z.infer<typeof adminRequestQuerySchema>
