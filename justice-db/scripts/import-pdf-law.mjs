// Imports one statute from a text-based PDF into OpenLegal, section by section.
//
//   npm i --no-save pdfjs-dist@4   (once, in the folder you run this from)
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node justice-db/scripts/import-pdf-law.mjs \
//     --url=https://…/act.pdf --slug=evidence-act-2011 --title="Evidence Act, 2011" --year=2011 \
//     --edition="As enacted" --source-name="Federal Government Official Gazette No. 80" \
//     [--strip="regex for running headers"] [--currency-note="…"] [--dry] [--show=5]
//
// Scanned PDFs (no text layer) are refused — they need OCR and a human check.
// The quality gate is the same as the PLAC importer: doubtful parses are kept
// unpublished with needs_review = true.

import { createClient } from '@supabase/supabase-js'
import { parse, pdfLines } from './lib/pdf-law.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split(/=(.*)/s)).map(([k, v]) => [k, v ?? true]))
const data = args.file ? new Uint8Array((await import('node:fs')).readFileSync(args.file)) : new Uint8Array(await (await fetch(args.url, { headers: { 'user-agent': 'OpenLegalNigeria-importer/1.0' } })).arrayBuffer())
const lines = await pdfLines(data)
if (lines.length < 50) {
  console.log(`REFUSED ${args.slug}: no text layer (${lines.length} lines) — scanned PDF, needs OCR and a human check.`)
  process.exit(0)
}
const { sections, quality } = parse(lines, args.strip ? new RegExp(args.strip) : null)
console.log(`${quality.ok ? 'OK    ' : 'REVIEW'} ${args.slug}: ${quality.sections} sections, ${sections.length - quality.sections} schedule blocks, out-of-order ${quality.outOfOrder}`)
if (args.show) for (const s of sections.filter((x) => args.at ? x.number === String(args.at) : true).slice(0, Number(args.show))) console.log(`  [${s.part ?? ''}] ${s.number}. ${s.heading ?? ''}\n     ${s.body.slice(0, 400).replace(/\n/g, '\n     ')}`)
if (args.dry) process.exit(0)

const db = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data: existing } = await db.from('laws').select('id').eq('slug', args.slug).maybeSingle()
const row = {
  slug: args.slug,
  title: args.title,
  short_title: args['short-title'] ?? null,
  year: Number(args.year) || null,
  jurisdiction: args.jurisdiction ?? 'federal',
  category: args.category ?? null,
  description: args.description ?? null,
  long_title: args['long-title'] ?? null,
  source_url: args['source-url'] ?? args.url ?? null,
  source_name: args['source-name'] ?? null,
  edition: args.edition ?? null,
  currency_note: args['currency-note'] ?? null,
  is_published: quality.ok,
  needs_review: !quality.ok,
  imported_at: new Date().toISOString(),
  external_id: `pdf:${args.slug}`,
}
const { data: law, error } = existing
  ? await db.from('laws').update(row).eq('id', existing.id).select('id').single()
  : await db.from('laws').insert(row).select('id').single()
if (error) throw new Error(error.message)
await db.from('law_sections').delete().eq('law_id', law.id)
const seen = new Set()
const rows = sections.filter((s) => (seen.has(s.number) ? false : seen.add(s.number))).map((s) => ({ law_id: law.id, part: s.part, number: s.number, heading: s.heading, body: s.body.slice(0, 60000), position: s.position }))
for (let i = 0; i < rows.length; i += 200) {
  const { error: e } = await db.from('law_sections').insert(rows.slice(i, i + 200))
  if (e) throw new Error(e.message)
}
console.log(`${quality.ok ? 'published' : 'held for review'}: ${args.title} (${rows.length} sections)`)
