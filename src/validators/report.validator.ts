import { z } from "zod"
import { objectId, paging } from "./common"

export const createReportSchema = z.object({
  listing: objectId("Listing"),
  reason: z.enum(
    ["wrong_price", "wrong_subject", "spam", "inappropriate", "other"],
    {
      error:
        "Reason must be wrong_price, wrong_subject, spam, inappropriate or other",
    },
  ),
  details: z.string().trim().max(300, "Details are too long").optional(),
})

export const resolveReportSchema = z.object({
  action: z.enum(["dismiss", "remove_listing", "block_seller"], {
    error: "Action must be dismiss, remove_listing or block_seller",
  }),
})

export const adminReportQuerySchema = z.object({
  status: z.enum(["open", "resolved", "dismissed"]).default("open"),
  ...paging(12),
})

export type CreateReportInput = z.infer<typeof createReportSchema>
export type ResolveAction = z.infer<typeof resolveReportSchema>["action"]
export type AdminReportQuery = z.infer<typeof adminReportQuerySchema>
