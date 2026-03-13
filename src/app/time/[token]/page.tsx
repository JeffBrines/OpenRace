import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStageByToken } from '@/lib/db/stages'
import { getRidersByRace } from '@/lib/db/riders'
import { TimingScreen } from '@/components/timing/timing-screen'

interface TimingPageProps {
  params: Promise<{ token: string }>
}

function ErrorPage({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-sm w-full rounded-xl bg-slate-800 border border-slate-700 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-900/40 border border-red-700 flex items-center justify-center mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-6 h-6 text-red-400"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        <p className="text-sm text-slate-400">{message}</p>
      </div>
    </div>
  )
}

export default async function TimingPage({ params }: TimingPageProps) {
  const { token } = await params
  const supabase = await createServerSupabaseClient()

  const result = await getStageByToken(supabase, token)

  if (!result) {
    return (
      <ErrorPage
        title="Timer not found"
        message="This timing link is invalid or has expired. Check with your race organizer for a new link."
      />
    )
  }

  const { stage, role, race } = result

  if (race.status !== 'active') {
    return (
      <ErrorPage
        title="Race not active"
        message={`This race is currently "${race.status}". Timing is only available while the race is active.`}
      />
    )
  }

  const riders = await getRidersByRace(supabase, race.id)

  return (
    <TimingScreen
      stage={stage}
      role={role}
      race={race}
      riders={riders}
    />
  )
}
