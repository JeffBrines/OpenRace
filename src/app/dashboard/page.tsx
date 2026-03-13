import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRacesByOrganizer } from '@/lib/db/races'
import { RaceCard } from '@/components/race/race-card'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const races = await getRacesByOrganizer(supabase, user.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Your Races</h1>
        <Link
          href="/dashboard/create"
          className="rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          Create Race
        </Link>
      </div>

      {races.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 py-20 text-center">
          <h2 className="text-xl font-semibold text-slate-200 mb-2">
            No races yet
          </h2>
          <p className="text-slate-400 mb-8 max-w-sm">
            Create your first race to get started. You can add stages, register
            riders, and capture timing data.
          </p>
          <Link
            href="/dashboard/create"
            className="rounded-md bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Create Your First Race
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {races.map((race) => (
            <RaceCard key={race.id} race={race} />
          ))}
        </div>
      )}
    </div>
  )
}
