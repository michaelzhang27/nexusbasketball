'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client — safe to use in Client Components.
 * Call this inside components/hooks (not at module level) so it always
 * picks up the current cookies from the browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
