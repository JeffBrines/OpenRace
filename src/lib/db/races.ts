import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { CreateRaceInput } from '@/lib/validators/race'
import { generateShareCode } from '@/lib/utils/tokens'

type Race = Database['openrace']['Tables']['races']['Row']

export async function createRace(
  supabase: SupabaseClient<Database, 'openrace'>,
  input: CreateRaceInput,
  organizerId: string
): Promise<Race> {
  const shareCode = generateShareCode(input.name)
  const { data, error } = await supabase
    .from('races')
    .insert({
      ...input,
      organizer_id: organizerId,
      share_code: shareCode,
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create race: ${error.message}`)
  return data
}

export async function getRacesByOrganizer(
  supabase: SupabaseClient<Database, 'openrace'>,
  organizerId: string
): Promise<Race[]> {
  const { data, error } = await supabase
    .from('races')
    .select()
    .eq('organizer_id', organizerId)
    .order('date', { ascending: false })
  if (error) throw new Error(`Failed to fetch races: ${error.message}`)
  return data
}

export async function getRaceByShareCode(
  supabase: SupabaseClient<Database, 'openrace'>,
  shareCode: string
): Promise<Race | null> {
  const { data, error } = await supabase
    .from('races')
    .select()
    .eq('share_code', shareCode)
    .single()
  if (error) return null
  return data
}

export async function getRaceById(
  supabase: SupabaseClient<Database, 'openrace'>,
  raceId: string
): Promise<Race | null> {
  const { data, error } = await supabase
    .from('races')
    .select()
    .eq('id', raceId)
    .single()
  if (error) return null
  return data
}

export async function updateRaceStatus(
  supabase: SupabaseClient<Database, 'openrace'>,
  raceId: string,
  status: 'draft' | 'active' | 'complete'
): Promise<Race> {
  const { data, error } = await supabase
    .from('races')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', raceId)
    .select()
    .single()
  if (error) throw new Error(`Failed to update race status: ${error.message}`)
  return data
}
