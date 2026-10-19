import { z } from "zod"

export const objectId = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .regex(/^[0-9a-fA-F]{24}$/, `${label} is not a valid id`)

export const paging = (defaultLimit: number) => ({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(defaultLimit),
})
