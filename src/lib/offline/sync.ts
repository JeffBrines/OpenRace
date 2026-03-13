import { createClient } from '@/lib/supabase/client'
import { getPendingRecords, markSynced } from './operations'
import { upsertTimeRecord } from '@/lib/db/time-records'

export interface SyncResult {
  synced: number
  failed: number
  total: number
}

export async function flushSyncQueue(): Promise<SyncResult> {
  const supabase = createClient()
  const pending = await getPendingRecords()
  let synced = 0
  let failed = 0

  for (const record of pending) {
    try {
      await upsertTimeRecord(supabase, {
        id: record.id,
        stage_id: record.stage_id,
        rider_id: record.rider_id,
        timestamp: record.timestamp,
        type: record.type,
        device_id: record.device_id,
      })
      await markSynced(record.id)
      synced++
    } catch {
      failed++
    }
  }

  return { synced, failed, total: pending.length }
}

let autoSyncIntervalId: ReturnType<typeof setInterval> | null = null

export function startAutoSync(intervalMs: number = 5000): void {
  if (autoSyncIntervalId !== null) {
    stopAutoSync()
  }
  autoSyncIntervalId = setInterval(() => {
    flushSyncQueue().catch(() => {
      // Silently ignore errors — next interval will retry
    })
  }, intervalMs)
}

export function stopAutoSync(): void {
  if (autoSyncIntervalId !== null) {
    clearInterval(autoSyncIntervalId)
    autoSyncIntervalId = null
  }
}
