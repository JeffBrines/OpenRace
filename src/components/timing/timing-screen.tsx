'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTiming } from '@/hooks/use-timing'
import { formatTimestamp } from '@/lib/utils/time-format'
import type { Database } from '@/lib/supabase/types'
import type { TimeRecordLocal } from '@/lib/offline/db'

type Stage = Database['openrace']['Tables']['stages']['Row']
type Race = Database['openrace']['Tables']['races']['Row']
type Rider = Database['openrace']['Tables']['riders']['Row']

export interface TimingScreenProps {
  stage: Stage
  role: 'start' | 'finish'
  race: Race
  riders: Rider[]
}

type TimingMode = 'normal' | 'rapid'

// ─── Rider Picker Modal ────────────────────────────────────────────────────

interface RiderPickerProps {
  riders: Rider[]
  onSelect: (riderId: string) => void
  onClose: () => void
}

function RiderPicker({ riders, onSelect, onClose }: RiderPickerProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered = riders.filter((r) => {
    const q = query.toLowerCase()
    const nameMatch = r.name.toLowerCase().includes(q)
    const bibMatch = r.bib?.toLowerCase().includes(q) ?? false
    return nameMatch || bibMatch
  })

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Assign rider"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">Assign Rider</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-700">
        <input
          ref={inputRef}
          type="search"
          placeholder="Search by name or bib…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
      </div>

      {/* Rider list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-slate-500 text-sm">No riders found</p>
        ) : (
          <ul>
            {filtered.map((rider) => (
              <li key={rider.id}>
                <button
                  type="button"
                  onClick={() => onSelect(rider.id)}
                  className="w-full flex items-center gap-3 px-4 py-4 border-b border-slate-800 hover:bg-slate-800 active:bg-slate-700 transition-colors text-left"
                >
                  {rider.bib && (
                    <span className="shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-200">
                      {rider.bib}
                    </span>
                  )}
                  <div>
                    <p className="text-white font-medium">{rider.name}</p>
                    <p className="text-xs text-slate-400">{rider.category}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Stamp Row ─────────────────────────────────────────────────────────────

interface StampRowProps {
  record: TimeRecordLocal
  riders: Rider[]
  onAssign: () => void
  synced: boolean
}

function StampRow({ record, riders, onAssign, synced }: StampRowProps) {
  const rider = riders.find((r) => r.id === record.rider_id)

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-800 last:border-0">
      {/* Sync indicator */}
      <span
        className={`shrink-0 w-2 h-2 rounded-full ${synced ? 'bg-green-500' : 'bg-yellow-500'}`}
        title={synced ? 'Synced' : 'Pending sync'}
      />

      {/* Timestamp */}
      <span className="shrink-0 font-mono text-sm text-slate-300 tabular-nums">
        {formatTimestamp(record.timestamp)}
      </span>

      {/* Rider or assign button */}
      {rider ? (
        <span className="flex-1 text-sm text-white truncate">
          {rider.bib ? `#${rider.bib} ` : ''}{rider.name}
        </span>
      ) : (
        <button
          type="button"
          onClick={onAssign}
          className="flex-1 text-left text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          Unassigned — <span className="underline">Assign</span>
        </button>
      )}
    </div>
  )
}

// ─── Live Clock ────────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="font-mono text-2xl text-slate-300 tabular-nums">
      {formatTimestamp(now)}
    </span>
  )
}

// ─── Main Timing Screen ────────────────────────────────────────────────────

export function TimingScreen({ stage, role, race, riders }: TimingScreenProps) {
  const { records, pendingCount, isOnline, capture, assignRider } = useTiming(stage.id, role)

  const [mode, setMode] = useState<TimingMode>('rapid')
  const [stamping, setStamping] = useState(false)
  const [assigningRecordId, setAssigningRecordId] = useState<string | null>(null)
  const [showPickerForCapture, setShowPickerForCapture] = useState(false)

  const isStart = role === 'start'
  const accentColor = isStart
    ? { btn: 'bg-green-600 active:bg-green-500', ring: 'focus:ring-green-500', badge: 'bg-green-900/50 text-green-400 border-green-700' }
    : { btn: 'bg-red-600 active:bg-red-500', ring: 'focus:ring-red-500', badge: 'bg-red-900/50 text-red-400 border-red-700' }

  const handleStamp = useCallback(async () => {
    if (stamping) return
    setStamping(true)

    try {
      if (mode === 'normal') {
        // Capture without rider, then immediately open picker
        await capture()
        setShowPickerForCapture(true)
      } else {
        await capture()
      }
    } finally {
      // Brief visual feedback delay
      setTimeout(() => setStamping(false), 200)
    }
  }, [stamping, mode, capture])

  // After normal-mode capture, the most recent record is the one we just added
  const handleNormalModeAssign = useCallback(
    async (riderId: string) => {
      const latest = [...records].sort((a, b) => b.timestamp - a.timestamp)[0]
      if (!latest) {
        setShowPickerForCapture(false)
        return
      }
      await assignRider(latest.id, riderId)
      setShowPickerForCapture(false)
    },
    [records, assignRider]
  )

  const handleAssignFromRow = useCallback(
    async (riderId: string) => {
      if (!assigningRecordId) return
      await assignRider(assigningRecordId, riderId)
      setAssigningRecordId(null)
    },
    [assigningRecordId, assignRider]
  )

  const sorted = [...records].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-xs text-slate-400 truncate">{race.name}</p>
          <p className="text-sm font-semibold text-white truncate">{stage.name}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Pending sync badge */}
          {pendingCount > 0 && (
            <span className="rounded-full bg-yellow-900/60 border border-yellow-700 px-2 py-0.5 text-xs font-medium text-yellow-400">
              {pendingCount} pending
            </span>
          )}

          {/* Role badge */}
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide ${accentColor.badge}`}>
            {role.toUpperCase()}
          </span>

          {/* Connection dot */}
          <span
            className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
            title={isOnline ? 'Online' : 'Offline'}
          />
        </div>
      </header>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 px-4 pt-4">
        <button
          type="button"
          onClick={() => setMode('rapid')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            mode === 'rapid'
              ? 'bg-slate-700 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Rapid
        </button>
        <button
          type="button"
          onClick={() => setMode('normal')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            mode === 'normal'
              ? 'bg-slate-700 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Assign Now
        </button>
      </div>

      {/* Main stamp area */}
      <div className="flex flex-col items-center gap-6 px-4 pt-8 pb-6">
        {/* Big stamp button */}
        <button
          type="button"
          onClick={handleStamp}
          disabled={stamping}
          className={`
            w-full max-w-sm h-36 rounded-2xl text-white text-3xl font-extrabold tracking-wide
            shadow-lg transition-all duration-100
            ${accentColor.btn} ${accentColor.ring}
            focus:outline-none focus:ring-4
            ${stamping ? 'scale-95 opacity-80' : 'scale-100 opacity-100 hover:brightness-110'}
          `}
          aria-label="Stamp time"
        >
          {stamping ? '✓' : 'STAMP TIME'}
        </button>

        {/* Live clock */}
        <LiveClock />
      </div>

      {/* Recent stamps */}
      <div className="flex-1 px-4 pb-8">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Recent — {records.length} stamp{records.length !== 1 ? 's' : ''}
        </h2>

        {sorted.length === 0 ? (
          <p className="py-8 text-center text-slate-600 text-sm">
            No stamps yet. Tap the button above to begin.
          </p>
        ) : (
          <div className="rounded-xl bg-slate-800 border border-slate-700 px-4">
            {sorted.map((record) => (
              <StampRow
                key={record.id}
                record={record}
                riders={riders}
                synced={record.synced}
                onAssign={() => setAssigningRecordId(record.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Rider picker — for assign-from-row */}
      {assigningRecordId !== null && (
        <RiderPicker
          riders={riders}
          onSelect={handleAssignFromRow}
          onClose={() => setAssigningRecordId(null)}
        />
      )}

      {/* Rider picker — for normal mode post-capture */}
      {showPickerForCapture && (
        <RiderPicker
          riders={riders}
          onSelect={handleNormalModeAssign}
          onClose={() => setShowPickerForCapture(false)}
        />
      )}
    </div>
  )
}
