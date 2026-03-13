'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const supabase = createClient()

      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(signInError.message)
          return
        }

        router.push('/dashboard')
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/auth/callback',
          },
        })

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        setMessage('Check your email to confirm your account.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-5"
    >
      <div className="space-y-3">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {message && (
        <p className="text-sm text-green-400 bg-green-950/40 border border-green-800 rounded-md px-3 py-2">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-orange-600 hover:bg-orange-500 disabled:bg-orange-900 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white transition-colors"
      >
        {loading ? '...' : isLogin ? 'Sign In' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-slate-400">
        {isLogin ? (
          <>
            No account?{' '}
            <Link
              href="/signup"
              className="text-orange-400 hover:text-orange-300 underline"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-orange-400 hover:text-orange-300 underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  )
}
