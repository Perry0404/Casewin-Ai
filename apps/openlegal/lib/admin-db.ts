import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Service-role client for the contributor network ONLY (contributors,
// submissions, points). Public reading of judgments and laws still goes
// through lib/db.ts with the anon key, so RLS keeps guarding the public site.
let client: SupabaseClient | null = null

export function adminDb(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } })
  }
  return client
}
