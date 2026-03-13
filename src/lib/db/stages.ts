import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { CreateStageInput } from '@/lib/validators/race'
import { generateToken } from '@/lib/utils/tokens'

type Stage = Database['public']['Tables']['stages']['Row']
type Race = Database['public']['Tables']['races']['Row']

export async function createStage(
  supabase: SupabaseClient<Database>,
  raceId: string,
  input: CreateStageInput
): Promise<Stage> {
  const { data, error } = await supabase
    .from('stages')
    .insert({
      ...input,
      race_id: raceId,
      start_token: generateToken(24),
      finish_token: generateToken(24),
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create stage: ${error.message}`)
  return data
}

export async function getStagesByRace(
  supabase: SupabaseClient<Database>,
  raceId: string
): Promise<Stage[]> {
  const { data, error } = await supabase
    .from('stages')
    .select()
    .eq('race_id', raceId)
    .order('order', { ascending: true })
  if (error) throw new Error(`Failed to fetch stages: ${error.message}`)
  return data
}

export async function getStageByToken(
  supabase: SupabaseClient<Database>,
  token: string
): Promise<{ stage: Stage; role: 'start' | 'finish'; race: Race } | null> {
  // Check start_token
  const { data: startMatch } = await supabase
    .from('stages')
    .select('*, races!inner(*)')
    .eq('start_token', token)
    .single()

  if (startMatch) {
    const { races: race, ...stage } = startMatch as any
    return { stage, role: 'start', race }
  }

  // Check finish_token
  const { data: finishMatch } = await supabase
    .from('stages')
    .select('*, races!inner(*)')
    .eq('finish_token', token)
    .single()

  if (finishMatch) {
    const { races: race, ...stage } = finishMatch as any
    return { stage, role: 'finish', race }
  }

  return null
}

export async function reorderStages(
  supabase: SupabaseClient<Database>,
  stageIds: string[]
): Promise<void> {
  for (let i = 0; i < stageIds.length; i++) {
    const { error } = await supabase
      .from('stages')
      .update({ order: i })
      .eq('id', stageIds[i])
    if (error) throw new Error(`Failed to reorder stages: ${error.message}`)
  }
}
