import { z } from 'zod'

export const timeRecordTypeSchema = z.enum(['start', 'finish'])

export const createTimeRecordSchema = z.object({
  id: z.string().uuid(),
  stage_id: z.string().uuid(),
  rider_id: z.string().uuid().nullable(),
  timestamp: z.number().int().positive(),
  type: timeRecordTypeSchema,
  device_id: z.string().uuid(),
})

export const assignRiderSchema = z.object({
  time_record_id: z.string().uuid(),
  rider_id: z.string().uuid(),
})

export type CreateTimeRecordInput = z.infer<typeof createTimeRecordSchema>
