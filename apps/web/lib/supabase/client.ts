import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  // Use actual Supabase URL or a safe dummy that won't hang DNS
  const safeUrl = url && !url.includes('placeholder') ? url : 'https://localhost.supabase.co'
  const safeKey = key || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.placeholder'

  client = createBrowserClient(safeUrl, safeKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
    }
  })
  return client
}
