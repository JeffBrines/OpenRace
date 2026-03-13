import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

interface StageResultRow {
  rider_id: string
  stage_id: string
  race_id: string
  start_time: number | null
  finish_time: number | null
  elapsed_ms: number | null
  status: string
}

interface RaceResultRow {
  rider_id: string
  race_id: string
  category: string
  total_time_ms: number | null
  stage_results: { stage_id: string; elapsed_ms: number | null; status: string }[]
  has_dnf: boolean
  overall_rank: number
  category_rank: number
  rider_name: string
  rider_bib: string | null
  rider_gender: string
}

interface FastestSplits {
  [category: string]: { [stageId: string]: number }
}

export async function getStageResults(
  supabase: SupabaseClient<Database>,
  stageId: string
): Promise<StageResultRow[]> {
  const { data, error } = await supabase
    .from('stage_results')
    .select('*')
    .eq('stage_id', stageId)
  if (error) throw new Error(`Failed to fetch stage results: ${error.message}`)
  return data as unknown as StageResultRow[]
}

export async function getRaceResults(
  supabase: SupabaseClient<Database>,
  raceId: string
): Promise<{ results: RaceResultRow[]; fastestSplits: FastestSplits }> {
  const { data, error } = await supabase
    .from('race_results')
    .select('*, riders!inner(name, bib, gender)')
    .eq('race_id', raceId)

  if (error) throw new Error(`Failed to fetch race results: ${error.message}`)

  const results: RaceResultRow[] = (data as any[]).map((row) => ({
    rider_id: row.rider_id,
    race_id: row.race_id,
    category: row.category,
    total_time_ms: row.total_time_ms,
    stage_results: row.stage_results,
    has_dnf: row.has_dnf,
    overall_rank: row.overall_rank,
    category_rank: row.category_rank,
    rider_name: row.riders.name,
    rider_bib: row.riders.bib,
    rider_gender: row.riders.gender,
  }))

  // Compute fastest splits per category + stage
  const fastestSplits: FastestSplits = {}
  for (const result of results) {
    if (!fastestSplits[result.category]) {
      fastestSplits[result.category] = {}
    }
    for (const sr of result.stage_results) {
      if (sr.elapsed_ms !== null && sr.status === 'ok') {
        const current = fastestSplits[result.category][sr.stage_id]
        if (current === undefined || sr.elapsed_ms < current) {
          fastestSplits[result.category][sr.stage_id] = sr.elapsed_ms
        }
      }
    }
  }

  return { results, fastestSplits }
}

export async function getRiderResult(
  supabase: SupabaseClient<Database>,
  raceId: string,
  riderId: string
): Promise<{ result: RaceResultRow; stageDetails: StageResultRow[] } | null> {
  // Get the rider's overall result
  const { data: raceResult, error: raceError } = await supabase
    .from('race_results')
    .select('*, riders!inner(name, bib, gender)')
    .eq('race_id', raceId)
    .eq('rider_id', riderId)
    .single()

  if (raceError || !raceResult) return null

  const result: RaceResultRow = {
    rider_id: raceResult.rider_id,
    race_id: raceResult.race_id,
    category: raceResult.category,
    total_time_ms: raceResult.total_time_ms,
    stage_results: raceResult.stage_results as any,
    has_dnf: raceResult.has_dnf,
    overall_rank: raceResult.overall_rank,
    category_rank: raceResult.category_rank,
    rider_name: (raceResult as any).riders.name,
    rider_bib: (raceResult as any).riders.bib,
    rider_gender: (raceResult as any).riders.gender,
  }

  // Get stage-by-stage breakdown
  const { data: stageDetails, error: stageError } = await supabase
    .from('stage_results')
    .select('*')
    .eq('race_id', raceId)
    .eq('rider_id', riderId)

  if (stageError) throw new Error(`Failed to fetch stage details: ${stageError.message}`)

  return { result, stageDetails: stageDetails as unknown as StageResultRow[] }
}

export type { StageResultRow, RaceResultRow, FastestSplits }
