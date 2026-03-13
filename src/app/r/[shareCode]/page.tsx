import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRaceByShareCode } from '@/lib/db/races'
import { getStagesByRace } from '@/lib/db/stages'
import { getRaceResults } from '@/lib/db/results'
import { formatElapsedMs } from '@/lib/utils/time-format'
import type { Database } from '@/lib/supabase/types'
import type { RaceResultRow, FastestSplits } from '@/lib/db/results'

type Race = Database['openrace']['Tables']['races']['Row']
type Stage = Database['openrace']['Tables']['stages']['Row']

interface PublicResultsPageProps {
  params: Promise<{ shareCode: string }>
  searchParams: Promise<{ cat?: string }>
}

const TYPE_LABELS: Record<Race['type'], string> = {
  enduro: 'Enduro',
  dh: 'Downhill',
  xc: 'Cross Country',
}

const TYPE_BADGE_STYLES: Record<Race['type'], string> = {
  enduro: 'bg-orange-900/40 text-orange-400 border border-orange-700',
  dh: 'bg-purple-900/40 text-purple-400 border border-purple-700',
  xc: 'bg-green-900/40 text-green-400 border border-green-700',
}

const STATUS_LABELS: Record<Race['status'], string> = {
  draft: 'Provisional',
  active: 'Live',
  complete: 'Final',
}

const STATUS_BADGE_STYLES: Record<Race['status'], string> = {
  draft: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700',
  active: 'bg-green-900/40 text-green-400 border border-green-700',
  complete: 'bg-blue-900/40 text-blue-400 border border-blue-700',
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

function NotFoundPage() {
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
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-white">Race not found</h1>
        <p className="text-sm text-slate-400">
          This results link is invalid or the race has been removed.
        </p>
      </div>
    </div>
  )
}

function StatusText({ status }: { status: string }) {
  const upperStatus = status.toUpperCase()
  if (upperStatus === 'DNF') {
    return <span className="text-xs font-semibold text-red-400 uppercase">DNF</span>
  }
  if (upperStatus === 'DNS') {
    return <span className="text-xs font-semibold text-slate-500 uppercase">DNS</span>
  }
  return <span className="text-xs font-semibold text-yellow-400 uppercase">{upperStatus}</span>
}

function SplitCell({
  stageResult,
  isFastest,
}: {
  stageResult: { elapsed_ms: number | null; status: string } | undefined
  isFastest: boolean
}) {
  if (!stageResult) {
    return <span className="text-slate-600">—</span>
  }

  if (stageResult.status !== 'ok') {
    return <StatusText status={stageResult.status} />
  }

  if (stageResult.elapsed_ms === null) {
    return <span className="text-slate-600">—</span>
  }

  return (
    <span
      className={
        isFastest
          ? 'font-bold text-yellow-300'
          : 'text-slate-300'
      }
    >
      {formatElapsedMs(stageResult.elapsed_ms)}
    </span>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-sm border border-yellow-600/40">
        1
      </span>
    )
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/10 text-slate-400 font-bold text-sm border border-slate-500/30">
        2
      </span>
    )
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 font-bold text-sm border border-amber-700/30">
        3
      </span>
    )
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 text-slate-400 font-medium text-sm">
      {rank}
    </span>
  )
}

interface ResultsTableProps {
  results: RaceResultRow[]
  stages: Stage[]
  fastestSplits: FastestSplits
  activeCategory: string
  shareCode: string
}

function ResultsTable({
  results,
  stages,
  fastestSplits,
  activeCategory,
  shareCode,
}: ResultsTableProps) {
  const filteredResults = activeCategory === 'Overall'
    ? [...results].sort((a, b) => a.overall_rank - b.overall_rank)
    : results
        .filter((r) => r.category === activeCategory)
        .sort((a, b) => a.category_rank - b.category_rank)

  if (filteredResults.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 py-12 text-center">
        <p className="text-slate-500 text-sm">No results in this category yet.</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              <th className="px-4 py-3 text-left font-semibold text-slate-400 w-10">#</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-400">Rider</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-400 w-16">Bib</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-400 w-28">Category</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-400 w-24">Total</th>
              {stages.map((stage) => (
                <th
                  key={stage.id}
                  className="px-4 py-3 text-right font-semibold text-slate-400 w-24 whitespace-nowrap"
                >
                  {stage.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result, idx) => {
              const rank = activeCategory === 'Overall' ? result.overall_rank : result.category_rank
              const rowBg = idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/50'

              return (
                <tr
                  key={result.rider_id}
                  className={`${rowBg} hover:bg-slate-700/40 transition-colors border-b border-slate-800 last:border-0`}
                >
                  <td className="px-4 py-3">
                    <RankBadge rank={rank} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/r/${shareCode}/${result.rider_id}`}
                      className="font-medium text-white hover:text-blue-400 transition-colors"
                    >
                      {result.rider_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono">
                    {result.rider_bib ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400 bg-slate-700/50 rounded px-2 py-0.5">
                      {result.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {result.has_dnf ? (
                      <StatusText status="DNF" />
                    ) : result.total_time_ms !== null ? (
                      <span className="text-white font-semibold">
                        {formatElapsedMs(result.total_time_ms)}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  {stages.map((stage) => {
                    const sr = result.stage_results.find((s) => s.stage_id === stage.id)
                    const categoryFastest = fastestSplits[result.category]?.[stage.id]
                    const isFastest =
                      sr?.status === 'ok' &&
                      sr.elapsed_ms !== null &&
                      categoryFastest !== undefined &&
                      sr.elapsed_ms === categoryFastest
                    return (
                      <td key={stage.id} className="px-4 py-3 text-right font-mono">
                        <SplitCell stageResult={sr} isFastest={isFastest} />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {filteredResults.map((result) => {
          const rank = activeCategory === 'Overall' ? result.overall_rank : result.category_rank

          return (
            <Link
              key={result.rider_id}
              href={`/r/${shareCode}/${result.rider_id}`}
              className="block rounded-xl bg-slate-800 border border-slate-700 p-4 hover:border-slate-500 transition-colors"
            >
              <div className="flex items-start gap-3">
                <RankBadge rank={rank} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-white truncate">{result.rider_name}</span>
                    <div className="font-mono text-right shrink-0">
                      {result.has_dnf ? (
                        <StatusText status="DNF" />
                      ) : result.total_time_ms !== null ? (
                        <span className="text-white font-bold">
                          {formatElapsedMs(result.total_time_ms)}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {result.rider_bib && (
                      <span className="font-mono">#{result.rider_bib}</span>
                    )}
                    <span className="bg-slate-700/60 rounded px-1.5 py-0.5">{result.category}</span>
                  </div>
                  {stages.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                      {stages.map((stage) => {
                        const sr = result.stage_results.find((s) => s.stage_id === stage.id)
                        const categoryFastest = fastestSplits[result.category]?.[stage.id]
                        const isFastest =
                          sr?.status === 'ok' &&
                          sr.elapsed_ms !== null &&
                          categoryFastest !== undefined &&
                          sr.elapsed_ms === categoryFastest
                        return (
                          <div key={stage.id} className="flex justify-between text-xs">
                            <span className="text-slate-500 truncate mr-1">{stage.name}</span>
                            <span className="font-mono shrink-0">
                              <SplitCell stageResult={sr} isFastest={isFastest} />
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

export default async function PublicResultsPage({
  params,
  searchParams,
}: PublicResultsPageProps) {
  const { shareCode } = await params
  const { cat } = await searchParams

  const supabase = await createServerSupabaseClient()

  const race = await getRaceByShareCode(supabase, shareCode)

  if (!race) {
    return <NotFoundPage />
  }

  const [{ results, fastestSplits }, stages] = await Promise.all([
    getRaceResults(supabase, race.id),
    getStagesByRace(supabase, race.id),
  ])

  const categories = Array.from(new Set(results.map((r) => r.category))).sort()
  const tabs = ['Overall', ...categories]
  const activeCategory = cat && tabs.includes(cat) ? cat : 'Overall'

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Race header */}
        <section className="rounded-xl bg-slate-800 border border-slate-700 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{race.name}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[race.status]}`}
                >
                  {STATUS_LABELS[race.status]}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span>{formatDate(race.date)}</span>
                {race.location && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span>{race.location}</span>
                  </>
                )}
              </div>
              <span
                className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE_STYLES[race.type]}`}
              >
                {TYPE_LABELS[race.type]}
              </span>
            </div>

            <div className="flex gap-6 sm:text-right">
              <div>
                <p className="text-2xl font-bold text-white">{results.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">Riders</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stages.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">Stages</p>
              </div>
            </div>
          </div>
        </section>

        {/* Results section */}
        {results.length === 0 ? (
          <section className="rounded-xl border border-slate-800 bg-slate-900 py-16 text-center">
            <p className="text-slate-400 text-sm">No results available yet.</p>
            <p className="text-slate-600 text-xs mt-1">Check back once the race is underway.</p>
          </section>
        ) : (
          <section className="space-y-4">
            {/* Category tabs */}
            <div className="flex items-center gap-1 border-b border-slate-700 overflow-x-auto pb-0">
              {tabs.map((tab) => (
                <Link
                  key={tab}
                  href={`/r/${shareCode}${tab === 'Overall' ? '' : `?cat=${encodeURIComponent(tab)}`}`}
                  className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeCategory === tab
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
                >
                  {tab}
                </Link>
              ))}
            </div>

            {/* Results table / cards */}
            <ResultsTable
              results={results}
              stages={stages}
              fastestSplits={fastestSplits}
              activeCategory={activeCategory}
              shareCode={shareCode}
            />

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-yellow-300">0:00.0</span>
                Fastest split
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-red-400">DNF</span>
                Did not finish
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">DNS</span>
                Did not start
              </span>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
