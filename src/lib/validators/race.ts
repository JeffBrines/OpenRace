import { z } from 'zod'

export const raceTypeSchema = z.enum(['enduro', 'dh', 'xc'])
export const raceStatusSchema = z.enum(['draft', 'active', 'complete'])
export const riderIdModeSchema = z.enum(['name_only', 'bib_only', 'both'])

export const createRaceSchema = z.object({
  name: z.string().min(1).max(200),
  date: z.string().date(),
  type: raceTypeSchema,
  location: z.string().max(500).optional(),
  categories: z.array(z.string().min(1)).min(1),
  rider_id_mode: riderIdModeSchema,
})

export const createStageSchema = z.object({
  name: z.string().min(1).max(200),
  order: z.number().int().min(0),
  distance: z.number().positive().optional(),
  elevation: z.number().positive().optional(),
})

export type CreateRaceInput = z.infer<typeof createRaceSchema>
export type CreateStageInput = z.infer<typeof createStageSchema>
