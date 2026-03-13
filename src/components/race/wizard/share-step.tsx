'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { createRaceAction } from '@/app/dashboard/create/actions'
import type { CreateRaceInput, CreateStageInput } from '@/lib/validators/race'
import type { CreateRiderInput } from '@/lib/validators/rider'

interface ShareStepProps {
  raceData: {
    race: CreateRaceInput
    stages: CreateStageInput[]
    riders: CreateRiderInput[]
  }
}

interface StageLinks {
  id: string
  name: string
  startUrl: string
  finishUrl: string
}

interface ShareData {
  publicResultsUrl: string
  stageLinks: StageLinks[]
}

type CopyState = Record<string, boolean>

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
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-green-400">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
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
      <span className="text-xs font-medium text-slate-400 w-16 shrink-0">{label}</span>
      <span className="flex-1 truncate text-xs text-slate-300 font-mono">{url}</span>
      <CopyButton url={url} label={label} />
    </div>
  )
}

export function ShareStep({ raceData }: ShareStepProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const submittedRef = useRef(false)

  async function submit() {
    setStatus('loading')
    setErrorMessage(null)

    const result = await createRaceAction(raceData)

    if (!result.success || !result.data) {
      setStatus('error')
      setErrorMessage(result.error ?? 'Something went wrong. Please try again.')
      return
    }

    const origin = window.location.origin
    const publicResultsUrl = `${origin}/r/${result.data.race.share_code}`
    const stageLinks: StageLinks[] = result.data.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      startUrl: `${origin}/time/${stage.start_token}`,
      finishUrl: `${origin}/time/${stage.finish_token}`,
    }))

    setShareData({ publicResultsUrl, stageLinks })
    setStatus('success')
  }

  useEffect(() => {
    if (submittedRef.current) return
    submittedRef.current = true
    submit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">Creating your race…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-red-400">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-200 mb-1">Race creation failed</h3>
          <p className="text-sm text-slate-400">{errorMessage}</p>
        </div>
        <button
          type="button"
          onClick={submit}
          className="rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2 text-sm font-semibold text-white transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!shareData) return null

  return (
    <div className="space-y-8">
      {/* Success header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-green-900/40 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-green-400">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">
            {raceData.race.name} is live!
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Share the links below with your volunteers and spectators.
          </p>
        </div>
      </div>

      {/* Public Results URL */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Public Results
        </h4>
        <LinkRow label="Results" url={shareData.publicResultsUrl} />
        <div className="flex justify-center pt-2">
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={shareData.publicResultsUrl} size={128} />
          </div>
        </div>
      </section>

      {/* Volunteer Links */}
      <section className="space-y-5">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Volunteer Timer Links
        </h4>

        {shareData.stageLinks.map((stage) => (
          <div key={stage.id} className="space-y-2">
            <p className="text-sm font-medium text-slate-200">{stage.name}</p>

            <LinkRow label="Start" url={stage.startUrl} />
            <div className="flex justify-center pt-1 pb-2">
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={stage.startUrl} size={112} />
              </div>
            </div>

            <LinkRow label="Finish" url={stage.finishUrl} />
            <div className="flex justify-center pt-1 pb-2">
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={stage.finishUrl} size={112} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Go to Dashboard */}
      <div className="pt-2 flex justify-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
