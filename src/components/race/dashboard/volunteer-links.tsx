'use client'

import { useState } from 'react'
import type { Database } from '@/lib/supabase/types'

type Stage = Database['openrace']['Tables']['stages']['Row']

interface VolunteerLinksProps {
  stages: Stage[]
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
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors shrink-0"
      aria-label={`Copy ${label} URL`}
    >
      {copied ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5 text-green-400"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5"
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

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-900 px-3 py-2.5">
      <span className="text-xs font-medium text-slate-400 w-24 shrink-0">{label}</span>
      <span className="flex-1 truncate text-xs text-slate-300 font-mono">{url}</span>
      <CopyButton url={url} label={label} />
    </div>
  )
}

export function VolunteerLinks({ stages, baseUrl }: VolunteerLinksProps) {
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 divide-y divide-slate-700">
      {stages.map((stage) => {
        const startUrl = `${baseUrl}/time/${stage.start_token}`
        const finishUrl = `${baseUrl}/time/${stage.finish_token}`

        return (
          <div key={stage.id} className="p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-200">
              Stage {stage.order + 1}: {stage.name}
            </p>
            <LinkRow label="Start Timer" url={startUrl} />
            <LinkRow label="Finish Timer" url={finishUrl} />
          </div>
        )
      })}
    </div>
  )
}
