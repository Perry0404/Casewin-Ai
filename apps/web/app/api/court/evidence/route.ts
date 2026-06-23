import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Layer 4 — Court infrastructure. Evidence verification.
// We never store the evidence itself — only a SHA-256 hash + timestamp, which
// proves the file existed and was never altered. The file is hashed in the
// browser; only the hash reaches the server.
//
// POST  { hash, fileName? }         -> register a proof record
// GET   ?hash=<sha256>              -> look up whether/when it was registered

function isSha256(h: unknown): h is string {
  return typeof h === 'string' && /^[a-f0-9]{64}$/i.test(h)
}

export async function POST(request: NextRequest) {
  try {
    const { hash, fileName } = await request.json()
    if (!isSha256(hash)) {
      return NextResponse.json({ error: 'A valid SHA-256 hash is required.' }, { status: 400 })
    }

    const timestamp = new Date().toISOString()
    const receipt = {
      hash: hash.toLowerCase(),
      fileName: fileName || null,
      timestamp,
      algorithm: 'SHA-256',
      // On-chain anchoring is a roadmap item; today the proof is the timestamped
      // hash record. anchor stays 'recorded' until chain anchoring ships.
      anchor: 'recorded' as const,
    }

    // Best-effort persistence; never fail the request if the table is absent.
    let persisted = false
    try {
      const { error } = await getSupabaseAdmin()
        .from('evidence_records')
        .insert({ hash: receipt.hash, file_name: receipt.fileName, created_at: timestamp })
      persisted = !error
      if (error) console.warn('evidence_records insert skipped:', error.message)
    } catch (e) {
      console.warn('evidence_records insert error:', e)
    }

    return NextResponse.json({ success: true, receipt, persisted })
  } catch (err) {
    console.error('Evidence register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const hash = request.nextUrl.searchParams.get('hash')
    if (!isSha256(hash)) {
      return NextResponse.json({ error: 'A valid SHA-256 hash is required.' }, { status: 400 })
    }

    try {
      const { data, error } = await getSupabaseAdmin()
        .from('evidence_records')
        .select('hash, file_name, created_at')
        .eq('hash', hash.toLowerCase())
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (error || !data) {
        return NextResponse.json({ success: true, found: false })
      }
      return NextResponse.json({
        success: true,
        found: true,
        record: { hash: data.hash, fileName: data.file_name, registeredAt: data.created_at },
      })
    } catch (e) {
      console.warn('evidence lookup unavailable:', e)
      return NextResponse.json({ success: true, found: false, note: 'Verification store unavailable.' })
    }
  } catch (err) {
    console.error('Evidence verify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
