import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// OpenLegal only ever uses the public (anon) key. Row-level security in the
// Justice database limits it to published judgments and published laws, so a
// bug here can never leak a draft, a filing or a staff record.
let client: SupabaseClient | null = null

export function db(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key',
      { auth: { persistSession: false }, db: { schema: (process.env.NEXT_PUBLIC_DB_SCHEMA || 'public') as 'public' } },
    )
  }
  return client
}

export function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
