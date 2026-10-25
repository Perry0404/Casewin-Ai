import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/admin-db'
import { newApiKey } from '@/lib/contrib'
import { currentContributor } from '@/lib/session'

export const dynamic = 'force-dynamic'

// POST /api/contribute/key — issues a new personal key (the old one stops working).
// The key is returned once and only its hash is stored.
export async function POST() {
  const { contributor } = await currentContributor()
  if (!contributor) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const { key, hash, prefix } = newApiKey()
  const { error } = await adminDb().from('contributors').update({ api_key_hash: hash, api_key_prefix: prefix }).eq('id', contributor.id)
  if (error) return NextResponse.json({ error: 'Could not create a key' }, { status: 500 })
  return NextResponse.json({ key })
}
