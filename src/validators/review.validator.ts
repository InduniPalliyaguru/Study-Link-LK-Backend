import { z } from "zod"
import { objectId, paging } from "./common"

export const createReviewSchema = z.object({
  request: objectId("Request"),
  rating: z.coerce
    .number({ error: "Rating must be a number" })
    .int("Rating must be a whole number")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z.string().trim().max(300, "Comment is too long").optional(),
})

export const reviewQuerySchema = z.object({ ...paging(10) })

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type ReviewQuery = z.infer<typeof reviewQuerySchema>
