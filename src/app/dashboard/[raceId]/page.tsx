import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRaceById } from '@/lib/db/races'
import { getStagesByRace } from '@/lib/db/stages'
import { getRidersByRace } from '@/lib/db/riders'
import { RaceControls } from '@/components/race/dashboard/race-controls'
import { StageStatus } from '@/components/race/dashboard/stage-status'
import { VolunteerLinks } from '@/components/race/dashboard/volunteer-links'
import type { Database } from '@/lib/supabase/types'

type Race = Database['openrace']['Tables']['races']['Row']

const TYPE_LABELS: Record<Race['type'], string> = {
  enduro: 'Enduro',
  dh: 'Downhill',
  xc: 'Cross Country',
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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function getBaseUrl(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

interface RaceDashboardPageProps {
  params: Promise<{ raceId: string }>
}

export default async function RaceDashboardPage({ params }: RaceDashboardPageProps) {
  const { raceId } = await params

  const supabase = await createServerSupabaseClient()

  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) {
    redirect('/login')
  }

  const [race, stages, riders, baseUrl] = await Promise.all([
    getRaceById(supabase, raceId),
    getStagesByRace(supabase, raceId),
    getRidersByRace(supabase, raceId),
    getBaseUrl(),
  ])

  if (!race || race.organizer_id !== authData.user.id) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
            clipRule="evenodd"
          />
        </svg>
        All Races
      </Link>

      {/* Race header */}
      <section className="rounded-xl bg-slate-800 border border-slate-700 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{race.name}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[race.status]}`}
              >
                {STATUS_LABELS[race.status]}
              </span>
            </div>

            <p className="text-sm text-slate-400">{formatDate(race.date)}</p>

            {race.location && (
              <p className="text-sm text-slate-400">{race.location}</p>
            )}

            <span className="inline-block rounded-md border border-slate-600 px-2.5 py-0.5 text-xs font-medium text-slate-400">
              {TYPE_LABELS[race.type]}
            </span>
          </div>

          {/* Quick stats */}
          <div className="flex gap-6 sm:text-right">
            <div>
              <p className="text-2xl font-bold text-white">{riders.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Riders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stages.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Stages</p>
            </div>
          </div>
        </div>
      </section>

      {/* Race controls */}
      <section className="rounded-xl bg-slate-800 border border-slate-700 p-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
          Race Controls
        </h2>
        <RaceControls raceId={race.id} currentStatus={race.status} />
      </section>

      {/* Stages grid */}
      {stages.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Stages</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stages.map((stage) => (
              <StageStatus
                key={stage.id}
                stage={stage}
                raceStatus={race.status}
                baseUrl={baseUrl}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-slate-800 bg-slate-900 py-12 text-center">
          <p className="text-slate-400 text-sm">No stages configured for this race.</p>
        </section>
      )}

      {/* Volunteer links section */}
      {stages.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Volunteer Timer Links</h2>
          <p className="text-sm text-slate-400">
            Share these URLs with your volunteers. Each link opens a timer for that stage
            position.
          </p>

          <VolunteerLinks stages={stages} baseUrl={baseUrl} />
        </section>
      )}
    </div>
  )
}

