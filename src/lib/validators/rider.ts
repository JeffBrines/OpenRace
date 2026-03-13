import { z } from 'zod'

export const genderSchema = z.enum(['male', 'female', 'non_binary'])

export const createRiderSchema = z.object({
  name: z.string().min(1).max(200),
  bib: z.string().max(20).optional(),
  category: z.string().min(1),
  age: z.number().int().min(0).max(150).optional(),
  gender: genderSchema,
})

export type CreateRiderInput = z.infer<typeof createRiderSchema>
