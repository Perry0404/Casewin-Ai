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

import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split(/=(.*)/s)).map(([k, v]) => [k, v ?? true]))
const req = createRequire(process.cwd() + '/')
const { getDocument } = await import(pathToFileURL(req.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href)

const MARGIN = '\u0001'

async function pdfLines(data) {
  const doc = await getDocument({ data, useSystemFonts: true, verbosity: 0 }).promise
  const out = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    // Gazette-format Acts print each section's heading as a note in the right
    // margin. Text starting beyond 72% of the page width is treated as such a
    // note and emitted on its own line, prefixed with MARGIN.
    const marginX = page.getViewport({ scale: 1 }).width * 0.72
    const { items } = await page.getTextContent()
    const rows = new Map()
    for (const it of items) {
      if (!it.str?.trim()) continue
      const y = Math.round(it.transform[5] / 2) * 2
      if (!rows.has(y)) rows.set(y, [])
      rows.get(y).push({ x: it.transform[4], s: it.str })
    }
    for (const y of [...rows.keys()].sort((a, b) => b - a)) {
      const row = rows.get(y).sort((a, b) => a.x - b.x)
      const join = (rs) => rs.map((r) => r.s).join(' ').replace(/\s+/g, ' ').trim()
      const main = join(row.filter((r) => r.x < marginX))
      const note = join(row.filter((r) => r.x >= marginX))
      if (main) out.push(main)
      if (note) out.push(MARGIN + note)
    }
  }
  return out.filter(Boolean)
}

const titleCase = (s) => s.toLowerCase().replace(/(^|[\s(\-/])([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase()).replace(/\b(And|Of|The|For|To|In|On|By|With|An|A)\b/g, (m, w, i) => (i === 0 ? m : m.toLowerCase()))

export function parse(lines, strip) {
  const clean = lines.filter((l) => {
    const t = l.replace(MARGIN, '')
    return !(strip && strip.test(t)) && !/^\d{1,4}$/.test(t) && !/^Page \d+( of \d+)?$/i.test(t)
  })
  // The table of contents repeats every heading; the body starts at the "1." whose next lines are not "2.".
  const ones = clean.map((l, i) => (/^1\.\s+\S/.test(l) ? i : -1)).filter((i) => i >= 0)
  const start = ones.find((i) => !clean.slice(i + 1, i + 7).some((l) => /^2\.\s/.test(l))) ?? ones[0] ?? 0
  // Chapter/part headings that come just before section 1 belong to it.
  let back = start
  while (back > 0 && /^(CHAPTER|PART)\b/.test(clean[back - 2] ?? '') && back - start > -6) back -= 2

  const sections = []
  let chapter = null
  let part = null
  let current = null
  let expected = 1
  let outOfOrder = 0
  let inSchedules = false
  const label = () => [chapter, part].filter(Boolean).join(' · ') || null

  const notes = [] // margin lines, grouped into headings after the pass
  for (let i = back; i < clean.length; i++) {
    if (clean[i].startsWith(MARGIN)) {
      notes.push({ i, text: clean[i].slice(1).trim() })
      continue
    }
    // A margin note ("[Section 132 (1) and …") can share a line with a heading; keep the heading.
    const line = clean[i].replace(/^\[Section [^\]]*?(?=\b\d{1,3}[A-Z]?\.\s*[A-Z])/, '')
    const ch = line.match(/^CHAPTER ([IVXLC]+|\d+)$/)
    if (ch) {
      chapter = `Chapter ${ch[1]}${clean[i + 1] && !/^(PART|\d)/.test(clean[i + 1]) ? ' — ' + titleCase(clean[++i]) : ''}`
      part = null
      continue
    }
    const pt = line.match(/^PART ([IVXLC]+|\d+|[A-Z])\b\s*[-–—:]?\s*(.*)$/)
    if (pt && line.length < 100 && !inSchedules) {
      const name = pt[2] || (clean[i + 1] && !/^\d/.test(clean[i + 1]) ? clean[++i] : '')
      part = `Part ${pt[1]}${name ? ' — ' + titleCase(name) : ''}`
      continue
    }
    const sch = line.match(/^((FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\s+)?SCHEDULES?\b.{0,60}$/)
    if (sch && sections.length > 3) {
      inSchedules = true
      current = { part: 'Schedules', number: `Sch${sections.filter((s) => s.number.startsWith('Sch')).length + 1}`, heading: titleCase(line), body: [] }
      sections.push(current)
      continue
    }
    // "100. Heading" — some PDFs drop the space ("100.Heading"), so allow none before a capital.
    const sec = !inSchedules && line.match(/^(\d{1,3}[A-Z]?)\.(?:\s+(.{2,200})|([A-Z(].{1,200}))$/)
    const num = sec ? parseInt(sec[1], 10) : NaN
    const text = sec ? (sec[2] ?? sec[3]) : ''
    // "1. (1) The Commission…" is a section starting with its first subsection —
    // accepted only for exactly the next expected number, to avoid list items.
    if (sec && num >= expected && num <= expected + 3 && (!/^\(/.test(text) || num === expected)) {
      if (num !== expected) outOfOrder++
      const rest = text.trim()
      const isHeading = !/^\(/.test(rest) && rest.length <= 140 && !/[;,]$/.test(rest) && !/^(The|A|An|Any|Every|Where|If|Subject|Notwithstanding|In)\b.*\b(shall|may|is|are)\b/.test(rest)
      current = { part: label(), number: sec[1], heading: isHeading ? rest.replace(/\.$/, '') : null, start: i, body: isHeading ? [] : [rest] }
      sections.push(current)
      expected = num + 1
      continue
    }
    if (current) current.body.push(line)
  }

  // Best source of headings: the arrangement of sections before the body
  // ("14. Demand for information regarding registration"), where wrapped
  // headings continue on the next line(s).
  const toc = new Map()
  let lastNum = null
  for (const raw of clean.slice(0, start)) {
    if (raw.startsWith(MARGIN)) continue
    const m = raw.match(/^(\d{1,3}[A-Z]?)\.\s*(.+)$/)
    if (m) {
      lastNum = m[1]
      toc.set(m[1], m[2].trim())
    } else if (lastNum && !/^(PART|CHAPTER|SCHEDULE|ARRANGEMENT|SECTIONS?$)/i.test(raw) && raw.length < 90 && /^[a-z(]|^[A-Z][a-z]/.test(raw)) {
      toc.set(lastNum, `${toc.get(lastNum)} ${raw}`.trim())
    } else lastNum = null
  }
  const tocUsable = toc.size >= Math.min(10, sections.length * 0.5)
  const same = (a, b) => {
    const n = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
    const [x, y] = [n(a), n(b)]
    return x === y || x.startsWith(y.slice(0, 24)) || y.startsWith(x.slice(0, 24))
  }
  if (tocUsable) {
    for (const s of sections) {
      const h = toc.get(s.number)?.replace(/\.$/, '')
      if (!h) continue
      if (!s.heading) s.heading = h
      else if (!same(s.heading, h)) {
        // What we took for a heading was really the section's first line of text.
        s.body.unshift(s.heading)
        s.heading = h
      }
    }
  }

  // Margin headings: consecutive margin lines (allowing short gaps) form one
  // note; cross-references such as "Cap. C23, LFN, 2004" or "2022 No. 13"
  // are dropped. Each note goes to the section that starts beside it.
  const isCitation = (t) => /^(Cap\.?\s|Act No\.|No\. \d+|\d{4} No\.|LFN|[A-Z]\d+,? LFN)/i.test(t) || /\bLFN,? \d{4}\b/.test(t)
  const blocks = []
  for (const n of notes.filter((n) => !isCitation(n.text))) {
    const last = blocks[blocks.length - 1]
    if (last && n.i - last.end <= 3) {
      last.text += ' ' + n.text
      last.end = n.i
    } else blocks.push({ start: n.i, end: n.i, text: n.text })
  }
  const numberedStarts = sections.filter((s) => s.start !== undefined)
  for (const b of tocUsable ? [] : blocks) {
    let owner = null
    for (const s of numberedStarts) if (s.start <= b.start + 1) owner = s
    if (owner && !owner.heading && owner.start >= b.start - 2) owner.heading = b.text.replace(/\s+/g, ' ').replace(/\.$/, '').trim()
  }

  // Re-flow wrapped lines into paragraphs: a new paragraph starts at (1), (a), (i) or "Provided".
  const reflow = (ls) =>
    ls
      .reduce((acc, l) => {
        if (!acc.length || /^(\(\w{1,4}\)|Provided\b|[A-Z][A-Z ]{6,}$)/.test(l) || /[.:;]$/.test(acc[acc.length - 1]) && /^[A-Z(]/.test(l)) acc.push(l)
        else acc[acc.length - 1] += ' ' + l
        return acc
      }, [])
      .join('\n')
      .replace(/(\w)- (\w)/g, '$1$2')
      // PDF kerning artifacts: "Act ," → "Act,", "V oters" → "Voters" (never touches "A" or "I").
      .replace(/ ([,;:.)])/g, '$1')
      .replace(/\b([B-HJ-Z]) ([a-z]{2,})/g, '$1$2')
      .trim()

  const out = sections.map((s, i) => ({ ...s, position: i + 1, body: reflow(s.body) })).filter((s) => s.body)
  const numbered = out.filter((s) => /^\d/.test(s.number))
  return { sections: out, quality: { sections: numbered.length, outOfOrder, ok: numbered.length >= 3 && outOfOrder <= Math.max(2, numbered.length * 0.05) } }
}

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
