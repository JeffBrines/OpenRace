import { AuthForm } from '@/components/auth/auth-form'

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">OpenRace</h1>
          <p className="mt-2 text-sm text-slate-400">Create your organizer account</p>
        </div>
        <AuthForm mode="signup" />
      </div>
    </main>
  )
}
