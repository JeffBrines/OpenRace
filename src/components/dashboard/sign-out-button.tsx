'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
    >
      Sign Out
    </button>
  )
}
