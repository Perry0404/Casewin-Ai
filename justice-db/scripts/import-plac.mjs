// Imports the Laws of the Federation of Nigeria 2004 from PLAC's free online
// compendium (https://www.placng.org/lawsofnigeria/) into OpenLegal, one row
// per section, with the source credited on every law page.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node justice-db/scripts/import-plac.mjs [--dry] [--only=17,42] [--from-page=1] [--to-page=69] [--pdf-only]
//
// About a quarter of the compendium is linked as PDFs (laws/E1.pdf) rather than
// HTML pages; those are parsed with lib/pdf-law.mjs, which needs pdfjs-dist
// resolvable from the current directory (npm i --no-save pdfjs-dist@4).
//
// Politeness: one request every 3 seconds, identified user agent. Re-running
// updates laws in place (keyed on PLAC's id) instead of duplicating them.
//
// Quality gate: a law is published only when its sections parse cleanly
// (numbers mostly in sequence, enough sections for the arrangement). Anything
// doubtful is stored with is_published = false, needs_review = true.

import { createClient } from '@supabase/supabase-js'

const BASE = 'https://www.placng.org/lawsofnigeria/'
const UA = 'OpenLegalNigeria-importer/1.0 (+https://openlegal.casewinai.com/about)'
const DELAY = 3000
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const dry = Boolean(args.dry)
const db = dry ? null : createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function get(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': UA } }).catch(() => null)
    if (res?.ok) return res.text()
    await sleep(5000 * (attempt + 1))
  }
  throw new Error(`fetch failed: ${url}`)
}

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', sect: '§' }
function htmlToLines(html) {
  const body = html.replace(/[\s\S]*?<body[^>]*>/i, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
  return body
    .replace(/<(br|\/p|\/li|\/div|\/h\d|\/tr|\/td)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-z]+);/gi, (m, e) => ENTITIES[e.toLowerCase()] ?? m)
    .split('\n')
    .map((l) => l.replace(/[ \s]+/g, ' ').trim())
    .filter(Boolean)
}

const titleCase = (s) =>
  s
    .toLowerCase()
    .replace(/(^|[\s(\-/])([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase())
    .replace(/\b(And|Of|The|For|To|In|On|Etc|By|With|An|A)\b/g, (m, w, i) => (i === 0 ? m : m.toLowerCase()))
    .replace(/\bEtc\.?/i, 'etc.')
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 90)

/** Parses one PLAC law page into { title, longTitle, commencement, sections[] , quality }. */
export function parseLaw(html, fallbackTitle) {
  const lines = htmlToLines(html)
  const start = lines.findIndex((l) => /^An Act (to|for)\b/i.test(l))
  const longTitle = start >= 0 ? lines[start].replace(/\s+$/, '') : null
  // The "arrangement of sections" table of contents before the long title:
  // one heading per section, in order. PLAC sometimes drops a section's
  // number in the body, so a bare heading that matches the next expected
  // entry here is taken to start that section.
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const toc = start >= 0 ? lines.slice(0, start).filter((l) => /^[A-Z][\s\S]{2,160}\.$/.test(l) && !/^(PART|CHAPTER|SCHEDULE)/.test(l)).map(norm) : []
  const arrangement = toc.length
  const commencement = lines.slice(start, start + 6).map((l) => l.match(/^\[(\d{1,2}(st|nd|rd|th)? \w+,? \d{4})\]/)?.[1]).find(Boolean) ?? null

  const sections = []
  let part = null
  let current = null
  let expected = 1
  let outOfOrder = 0
  const body = start >= 0 ? lines.slice(start + 1) : lines

  for (const raw of body) {
    const line = raw.replace(/\s+/g, ' ')
    if (/^(Subscribe to our Newsletter|CONNECT WITH US|ADDRESS|CALL OR EMAIL US|© Copyright)/i.test(line)) break
    if (/^\[Commencement\]$|^\[\d{1,2}(st|nd|rd|th)? \w+,? \d{4}\]$/.test(line)) continue

    const partMatch = line.match(/^PART ([IVXLC]+|\d+)\b\s*[-–—:]?\s*(.*)$/)
    if (partMatch && line.length < 120) {
      part = `Part ${partMatch[1]}${partMatch[2] ? ' — ' + titleCase(partMatch[2]) : ''}`
      continue
    }
    if (/^(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH)?\s*SCHEDULES?\b/.test(line) && line.length < 80 && sections.length) {
      current = { part: 'Schedules', number: `Sch${sections.filter((s) => s.number.startsWith('Sch')).length + 1}`, heading: titleCase(line), body: [] }
      sections.push(current)
      continue
    }
    const sec = line.match(/^(\d{1,3}[A-Z]?)\.\s+(.{2,200})$/)
    const num = sec ? parseInt(sec[1], 10) : NaN
    if (sec && !current?.number.startsWith('Sch') && num >= expected && num <= expected + 3 && !/^\(/.test(sec[2])) {
      if (num !== expected) outOfOrder++
      // "12. Heading text" — heading is the remainder when short, otherwise it is body text.
      const rest = sec[2].trim()
      const isHeading = rest.length <= 160 && !/[;:]$/.test(rest)
      current = { part, number: sec[1], heading: isHeading ? rest.replace(/\.$/, '') : null, body: isHeading ? [] : [rest] }
      sections.push(current)
      expected = num + 1
      continue
    }
    if (!sec && toc.length && line.length <= 160 && !current?.number.startsWith('Sch') && toc[expected - 1] && norm(line) === toc[expected - 1]) {
      current = { part, number: String(expected), heading: line.replace(/\.$/, ''), body: [] }
      sections.push(current)
      expected++
      continue
    }
    if (current) current.body.push(line)
  }

  const cleaned = sections
    .map((s, i) => ({ ...s, position: i + 1, body: s.body.join('\n').replace(/\n{3,}/g, '\n\n').trim() }))
    .filter((s) => s.body.length > 0)
  const numbered = cleaned.filter((s) => /^\d/.test(s.number))
  const quality = {
    sections: numbered.length,
    arrangement,
    outOfOrder,
    ok: numbered.length >= 2 && outOfOrder <= Math.max(2, numbered.length * 0.1) && (arrangement === 0 || numbered.length >= arrangement * 0.6),
  }
  return { title: fallbackTitle, longTitle, commencement, sections: cleaned, quality }
}

async function listLaws() {
  const out = []
  const from = Number(args['from-page'] ?? 1)
  const to = Number(args['to-page'] ?? 69)
  for (let p = from; p <= to; p++) {
    const html = await get(`${BASE}?page=${p}`)
    if (!args['pdf-only']) for (const m of html.matchAll(/href='view2\.php\?sn=(\d+)'[^>]*>([^<]+)</g)) out.push({ sn: m[1], title: m[2].replace(/\s+/g, ' ').trim() })
    for (const m of html.matchAll(/href='laws\/([A-Za-z0-9_-]+)\.pdf'[^>]*>([^<]+)</g)) out.push({ sn: `pdf:${m[1]}`, pdf: m[1], title: m[2].replace(/\s+/g, ' ').trim() })
    await sleep(DELAY)
  }
  return out
}

async function main() {
  const targets = args.only ? String(args.only).split(',').map((sn) => ({ sn, title: null })) : await listLaws()
  console.log(`laws to import: ${targets.length}`)
  let published = 0
  let review = 0
  let failed = 0
  let refused = 0
  for (const t of targets) {
    try {
      const sourceUrl = t.pdf ? `${BASE}laws/${t.pdf}.pdf` : `${BASE}view2.php?sn=${t.sn}`
      let law
      if (t.pdf) {
        const { pdfLines, parse } = await import('./lib/pdf-law.mjs')
        const res = await fetch(sourceUrl, { headers: { 'user-agent': UA } })
        if (!res.ok) throw new Error(`PDF ${res.status}`)
        const lines = await pdfLines(new Uint8Array(await res.arrayBuffer()))
        if (lines.length < 50) {
          refused++
          console.log(`REFUSED   sn=${t.sn} ${t.title} — scanned PDF, needs OCR and a human check`)
          await sleep(DELAY)
          continue
        }
        const parsed = parse(lines, null)
        law = { title: titleCase(t.title), longTitle: null, commencement: null, sections: parsed.sections, quality: { ...parsed.quality, arrangement: '-' } }
      } else {
        const html = await get(sourceUrl)
        const titleFromPage = html.match(/<h\d[^>]*>\s*([A-Z][A-Z0-9 ,.’'()&-]+ACT[^<]*)<\/h\d>/)?.[1]
        const rawTitle = t.title ?? titleFromPage ?? `PLAC law ${t.sn}`
        law = parseLaw(html, titleCase(rawTitle.replace(/\s+/g, ' ').trim()))
      }
      const year = Number(law.commencement?.match(/\d{4}$/)?.[0]) || null
      const ok = law.quality.ok

      if (dry) {
        console.log(`${ok ? 'OK    ' : 'REVIEW'} sn=${t.sn} ${law.title} — ${law.quality.sections} sections (arrangement ${law.quality.arrangement}, out-of-order ${law.quality.outOfOrder})`)
        if (args.show) for (const s of law.sections.slice(0, Number(args.show))) console.log(`   [${s.part ?? ''}] ${s.number}. ${s.heading ?? ''} :: ${s.body.slice(0, 120).replace(/\n/g, ' ⏎ ')}`)
      } else {
        // PLAC lists some titles twice; the first keeps the plain slug, later ones get their PLAC id.
        let slug = `${slugify(law.title)}-lfn-2004`
        const { data: clash } = await db.from('laws').select('external_id').eq('slug', slug).maybeSingle()
        if (clash && clash.external_id !== `plac:${t.sn}`) slug = `${slug}-${String(t.sn).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`
        const { data: row, error } = await db
          .from('laws')
          .upsert(
            {
              external_id: `plac:${t.sn}`,
              slug,
              title: law.title,
              year,
              jurisdiction: 'federal',
              long_title: law.longTitle,
              description: law.longTitle,
              source_url: sourceUrl,
              source_name: 'Policy and Legal Advocacy Centre (PLAC) — Laws of the Federation of Nigeria 2004',
              edition: 'LFN 2004',
              currency_note: 'Text as compiled in the Laws of the Federation of Nigeria 2004 (revised to 31 December 2002). It may since have been amended or repealed — check later Acts before relying on it.',
              is_published: ok,
              needs_review: !ok,
              imported_at: new Date().toISOString(),
            },
            { onConflict: 'external_id' },
          )
          .select('id')
          .single()
        if (error) throw new Error(error.message)
        await db.from('law_sections').delete().eq('law_id', row.id)
        for (let i = 0; i < law.sections.length; i += 200) {
          const chunk = law.sections.slice(i, i + 200)
          const seen = new Set()
          const rows = chunk
            .filter((s) => (seen.has(s.number) ? false : seen.add(s.number)))
            .map((s) => ({ law_id: row.id, part: s.part, number: s.number, heading: s.heading, body: s.body.slice(0, 60000), position: s.position }))
          const { error: e2 } = await db.from('law_sections').upsert(rows, { onConflict: 'law_id,number', ignoreDuplicates: true })
          if (e2) throw new Error(e2.message)
        }
        ok ? published++ : review++
        console.log(`${ok ? 'published' : 'REVIEW   '} sn=${t.sn} ${law.title} (${law.quality.sections} sections)`)
      }
    } catch (e) {
      failed++
      console.log(`FAILED    sn=${t.sn} ${t.title ?? ''} — ${e.message}`)
    }
    await sleep(DELAY)
  }
  console.log(`done: ${published} published, ${review} held for review, ${refused} scanned (skipped), ${failed} failed`)
}

main()
