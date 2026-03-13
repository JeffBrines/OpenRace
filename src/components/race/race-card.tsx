'use client'

import Link from 'next/link'
import type { Database } from '@/lib/supabase/types'

type Race = Database['openrace']['Tables']['races']['Row']

interface RaceCardProps {
  race: Race
}

const TYPE_LABELS: Record<Race['type'], string> = {
  enduro: 'Enduro',
  dh: 'DH',
  xc: 'XC',
}

const STATUS_STYLES: Record<Race['status'], string> = {
  draft: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700',
  active: 'bg-green-900/40 text-green-400 border border-green-700',
  complete: 'bg-blue-900/40 text-blue-400 border border-blue-700',
}

const STATUS_LABELS: Record<Race['status'], string> = {
  draft: 'Draft',
  active: 'Active',
  complete: 'Complete',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function RaceCard({ race }: RaceCardProps) {
  return (
    <Link
      href={`/dashboard/${race.id}`}
      className="block rounded-xl bg-slate-800 border border-slate-700 p-5 hover:bg-slate-750 hover:border-slate-600 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-slate-100 group-hover:text-white leading-tight">
          {race.name}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[race.status]}`}
        >
          {STATUS_LABELS[race.status]}
        </span>
      </div>

      <div className="space-y-1.5 text-sm text-slate-400">
        <p>{formatDate(race.date)}</p>

        {race.location && <p>{race.location}</p>}
      </div>

      <div className="mt-4">
        <span className="inline-block rounded-md border border-slate-600 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          {TYPE_LABELS[race.type]}
        </span>
      </div>
    </Link>
  )
}
