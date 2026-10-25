import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MAX_FILES = 10
const MAX_BYTES = 20 * 1024 * 1024 // per file; matches the 20MB total checked when the filing is submitted
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']

// POST /api/uploads — issues one-time signed upload URLs for a new filing's
// documents. Files go straight from the browser to private storage under
// pending/<batch>/; POST /api/filings later hashes them and attaches them.
export async function POST(req: NextRequest) {
  const { files } = (await req.json().catch(() => ({}))) as { files?: { name: string; size: number; type: string }[] }
  if (!Array.isArray(files) || files.length === 0) return NextResponse.json({ error: 'No files' }, { status: 400 })
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Attach at most ${MAX_FILES} documents.` }, { status: 400 })

  for (const f of files) {
    if (f.size > MAX_BYTES) return NextResponse.json({ error: `${f.name} is larger than 20 MB.` }, { status: 400 })
    if (!ALLOWED.includes(f.type)) return NextResponse.json({ error: `${f.name}: upload PDF, Word or image files only.` }, { status: 400 })
  }

  const db = createAdminClient()
  const batch = crypto.randomUUID()
  const uploads = []
  for (const f of files) {
    const safe = f.name.replace(/[^\w.\- ]+/g, '_').slice(-120)
    const path = `pending/${batch}/${crypto.randomUUID().slice(0, 8)}-${safe}`
    const { data, error } = await db.storage.from('filings').createSignedUploadUrl(path)
    if (error || !data) return NextResponse.json({ error: 'Could not prepare the upload. Try again.' }, { status: 500 })
    uploads.push({ name: f.name, path, token: data.token })
  }
  return NextResponse.json({ uploads })
}
