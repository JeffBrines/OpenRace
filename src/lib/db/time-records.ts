import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { CreateTimeRecordInput } from '@/lib/validators/time-record'

type TimeRecord = Database['public']['Tables']['time_records']['Row']

export async function upsertTimeRecord(
  supabase: SupabaseClient<Database>,
  input: CreateTimeRecordInput
): Promise<TimeRecord> {
  const { data, error } = await supabase
    .from('time_records')
    .upsert(input, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw new Error(`Failed to upsert time record: ${error.message}`)
  return data
}

export async function assignRider(
  supabase: SupabaseClient<Database>,
  timeRecordId: string,
  riderId: string
): Promise<TimeRecord> {
  const { data, error } = await supabase
    .from('time_records')
    .update({ rider_id: riderId })
    .eq('id', timeRecordId)
    .select()
    .single()
  if (error) throw new Error(`Failed to assign rider: ${error.message}`)
  return data
}

export async function getTimeRecordsByStage(
  supabase: SupabaseClient<Database>,
  stageId: string,
  type?: 'start' | 'finish'
): Promise<TimeRecord[]> {
  let query = supabase
    .from('time_records')
    .select()
    .eq('stage_id', stageId)
    .order('timestamp', { ascending: true })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch time records: ${error.message}`)
  return data
}

export async function getUnassignedByStage(
  supabase: SupabaseClient<Database>,
  stageId: string
): Promise<TimeRecord[]> {
  const { data, error } = await supabase
    .from('time_records')
    .select()
    .eq('stage_id', stageId)
    .is('rider_id', null)
    .order('timestamp', { ascending: true })
  if (error) throw new Error(`Failed to fetch unassigned records: ${error.message}`)
  return data
}
