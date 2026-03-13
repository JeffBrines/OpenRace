import { saveTimeRecord, getTimeRecords } from '@/lib/offline/operations'
import { getDb } from '@/lib/offline/db'
import { getDeviceId } from '@/lib/utils/device-id'
import type { TimeRecordLocal } from '@/lib/offline/db'

/**
 * Captures a timestamp for a stage and stores it in IndexedDB.
 * Returns the newly created time record.
 */
export async function captureTime(
  stageId: string,
  type: 'start' | 'finish',
  riderId?: string | null
): Promise<TimeRecordLocal> {
  const now = Date.now()
  const record: TimeRecordLocal = {
    id: crypto.randomUUID(),
    stage_id: stageId,
    rider_id: riderId ?? null,
    timestamp: now,
    type,
    device_id: getDeviceId(),
    synced: false,
    created_at: now,
  }
  await saveTimeRecord(record)
  return record
}

/**
 * Assigns a rider to an existing unassigned time record.
 * Marks the record as unsynced so it will be re-uploaded.
 */
export async function assignRiderToRecord(
  recordId: string,
  riderId: string
): Promise<void> {
  const db = await getDb()
  const record = await db.get('timeRecords', recordId)
  if (!record) throw new Error('Time record not found')
  await saveTimeRecord({ ...record, rider_id: riderId, synced: false })
}

/**
 * Returns all time records for a stage, sorted by timestamp ascending.
 */
export async function getStageTimeRecords(
  stageId: string
): Promise<TimeRecordLocal[]> {
  const records = await getTimeRecords(stageId)
  return [...records].sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Returns unassigned time records (rider_id === null) for a stage,
 * sorted by timestamp ascending.
 */
export async function getUnassignedRecords(
  stageId: string
): Promise<TimeRecordLocal[]> {
  const records = await getStageTimeRecords(stageId)
  return records.filter((r) => r.rider_id === null)
}
