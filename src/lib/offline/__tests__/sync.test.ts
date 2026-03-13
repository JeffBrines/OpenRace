// Must come before any idb imports so all IDB globals are registered
import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import FDBFactory from 'fake-indexeddb/lib/FDBFactory'
import { resetDb } from '../db'
import { saveTimeRecord } from '../operations'
import type { TimeRecordLocal } from '../db'

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}))

// Mock upsertTimeRecord
vi.mock('@/lib/db/time-records', () => ({
  upsertTimeRecord: vi.fn(),
}))

import { upsertTimeRecord } from '@/lib/db/time-records'
import { flushSyncQueue, startAutoSync, stopAutoSync } from '../sync'

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
  globalThis.indexedDB = new FDBFactory()
  resetDb()
  vi.clearAllMocks()
})

afterEach(() => {
  stopAutoSync()
})

describe('flushSyncQueue', () => {
  it('syncs pending records and marks them as synced', async () => {
    const record = makeRecord({ id: 'r1', synced: false })
    await saveTimeRecord(record)

    vi.mocked(upsertTimeRecord).mockResolvedValueOnce({} as never)

    const result = await flushSyncQueue()

    expect(upsertTimeRecord).toHaveBeenCalledOnce()
    expect(upsertTimeRecord).toHaveBeenCalledWith(
      {},
      {
        id: record.id,
        stage_id: record.stage_id,
        rider_id: record.rider_id,
        timestamp: record.timestamp,
        type: record.type,
        device_id: record.device_id,
      }
    )
    expect(result.synced).toBe(1)
    expect(result.failed).toBe(0)
    expect(result.total).toBe(1)
  })

  it('skips failed records without crashing', async () => {
    const record = makeRecord({ id: 'r1', synced: false })
    await saveTimeRecord(record)

    vi.mocked(upsertTimeRecord).mockRejectedValueOnce(new Error('Network error'))

    const result = await flushSyncQueue()

    expect(result.synced).toBe(0)
    expect(result.failed).toBe(1)
    expect(result.total).toBe(1)
  })

  it('returns correct counts with mixed success and failure', async () => {
    await saveTimeRecord(makeRecord({ id: 'r1', synced: false }))
    await saveTimeRecord(makeRecord({ id: 'r2', stage_id: 'stage-2', synced: false }))
    await saveTimeRecord(makeRecord({ id: 'r3', stage_id: 'stage-3', synced: false }))

    vi.mocked(upsertTimeRecord)
      .mockResolvedValueOnce({} as never)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({} as never)

    const result = await flushSyncQueue()

    expect(result.synced).toBe(2)
    expect(result.failed).toBe(1)
    expect(result.total).toBe(3)
  })

  it('returns zeros when there are no pending records', async () => {
    const result = await flushSyncQueue()

    expect(upsertTimeRecord).not.toHaveBeenCalled()
    expect(result.synced).toBe(0)
    expect(result.failed).toBe(0)
    expect(result.total).toBe(0)
  })

  it('does not re-sync already synced records', async () => {
    await saveTimeRecord(makeRecord({ id: 'r1', synced: true }))

    const result = await flushSyncQueue()

    expect(upsertTimeRecord).not.toHaveBeenCalled()
    expect(result.total).toBe(0)
  })

  it('marks a successfully synced record so it is not pending on the next flush', async () => {
    const record = makeRecord({ id: 'r1', synced: false })
    await saveTimeRecord(record)

    vi.mocked(upsertTimeRecord).mockResolvedValue({} as never)

    await flushSyncQueue()

    // Second flush should find no pending records
    const second = await flushSyncQueue()
    expect(second.total).toBe(0)
  })
})

describe('startAutoSync / stopAutoSync', () => {
  it('calls flushSyncQueue on an interval and can be stopped', () => {
    // Use a spy on flushSyncQueue by mocking the module-level interval behaviour.
    // We verify startAutoSync registers an interval and stopAutoSync clears it
    // without actually running timers (to avoid fake-indexeddb scheduling conflicts).
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    startAutoSync(1000)
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000)

    stopAutoSync()
    expect(clearIntervalSpy).toHaveBeenCalled()

    setIntervalSpy.mockRestore()
    clearIntervalSpy.mockRestore()
  })

  it('stopAutoSync is a no-op when auto-sync is not running', () => {
    // Should not throw
    expect(() => stopAutoSync()).not.toThrow()
  })

  it('starting auto-sync twice replaces the first interval', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    startAutoSync(1000)
    startAutoSync(2000)

    // The first interval should have been cleared when the second was started
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1)

    stopAutoSync()
    clearIntervalSpy.mockRestore()
  })
})
