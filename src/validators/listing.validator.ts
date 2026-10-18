import { z } from "zod"

const objectId = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .regex(/^[0-9a-fA-F]{24}$/, `${label} is not a valid id`)

export const createListingSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title is too long"),
  description: z
    .string({ error: "Description is required" })
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(1500, "Description is too long"),
  price: z.coerce
    .number({ error: "Price must be a number" })
    .min(0, "Price cannot be negative")
    .max(1000000, "Price is too high"),
  condition: z.enum(["New", "Good", "Fair"], {
    error: "Condition must be New, Good or Fair",
  }),
  district: z
    .string({ error: "District is required" })
    .trim()
    .min(2, "District is required"),
  subject: objectId("Subject"),
  gradeLevel: objectId("Grade level"),
  deliveryOptions: z
    .enum(["meetup", "courier", "both"], {
      error: "Delivery option must be meetup, courier or both",
    })
    .optional(),
})

export const updateListingSchema = createListingSchema.partial()

export type CreateListingInput = z.infer<typeof createListingSchema>
export type UpdateListingInput = z.infer<typeof updateListingSchema>

export const listingQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    subject: objectId("Subject").optional(),
    gradeLevel: objectId("Grade level").optional(),
    condition: z.enum(["New", "Good", "Fair"]).optional(),
    district: z.string().trim().max(50).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    free: z.enum(["true", "false"]).optional(),
    sort: z
      .enum(["newest", "oldest", "price_asc", "price_desc"])
      .default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .refine(
    (v) =>
      v.minPrice === undefined ||
      v.maxPrice === undefined ||
      v.minPrice <= v.maxPrice,
    { message: "minPrice cannot be greater than maxPrice", path: ["minPrice"] },
  )

export type ListingQuery = z.infer<typeof listingQuerySchema>
