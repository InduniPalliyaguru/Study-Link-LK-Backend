import { z } from "zod"

const objectId = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .regex(/^[0-9a-fA-F]{24}$/, `${label} is not a valid id`)

export const assistSchema = z.object({
  name: z
    .string({ error: "Book name is required" })
    .trim()
    .min(3, "Book name must be at least 3 characters")
    .max(120),
  subject: objectId("Subject"),
  gradeLevel: objectId("Grade level"),
  condition: z.enum(["New", "Good", "Fair"], {
    error: "Condition must be New, Good or Fair",
  }),
  notes: z.string().trim().max(300).optional(),
})

export type AssistInput = z.infer<typeof assistSchema>
