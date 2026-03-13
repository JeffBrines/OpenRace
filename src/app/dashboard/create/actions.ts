'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createRace } from '@/lib/db/races'
import { createStage } from '@/lib/db/stages'
import { createRidersBatch } from '@/lib/db/riders'
import { createRaceSchema, createStageSchema, type CreateRaceInput, type CreateStageInput } from '@/lib/validators/race'
import { createRiderSchema, type CreateRiderInput } from '@/lib/validators/rider'
import { z } from 'zod'

interface CreateRaceActionInput {
  race: CreateRaceInput
  stages: CreateStageInput[]
  riders: CreateRiderInput[]
}

interface CreateRaceActionResult {
  success: boolean
  data?: {
    race: { id: string; share_code: string }
    stages: { id: string; name: string; start_token: string; finish_token: string }[]
  }
  error?: string
}

const createRaceActionSchema = z.object({
  race: createRaceSchema,
  stages: z.array(createStageSchema).min(1),
  riders: z.array(createRiderSchema),
})

export async function createRaceAction(
  input: CreateRaceActionInput
): Promise<CreateRaceActionResult> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return { success: false, error: 'You must be signed in to create a race.' }
    }

    const validated = createRaceActionSchema.safeParse(input)
    if (!validated.success) {
      const firstIssue = validated.error.issues[0]
      return { success: false, error: firstIssue?.message ?? 'Invalid input.' }
    }

    const { race: raceInput, stages: stageInputs, riders: riderInputs } = validated.data

    const race = await createRace(supabase, raceInput, authData.user.id)

    const stages = await Promise.all(
      stageInputs.map((stageInput) => createStage(supabase, race.id, stageInput))
    )

    if (riderInputs.length > 0) {
      await createRidersBatch(supabase, race.id, riderInputs)
    }

    return {
      success: true,
      data: {
        race: {
          id: race.id,
          share_code: race.share_code,
        },
        stages: stages.map((stage) => ({
          id: stage.id,
          name: stage.name,
          start_token: stage.start_token,
          finish_token: stage.finish_token,
        })),
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return { success: false, error: message }
  }
}
