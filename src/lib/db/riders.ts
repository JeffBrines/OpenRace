import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { CreateRiderInput } from '@/lib/validators/rider'

type Rider = Database['openrace']['Tables']['riders']['Row']

export async function createRider(
  supabase: SupabaseClient<Database>,
  raceId: string,
  input: CreateRiderInput
): Promise<Rider> {
  const { data, error } = await supabase
    .from('riders')
    .insert({ ...input, race_id: raceId })
    .select()
    .single()
  if (error) throw new Error(`Failed to create rider: ${error.message}`)
  return data
}

export async function createRidersBatch(
  supabase: SupabaseClient<Database>,
  raceId: string,
  inputs: CreateRiderInput[]
): Promise<Rider[]> {
  const rows = inputs.map((input) => ({ ...input, race_id: raceId }))
  const { data, error } = await supabase
    .from('riders')
    .insert(rows)
    .select()
  if (error) throw new Error(`Failed to create riders: ${error.message}`)
  return data
}

export async function getRidersByRace(
  supabase: SupabaseClient<Database>,
  raceId: string
): Promise<Rider[]> {
  const { data, error } = await supabase
    .from('riders')
    .select()
    .eq('race_id', raceId)
    .order('name', { ascending: true })
  if (error) throw new Error(`Failed to fetch riders: ${error.message}`)
  return data
}

export async function updateRider(
  supabase: SupabaseClient<Database>,
  riderId: string,
  input: Partial<CreateRiderInput>
): Promise<Rider> {
  const { data, error } = await supabase
    .from('riders')
    .update(input)
    .eq('id', riderId)
    .select()
    .single()
  if (error) throw new Error(`Failed to update rider: ${error.message}`)
  return data
}

export async function deleteRider(
  supabase: SupabaseClient<Database>,
  riderId: string
): Promise<void> {
  const { error } = await supabase
    .from('riders')
    .delete()
    .eq('id', riderId)
  if (error) throw new Error(`Failed to delete rider: ${error.message}`)
}
