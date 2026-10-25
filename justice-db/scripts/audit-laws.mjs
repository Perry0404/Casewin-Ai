// Re-checks imported statutes for parse faults the import-time gate misses, and
// holds failing ones for review (unpublished, needs_review = true).
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node justice-db/scripts/audit-laws.mjs [--prefix=plac:pdf:] [--dry]
//
// Faults detected:
//   shifted  — a section's body opens with the previous section's heading (headings off by one)
//   swallowed — a section body far longer than a section can be (later sections merged into it)
//   truncated — a body cut at the 60,000-character storage limit

import { createClient } from '@supabase/supabase-js'

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const db = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const norm = (s) => (s ?? '').toLowerCase().replace(/[^a-z]+/g, ' ').trim()

const { data: laws } = await db.from('laws').select('id, title, external_id').like('external_id', `${args.prefix ?? 'plac:pdf:'}%`).eq('is_published', true)
let held = 0
for (const law of laws ?? []) {
  const { data: secs } = await db.from('law_sections').select('number, heading, body').eq('law_id', law.id).order('position')
  const main = (secs ?? []).filter((s) => !/^Sch/.test(s.number))
  const faults = new Set()
  for (let i = 1; i < main.length; i++) {
    const prev = norm(main[i - 1].heading)
    if (prev.length > 6 && norm(main[i].body).startsWith(prev)) faults.add('shifted')
  }
  for (const s of main) if (s.body.length > 15000) faults.add('swallowed')
  // A cut-off schedule of forms is tolerable; a cut-off schedule that *is* the law (Criminal Code) is not.
  for (const s of secs ?? []) if (s.body.length >= 60000 && (!/^Sch/.test(s.number) || main.length < 20)) faults.add('truncated')
  if (!faults.size) continue
  held++
  console.log(`HOLD ${law.external_id} ${law.title} — ${[...faults].join(', ')}`)
  if (!args.dry) await db.from('laws').update({ is_published: false, needs_review: true }).eq('id', law.id)
}
console.log(`checked ${(laws ?? []).length}, held ${held}`)
