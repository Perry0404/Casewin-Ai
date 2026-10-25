import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { classifyFiling } from '@/lib/classify'
import { trackingCode } from '@/lib/format'
import { getFiler, logEvent } from '@/lib/auth'
import { CASE_TYPES, PROCESS_TYPES } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MAX_TOTAL_BYTES = 20 * 1024 * 1024

interface Party {
  name: string
  address?: string
}

// POST /api/filings — submits a new e-filing to a court's registry queue.
// Only approved filers can file; who filed always comes from their verified
// account, never from the request body.
export async function POST(req: NextRequest) {
  const filer = await getFiler()
  if (!filer) return NextResponse.json({ error: 'Sign in with an approved e-filing account.' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return bad('Invalid request')

  const required = ['court_id', 'title', 'process_type']
  for (const k of required) if (!String(body[k] ?? '').trim()) return bad(`Missing ${k.replace('_', ' ')}`)
  if (!PROCESS_TYPES.some((p) => p.value === body.process_type)) return bad('Choose the originating process')

  const claimants = cleanParties(body.claimants)
  const defendants = cleanParties(body.defendants)
  if (!claimants.length || !defendants.length) return bad('Add at least one party on each side')

  const db = createAdminClient()

  const { data: court } = await db.from('courts').select('id, status').eq('id', body.court_id).maybeSingle()
  if (!court || court.status === 'suspended') return bad('That court is not accepting e-filings')

  let divisionId: string | null = null
  if (body.division_id) {
    const { data: div } = await db.from('divisions').select('id').eq('id', body.division_id).eq('court_id', court.id).maybeSingle()
    divisionId = div?.id ?? null
  }

  // Hash every uploaded document server-side; the hash is the integrity proof.
  const documents = []
  let total = 0
  for (const d of Array.isArray(body.documents) ? body.documents.slice(0, 10) : []) {
    if (typeof d?.path !== 'string' || !d.path.startsWith('pending/')) return bad('Invalid document reference')
    const { data: blob, error } = await db.storage.from('filings').download(d.path)
    if (error || !blob) return bad(`Upload for ${d.name} did not finish. Please attach it again.`)
    total += blob.size
    if (total > MAX_TOTAL_BYTES) return bad('Attachments exceed 20 MB in total')
    const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
    const sha256 = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
    if (d.sha256 && d.sha256 !== sha256) return bad(`${d.name} changed during upload. Please attach it again.`)
    documents.push({ name: String(d.name).slice(0, 200), path: d.path, size: blob.size, sha256, uploaded_at: new Date().toISOString() })
  }

  const text = [body.title, body.reliefs, body.summary].filter(Boolean).join('\n')
  const classification = classifyFiling(text, body.process_type)
  const declaredType = CASE_TYPES.some((c) => c.value === body.case_type) ? body.case_type : null

  // Retry on the (very unlikely) tracking-code collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = trackingCode()
    const { data, error } = await db
      .from('filings')
      .insert({
        court_id: court.id,
        division_id: divisionId,
        reference,
        filer_user_id: filer.user_id,
        filer_name: filer.full_name,
        filer_email: filer.email.toLowerCase(),
        filer_phone: filer.phone,
        filer_type: filer.filer_type,
        bar_number: filer.bar_number,
        law_firm: filer.law_firm,
        case_type: declaredType ?? classification.case_type,
        process_type: body.process_type,
        title: clip(body.title, 300),
        claimants,
        defendants,
        claim_amount: Number(body.claim_amount) > 0 ? Number(body.claim_amount) : null,
        reliefs: clip(body.reliefs, 8000) || null,
        summary: clip(body.summary, 8000) || null,
        urgent: Boolean(body.urgent) || classification.urgent,
        documents,
        classification,
      })
      .select('id, reference')
      .single()

    if (!error && data) {
      await logEvent({
        court_id: court.id,
        filing_id: data.id,
        action: 'filing.submitted',
        actor_label: `${filer.full_name} (filer)`,
        detail: { documents: documents.length },
      })
      return NextResponse.json({ reference: data.reference })
    }
    if (error && !String(error.message).includes('duplicate')) {
      console.error('filing insert failed', error)
      return NextResponse.json({ error: 'Could not submit the filing. Please try again.' }, { status: 500 })
    }
  }
  return NextResponse.json({ error: 'Could not submit the filing. Please try again.' }, { status: 500 })
}

function cleanParties(v: unknown): Party[] {
  if (!Array.isArray(v)) return []
  return v
    .map((p) => ({ name: clip(p?.name, 200), address: clip(p?.address, 300) || undefined }))
    .filter((p) => p.name)
    .slice(0, 20)
}

function clip(v: unknown, n: number) {
  return String(v ?? '').trim().slice(0, n)
}

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}
