import { createAdminClient } from './supabase/server'

export interface Division {
  id: string
  name: string
  code: string
}

export async function listCourts() {
  const db = createAdminClient()
  const { data } = await db
    .from('courts')
    .select('id, slug, name, short_name, state, status, divisions(id, name, code)')
    .neq('status', 'suspended')
    .order('name')
  return (data ?? []) as {
    id: string
    slug: string
    name: string
    short_name: string | null
    state: string
    status: string
    divisions: Division[]
  }[]
}

export async function getCourtBySlug(slug: string) {
  const db = createAdminClient()
  const { data } = await db.from('courts').select('id, slug, name, short_name, state, status, address').eq('slug', slug).neq('status', 'suspended').maybeSingle()
  return data
}
