// ─────────────────────────────────────────────────────────────────────────────
// Nexus Analytics — Auth (Supabase)
// Returns the current user from the Supabase session.
// The shape of AuthState is unchanged so no component edits are needed.
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { AuthState } from '@/types'

/**
 * Returns live Supabase auth state.
 * isLoaded is false until the session check completes.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: { name: '', role: 'head_coach', school: '', conference: '', dataView: 'mens' },
    isLoaded: false,
  })

  useEffect(() => {
    const supabase = createClient()

    // Resolve immediately with cached session, then keep listening
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState({
        user: {
          name:       user?.user_metadata?.full_name ?? '',
          role:       'head_coach',
          school:     user?.user_metadata?.school     ?? '',
          conference: user?.user_metadata?.conference ?? '',
          dataView:   (user?.user_metadata?.data_view ?? 'mens') as 'mens' | 'womens',
        },
        isLoaded: true,
      })
    })

    // Keep in sync if the session changes (e.g. sign-out in another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: {
          name:       session?.user?.user_metadata?.full_name ?? '',
          role:       'head_coach',
          school:     session?.user?.user_metadata?.school     ?? '',
          conference: session?.user?.user_metadata?.conference ?? '',
          dataView:   (session?.user?.user_metadata?.data_view ?? 'mens') as 'mens' | 'womens',
        },
        isLoaded: true,
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}

/**
 * Returns a sign-out function. Clears the Supabase session and redirects.
 */
export function useSignOut() {
  return async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
}

/**
 * Returns the current Supabase access token (JWT) for use in FastAPI calls.
 * Returns null when there is no active session.
 */
export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}
