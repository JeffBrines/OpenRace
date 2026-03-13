// Must come before any idb imports so all IDB globals are registered
import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FDBFactory from 'fake-indexeddb/lib/FDBFactory'
import { resetDb } from '@/lib/offline/db'
import { captureTime, assignRiderToRecord, getStageTimeRecords, getUnassignedRecords } from '../capture'

vi.mock('@/lib/utils/device-id', () => ({
  getDeviceId: vi.fn(() => 'test-device-id'),
}))

beforeEach(() => {
  globalThis.indexedDB = new FDBFactory()
  resetDb()
})

describe('captureTime', () => {
  it('creates a time record with correct fields', async () => {
    const record = await captureTime('stage-1', 'start', 'rider-42')

    expect(record.stage_id).toBe('stage-1')
    expect(record.type).toBe('start')
    expect(record.rider_id).toBe('rider-42')
    expect(record.device_id).toBe('test-device-id')
    expect(record.synced).toBe(false)
    expect(typeof record.id).toBe('string')
    expect(record.id.length).toBeGreaterThan(0)
    expect(typeof record.timestamp).toBe('number')
    expect(record.timestamp).toBeGreaterThan(0)
    expect(typeof record.created_at).toBe('number')
    expect(record.created_at).toBeGreaterThan(0)
  })

  it('stores the record in IndexedDB (retrievable)', async () => {
    const record = await captureTime('stage-2', 'finish', 'rider-99')
    const records = await getStageTimeRecords('stage-2')
    expect(records).toHaveLength(1)
    expect(records[0].id).toBe(record.id)
  })

  it('sets rider_id when riderId is provided', async () => {
    const record = await captureTime('stage-1', 'start', 'rider-7')
    expect(record.rider_id).toBe('rider-7')
  })

  it('sets rider_id to null when riderId is omitted', async () => {
    const record = await captureTime('stage-1', 'finish')
    expect(record.rider_id).toBeNull()
  })

  it('sets rider_id to null when riderId is explicitly null', async () => {
    const record = await captureTime('stage-1', 'start', null)
    expect(record.rider_id).toBeNull()
  })
})

describe('assignRiderToRecord', () => {
  it('updates rider_id on an existing record', async () => {
    const record = await captureTime('stage-1', 'finish')
    expect(record.rider_id).toBeNull()

    await assignRiderToRecord(record.id, 'rider-55')

    const records = await getStageTimeRecords('stage-1')
    const updated = records.find((r) => r.id === record.id)
    expect(updated?.rider_id).toBe('rider-55')
  })

  it('marks the record as unsynced after assignment', async () => {
    const record = await captureTime('stage-1', 'start')

    await assignRiderToRecord(record.id, 'rider-10')

    const records = await getStageTimeRecords('stage-1')
    const updated = records.find((r) => r.id === record.id)
    expect(updated?.synced).toBe(false)
  })

  it('throws when record id does not exist', async () => {
    await expect(assignRiderToRecord('nonexistent-id', 'rider-1')).rejects.toThrow(
      'Time record not found'
    )
  })
})

describe('getStageTimeRecords', () => {
  it('returns records sorted by timestamp ascending', async () => {
    // Capture with slight delays to get distinct timestamps would be flaky,
    // so we save records directly with known timestamps via captureTime then
    // patch indirectly. Instead use saveTimeRecord from operations directly.
    const { saveTimeRecord } = await import('@/lib/offline/operations')

    await saveTimeRecord({
      id: 'r-c',
      stage_id: 'stage-sort',
      rider_id: null,
      timestamp: 3000,
      type: 'finish',
      device_id: 'dev',
      synced: false,
      created_at: 3000,
    })
    await saveTimeRecord({
      id: 'r-a',
      stage_id: 'stage-sort',
      rider_id: null,
      timestamp: 1000,
      type: 'start',
      device_id: 'dev',
      synced: false,
      created_at: 1000,
    })
    await saveTimeRecord({
      id: 'r-b',
      stage_id: 'stage-sort',
      rider_id: null,
      timestamp: 2000,
      type: 'finish',
      device_id: 'dev',
      synced: false,
      created_at: 2000,
    })

    const records = await getStageTimeRecords('stage-sort')
    expect(records).toHaveLength(3)
    expect(records[0].id).toBe('r-a')
    expect(records[1].id).toBe('r-b')
    expect(records[2].id).toBe('r-c')
  })

  it('returns only records for the requested stage', async () => {
    await captureTime('stage-A', 'start')
    await captureTime('stage-B', 'finish')

    const records = await getStageTimeRecords('stage-A')
    expect(records).toHaveLength(1)
    expect(records[0].stage_id).toBe('stage-A')
  })

  it('returns empty array when no records exist for stage', async () => {
    const records = await getStageTimeRecords('stage-empty')
    expect(records).toEqual([])
  })
})

describe('getUnassignedRecords', () => {
  it('returns only records where rider_id is null', async () => {
    await captureTime('stage-1', 'start', null)
    await captureTime('stage-1', 'finish', 'rider-assigned')

    const unassigned = await getUnassignedRecords('stage-1')
    expect(unassigned).toHaveLength(1)
    expect(unassigned[0].rider_id).toBeNull()
  })

  it('returns empty array when all records have a rider assigned', async () => {
    await captureTime('stage-1', 'start', 'rider-1')
    await captureTime('stage-1', 'finish', 'rider-2')

    const unassigned = await getUnassignedRecords('stage-1')
    expect(unassigned).toEqual([])
  })

  it('returns empty array when stage has no records', async () => {
    const unassigned = await getUnassignedRecords('stage-none')
    expect(unassigned).toEqual([])
  })
})
