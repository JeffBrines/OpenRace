import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRaceByShareCode } from '@/lib/db/races'
import { getStagesByRace } from '@/lib/db/stages'
import { getRiderResult } from '@/lib/db/results'
import { formatElapsedMs } from '@/lib/utils/time-format'

interface RiderResultPageProps {
  params: Promise<{ shareCode: string; riderId: string }>
}

function NotFoundPage({ shareCode }: { shareCode: string }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-sm w-full rounded-xl bg-slate-800 border border-slate-700 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-6 h-6 text-slate-400"
          >
            <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-white">Rider not found</h1>
        <p className="text-sm text-slate-400">
          This rider result could not be found.
        </p>
        <Link
          href={`/r/${shareCode}`}
          className="inline-block text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Back to full results
        </Link>
      </div>
    </div>
  )
}

function RankPodium({ rank, label }: { rank: number; label: string }) {
  const isTop3 = rank <= 3
  const podiumStyles = {
    1: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400',
    2: 'bg-slate-400/10 border-slate-400/30 text-slate-300',
    3: 'bg-amber-700/10 border-amber-600/30 text-amber-500',
  } as const

  const style =
    isTop3
      ? podiumStyles[rank as 1 | 2 | 3]
      : 'bg-slate-700/30 border-slate-600/30 text-slate-300'

  return (
    <div className={`rounded-xl border p-4 text-center ${style}`}>
      <p className="text-4xl font-black mb-1">
        {rank}
        <span className="text-lg font-semibold align-super">
          {rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'}
        </span>
      </p>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
    </div>
  )
}

function StageStatusBadge({ status }: { status: string }) {
  const upperStatus = status.toUpperCase()
  if (upperStatus === 'DNF') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-900/30 border border-red-700/40 px-2.5 py-0.5 text-xs font-semibold text-red-400">
        DNF
      </span>
    )
  }
  if (upperStatus === 'DNS') {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-700/40 border border-slate-600/40 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
        DNS
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-yellow-900/30 border border-yellow-700/40 px-2.5 py-0.5 text-xs font-semibold text-yellow-400">
      {upperStatus}
    </span>
  )
}

export default async function RiderResultPage({ params }: RiderResultPageProps) {
  const { shareCode, riderId } = await params

  const supabase = await createServerSupabaseClient()

  const race = await getRaceByShareCode(supabase, shareCode)

  if (!race) {
    return <NotFoundPage shareCode={shareCode} />
  }

  const [riderData, stages] = await Promise.all([
    getRiderResult(supabase, race.id, riderId),
    getStagesByRace(supabase, race.id),
  ])

  if (!riderData) {
    return <NotFoundPage shareCode={shareCode} />
  }

  const { result, stageDetails } = riderData

  const genderLabel =
    result.rider_gender === 'male'
      ? 'Male'
      : result.rider_gender === 'female'
        ? 'Female'
        : result.rider_gender === 'non_binary'
          ? 'Non-binary'
          : result.rider_gender

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Back link */}
        <Link
          href={`/r/${shareCode}`}
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
          Full Results
        </Link>

        {/* Race name */}
        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
          {race.name}
        </p>

        {/* Rider info card */}
        <section className="rounded-xl bg-slate-800 border border-slate-700 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{result.rider_name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {result.rider_bib && (
                  <span className="font-mono text-sm text-slate-400 bg-slate-700/60 rounded px-2 py-0.5">
                    #{result.rider_bib}
                  </span>
                )}
                <span className="text-sm text-slate-400 bg-slate-700/60 rounded px-2 py-0.5">
                  {result.category}
                </span>
                <span className="text-sm text-slate-500">{genderLabel}</span>
              </div>
            </div>

            {/* Total time */}
            <div className="text-right shrink-0">
              {result.has_dnf ? (
                <div>
                  <p className="text-2xl font-bold text-red-400">DNF</p>
                  <p className="text-xs text-slate-500 mt-0.5">Did not finish</p>
                </div>
              ) : result.total_time_ms !== null ? (
                <div>
                  <p className="text-2xl font-bold font-mono text-white">
                    {formatElapsedMs(result.total_time_ms)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Total time</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Rank badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <RankPodium rank={result.overall_rank} label="Overall" />
            <RankPodium rank={result.category_rank} label={result.category} />
          </div>
        </section>

        {/* Stage breakdown */}
        {stages.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Stage Splits
            </h2>

            <div className="space-y-2">
              {stages.map((stage, idx) => {
                const stageDetail = stageDetails.find((sd) => sd.stage_id === stage.id)
                const hasResult = stageDetail !== undefined
                const isOk = stageDetail?.status === 'ok'

                return (
                  <div
                    key={stage.id}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Stage info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center shrink-0">
                          <div
                            className={`w-2.5 h-2.5 rounded-full border-2 ${
                              isOk
                                ? 'bg-green-500 border-green-400'
                                : hasResult
                                  ? 'bg-red-500 border-red-400'
                                  : 'bg-slate-600 border-slate-500'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">
                            {stage.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Stage {idx + 1}
                            {stage.distance && ` · ${stage.distance} km`}
                          </p>
                        </div>
                      </div>

                      {/* Time or status */}
                      <div className="text-right shrink-0">
                        {!hasResult ? (
                          <span className="text-slate-600 text-sm">—</span>
                        ) : isOk && stageDetail.elapsed_ms !== null ? (
                          <span className="font-mono font-semibold text-white text-lg">
                            {formatElapsedMs(stageDetail.elapsed_ms)}
                          </span>
                        ) : (
                          <StageStatusBadge status={stageDetail?.status ?? ''} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Footer link */}
        <div className="pt-2 text-center">
          <Link
            href={`/r/${shareCode}`}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            View all results for {race.name}
          </Link>
        </div>
      </div>
    </div>
  )
}
