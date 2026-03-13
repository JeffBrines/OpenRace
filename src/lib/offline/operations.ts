import { getDb, type TimeRecordLocal } from './db'

export async function saveTimeRecord(record: TimeRecordLocal): Promise<void> {
  const db = await getDb()
  await db.put('timeRecords', record)
}

export async function getTimeRecords(stageId: string): Promise<TimeRecordLocal[]> {
  const db = await getDb()
  return db.getAllFromIndex('timeRecords', 'by-stage', stageId)
}

export async function getPendingRecords(): Promise<TimeRecordLocal[]> {
  const db = await getDb()
  const all = await db.getAll('timeRecords')
  return all.filter((r) => !r.synced)
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDb()
  const record = await db.get('timeRecords', id)
  if (record) {
    await db.put('timeRecords', { ...record, synced: true })
  }
}

export async function deleteTimeRecord(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('timeRecords', id)
}
