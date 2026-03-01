import { createClient } from '@/lib/supabase/server'

/**
 * Get the authenticated user from the request.
 * Returns { user, supabase } or { user: null, supabase } if not authenticated.
 */
export async function getAuthUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user: error ? null : user, supabase }
}

/**
 * Require authentication — returns user or throws.
 * Use in API routes: const { user, supabase } = await requireAuth()
 */
export async function requireAuth() {
  const { user, supabase } = await getAuthUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return { user, supabase }
}
