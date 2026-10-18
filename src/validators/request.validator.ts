import { z } from "zod"

export const createRequestSchema = z
  .object({
    listing: z
      .string({ error: "Listing is required" })
      .regex(/^[0-9a-fA-F]{24}$/, "Listing is not a valid id"),
    message: z.string().trim().max(300, "Message is too long").optional(),
    deliveryMethod: z.enum(["meetup", "courier"], {
      error: "Delivery method must be meetup or courier",
    }),
    deliveryAddress: z
      .string()
      .trim()
      .min(10, "Enter your full delivery address")
      .max(300)
      .optional(),
  })
  .refine(
    (value) => value.deliveryMethod !== "courier" || !!value.deliveryAddress,
    {
      message: "Delivery address is required for courier delivery",
      path: ["deliveryAddress"],
    },
  )

export const respondSchema = z.object({
  decision: z.enum(["accept", "reject"], {
    error: "Decision must be accept or reject",
  }),
})

export type CreateRequestInput = z.infer<typeof createRequestSchema>

export const shipSchema = z.object({
  trackingNumber: z
    .string()
    .trim()
    .max(50, "Tracking number is too long")
    .optional(),
})

export const confirmSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, "The handover code must be 6 digits")
    .optional(),
})

export type RespondInput = z.infer<typeof respondSchema>
