'use server'

import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRaceById, updateRaceStatus } from '@/lib/db/races'

const updateRaceStatusSchema = z.object({
  raceId: z.string().uuid(),
  status: z.enum(['draft', 'active', 'complete']),
})

interface UpdateRaceStatusResult {
  success: boolean
  error?: string
}

export async function updateRaceStatusAction(
  raceId: string,
  status: 'draft' | 'active' | 'complete'
): Promise<UpdateRaceStatusResult> {
  try {
    const validated = updateRaceStatusSchema.safeParse({ raceId, status })
    if (!validated.success) {
      const firstIssue = validated.error.issues[0]
      return { success: false, error: firstIssue?.message ?? 'Invalid input.' }
    }

    const supabase = await createServerSupabaseClient()

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return { success: false, error: 'You must be signed in to update a race.' }
    }

    const race = await getRaceById(supabase, validated.data.raceId)
    if (!race) {
      return { success: false, error: 'Race not found.' }
    }

    if (race.organizer_id !== authData.user.id) {
      return { success: false, error: 'You are not authorized to update this race.' }
    }

    await updateRaceStatus(supabase, validated.data.raceId, validated.data.status)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return { success: false, error: message }
  }
}
