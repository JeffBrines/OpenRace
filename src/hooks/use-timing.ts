'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TimeRecordLocal } from '@/lib/offline/db'
import {
  captureTime,
  assignRiderToRecord,
  getStageTimeRecords,
} from '@/lib/timing/capture'
import { flushSyncQueue, startAutoSync, stopAutoSync } from '@/lib/offline/sync'
import { useConnection } from '@/hooks/use-connection'

const AUTO_SYNC_INTERVAL_MS = 5000

export interface UseTimingReturn {
  records: TimeRecordLocal[]
  unassigned: TimeRecordLocal[]
  isOnline: boolean
  pendingCount: number
  capture: (riderId?: string) => Promise<void>
  assignRider: (recordId: string, riderId: string) => Promise<void>
  syncNow: () => Promise<void>
}

export function useTiming(
  stageId: string,
  type: 'start' | 'finish'
): UseTimingReturn {
  const { isOnline } = useConnection()
  const [records, setRecords] = useState<TimeRecordLocal[]>([])

  const refreshRecords = useCallback(async () => {
    const all = await getStageTimeRecords(stageId)
    const filtered = all.filter((r) => r.type === type)
    setRecords(filtered)
  }, [stageId, type])

  useEffect(() => {
    refreshRecords().catch(() => {
      // Silently ignore initial load errors — will retry on next action
    })
    startAutoSync(AUTO_SYNC_INTERVAL_MS)

    return () => {
      stopAutoSync()
    }
  }, [refreshRecords])

  const capture = useCallback(
    async (riderId?: string) => {
      await captureTime(stageId, type, riderId ?? null)
      await refreshRecords()
    },
    [stageId, type, refreshRecords]
  )

  const assignRider = useCallback(
    async (recordId: string, riderId: string) => {
      await assignRiderToRecord(recordId, riderId)
      await refreshRecords()
    },
    [refreshRecords]
  )

  const syncNow = useCallback(async () => {
    await flushSyncQueue()
    await refreshRecords()
  }, [refreshRecords])

  const unassigned = records.filter((r) => r.rider_id === null)
  const pendingCount = records.filter((r) => !r.synced).length

  return {
    records,
    unassigned,
    isOnline,
    pendingCount,
    capture,
    assignRider,
    syncNow,
  }
}
