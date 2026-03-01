/**
 * Supabase barrel file — exports for server-side usage
 * Agents and API routes import { getSupabaseClient } from '@/lib/supabase'
 */

import { createClient as createServerSupabase } from '@supabase/supabase-js'

let serverClient: ReturnType<typeof createServerSupabase> | null = null

/**
 * Returns a server-side Supabase client using the service role key.
 * Used by agents and API routes that need direct DB access (bypasses RLS).
 */
export function getSupabaseClient() {
  if (serverClient) return serverClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!url || url.includes('placeholder') || !serviceKey) {
    // Return a dummy client that will fail gracefully
    // Agents have try/catch fallbacks for when DB is unavailable
    const safeUrl = 'https://localhost.supabase.co'
    const safeKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.placeholder'
    serverClient = createServerSupabase(safeUrl, safeKey)
    return serverClient
  }

  serverClient = createServerSupabase(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return serverClient
}

// Re-export for convenience
export { createClient } from './client'
