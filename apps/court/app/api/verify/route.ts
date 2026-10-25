import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/verify?sha256=<hex> — was a document with this fingerprint filed?
// Reveals only the court, the date it was received and (once a case is open)
// the public suit number — never the filer or the document itself.
export async function GET(req: NextRequest) {
  const hash = (req.nextUrl.searchParams.get('sha256') ?? '').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(hash)) return NextResponse.json({ error: 'Provide a SHA-256 hex digest' }, { status: 400 })

  const { data } = await createAdminClient()
    .from('filings')
    .select('created_at, documents, court:courts(name), case:cases(suit_number)')
    .contains('documents', [{ sha256: hash }])
    .order('created_at')
    .limit(1)

  const hit = data?.[0] as unknown as
    | { created_at: string; documents: { sha256: string; uploaded_at: string }[]; court: { name: string }; case: { suit_number: string } | null }
    | undefined
  if (!hit) return NextResponse.json({ found: false })

  const doc = hit.documents.find((d) => d.sha256 === hash)
  return NextResponse.json({
    found: true,
    court: hit.court.name,
    received_at: doc?.uploaded_at ?? hit.created_at,
    suit_number: hit.case?.suit_number ?? null,
  })
}
