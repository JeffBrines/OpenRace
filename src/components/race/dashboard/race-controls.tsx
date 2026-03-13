'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateRaceStatusAction } from '@/app/dashboard/[raceId]/actions'

interface RaceControlsProps {
  raceId: string
  currentStatus: 'draft' | 'active' | 'complete'
}

export function RaceControls({ raceId, currentStatus }: RaceControlsProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)

  async function handleStatusChange(nextStatus: 'draft' | 'active' | 'complete') {
    setPending(true)
    setError(null)
    setConfirmEnd(false)

    try {
      const result = await updateRaceStatusAction(raceId, nextStatus)
      if (!result.success) {
        setError(result.error ?? 'Failed to update race status.')
      } else {
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setPending(false)
    }
  }

  if (currentStatus === 'complete') {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-900/40 border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
              clipRule="evenodd"
            />
          </svg>
          Race Complete
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {currentStatus === 'draft' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => handleStatusChange('active')}
          className="inline-flex items-center gap-2 rounded-lg bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 text-sm font-semibold text-white transition-colors"
        >
          {pending ? (
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm6.39-2.908a.75.75 0 0 1 .766.027l3.5 2.25a.75.75 0 0 1 0 1.262l-3.5 2.25A.75.75 0 0 1 8 12.25v-4.5a.75.75 0 0 1 .39-.658Z"
                clipRule="evenodd"
              />
            </svg>
          )}
          Start Race
        </button>
      )}

      {currentStatus === 'active' && !confirmEnd && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmEnd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-red-800 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 text-sm font-semibold text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm5.25-2.25a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Zm4.5 0a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Z"
              clipRule="evenodd"
            />
          </svg>
          End Race
        </button>
      )}

      {currentStatus === 'active' && confirmEnd && (
        <div className="flex items-center gap-3 rounded-lg border border-red-700 bg-red-900/20 px-4 py-2.5">
          <p className="text-sm text-red-300">End race and lock timing?</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => handleStatusChange('complete')}
            className="rounded-md bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 text-xs font-semibold text-white transition-colors"
          >
            {pending ? 'Ending…' : 'Confirm'}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmEnd(false)}
            className="rounded-md border border-slate-600 px-3 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
