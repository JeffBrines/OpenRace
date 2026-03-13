// Must come before any idb imports so all IDB globals are registered
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import FDBFactory from 'fake-indexeddb/lib/FDBFactory'
import { saveTimeRecord, getTimeRecords, getPendingRecords, markSynced, deleteTimeRecord } from '../operations'
import { resetDb } from '../db'
import type { TimeRecordLocal } from '../db'

function makeRecord(overrides: Partial<TimeRecordLocal> = {}): TimeRecordLocal {
  return {
    id: 'test-uuid-1',
    stage_id: 'stage-1',
    rider_id: null,
    timestamp: 1_000_000,
    type: 'start',
    device_id: 'device-1',
    synced: false,
    created_at: 1_000_000,
    ...overrides,
  }
}

beforeEach(() => {
  // Replace the global indexedDB with a fresh factory for each test
  globalThis.indexedDB = new FDBFactory()
  resetDb()
})

describe('saveTimeRecord', () => {
  it('saves a time record and retrieves it by stage', async () => {
    const record = makeRecord()
    await saveTimeRecord(record)
    const records = await getTimeRecords('stage-1')
    expect(records).toContainEqual(record)
  })

  it('overwrites an existing record with the same id', async () => {
    const record = makeRecord()
    await saveTimeRecord(record)
    const updated = { ...record, timestamp: 9_999_999 }
    await saveTimeRecord(updated)
    const records = await getTimeRecords('stage-1')
    expect(records).toHaveLength(1)
    expect(records[0].timestamp).toBe(9_999_999)
  })
})

describe('getTimeRecords', () => {
  it('returns only records for the requested stage', async () => {
    await saveTimeRecord(makeRecord({ id: 'r1', stage_id: 'stage-1' }))
    await saveTimeRecord(makeRecord({ id: 'r2', stage_id: 'stage-2' }))
    const records = await getTimeRecords('stage-1')
    expect(records).toHaveLength(1)
    expect(records[0].id).toBe('r1')
  })

  it('returns an empty array when no records exist for stage', async () => {
    const records = await getTimeRecords('stage-nonexistent')
    expect(records).toEqual([])
  })
})

describe('getPendingRecords', () => {
  it('returns only unsynced records', async () => {
    await saveTimeRecord(makeRecord({ id: 'r-unsynced', synced: false }))
    await saveTimeRecord(makeRecord({ id: 'r-synced', synced: true }))
    const pending = await getPendingRecords()
    expect(pending).toHaveLength(1)
    expect(pending[0].id).toBe('r-unsynced')
  })

  it('returns empty array when all records are synced', async () => {
    await saveTimeRecord(makeRecord({ id: 'r1', synced: true }))
    const pending = await getPendingRecords()
    expect(pending).toEqual([])
  })

  it('returns all records when none are synced', async () => {
    await saveTimeRecord(makeRecord({ id: 'r1', synced: false }))
    await saveTimeRecord(makeRecord({ id: 'r2', stage_id: 'stage-2', synced: false }))
    const pending = await getPendingRecords()
    expect(pending).toHaveLength(2)
  })
})

describe('markSynced', () => {
  it('marks an existing record as synced', async () => {
    const record = makeRecord({ synced: false })
    await saveTimeRecord(record)
    await markSynced(record.id)
    const pending = await getPendingRecords()
    expect(pending).toHaveLength(0)
    const all = await getTimeRecords('stage-1')
    expect(all[0].synced).toBe(true)
  })

  it('does not throw when record id does not exist', async () => {
    await expect(markSynced('nonexistent-id')).resolves.toBeUndefined()
  })
})

describe('deleteTimeRecord', () => {
  it('removes a record from the store', async () => {
    const record = makeRecord()
    await saveTimeRecord(record)
    await deleteTimeRecord(record.id)
    const records = await getTimeRecords('stage-1')
    expect(records).toHaveLength(0)
  })

  it('does not throw when deleting a non-existent record', async () => {
    await expect(deleteTimeRecord('nonexistent-id')).resolves.toBeUndefined()
  })
})
