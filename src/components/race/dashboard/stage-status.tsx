'use client'

import { useState } from 'react'
import type { Database } from '@/lib/supabase/types'

type Stage = Database['openrace']['Tables']['stages']['Row']

interface StageStatusProps {
  stage: Stage
  raceStatus: string
  baseUrl: string
}

function CopyButton({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
      aria-label={`Copy ${label} URL`}
    >
      {copied ? (
        <span className="text-green-400">Copied!</span>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3 h-3"
          >
            <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
            <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

function TimerLinkRow({
  label,
  url,
}: {
  label: 'Start' | 'Finish'
  url: string
}) {
  const colorClass =
    label === 'Start'
      ? 'text-green-400 bg-green-900/20 border-green-800'
      : 'text-red-400 bg-red-900/20 border-red-800'

  return (
    <div className="flex items-center gap-2">
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold border ${colorClass}`}
      >
        {label}
      </span>
      <span className="flex-1 truncate text-xs text-slate-400 font-mono">{url}</span>
      <CopyButton url={url} label={label} />
    </div>
  )
}

export function StageStatus({ stage, raceStatus, baseUrl }: StageStatusProps) {
  const startUrl = `${baseUrl}/time/${stage.start_token}`
  const finishUrl = `${baseUrl}/time/${stage.finish_token}`

  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Stage {stage.order + 1}
          </p>
          <h3 className="text-sm font-semibold text-slate-100 mt-0.5">{stage.name}</h3>
        </div>
        {(stage.distance !== null || stage.elevation !== null) && (
          <div className="text-right shrink-0">
            {stage.distance !== null && (
              <p className="text-xs text-slate-400">{stage.distance} km</p>
            )}
            {stage.elevation !== null && (
              <p className="text-xs text-slate-400">{stage.elevation} m</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1.5 pt-1 border-t border-slate-700">
        <p className="text-xs font-medium text-slate-500 mb-2">Timer Links</p>
        <TimerLinkRow label="Start" url={startUrl} />
        <TimerLinkRow label="Finish" url={finishUrl} />
      </div>

      {raceStatus === 'active' && (
        <div className="flex items-center gap-1.5 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Live</span>
        </div>
      )}
    </div>
  )
}
