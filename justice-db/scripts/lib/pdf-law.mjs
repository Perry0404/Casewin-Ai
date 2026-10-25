// Shared PDF statute parsing for the OpenLegal importers.
// Needs pdfjs-dist (npm i --no-save pdfjs-dist@4) resolvable from the current directory.
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const req = createRequire(process.cwd() + '/')
const { getDocument } = await import(pathToFileURL(req.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href)

const MARGIN = '\u0001'

export async function pdfLines(data) {
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
      rows.get(y).push({ x: it.transform[4], w: it.width ?? 0, s: it.str })
    }
    for (const y of [...rows.keys()].sort((a, b) => b - a)) {
      const row = rows.get(y).sort((a, b) => a.x - b.x)
      // Join by position: pieces that touch are one word ("S"+"u"+"b" → "Sub"), a real gap is a space.
      const join = (rs) =>
        rs
          .map((r, k) => (k && r.x - (rs[k - 1].x + rs[k - 1].w) < 0.8 && !/\s$/.test(rs[k - 1].s) && !/^\s/.test(r.s) ? '' : ' ') + r.s)
          .join('')
          .replace(/\s+/g, ' ')
          .trim()
      const main = join(row.filter((r) => r.x < marginX))
      const note = join(row.filter((r) => r.x >= marginX))
      if (main) out.push(main)
      if (note) out.push(MARGIN + note)
    }
  }
  return out.filter(Boolean)
}

export const titleCase = (s) => s.toLowerCase().replace(/(^|[\s(\-/])([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase()).replace(/\b(And|Of|The|For|To|In|On|By|With|An|A)\b/g, (m, w, i) => (i === 0 ? m : m.toLowerCase()))

export function parse(lines, strip) {
  const kept = lines.filter((l) => {
    const t = l.replace(MARGIN, '')
    return !(strip && strip.test(t)) && !/^\d{1,4}$/.test(t) && !/^Page \d+( of \d+)?$/i.test(t)
  })
  // Some PDFs have no margin column: long lines simply run past 72% of the page,
  // and the "notes" are the ends of sentences ("of the", "‐"). When most notes
  // look like that, glue every note back onto the line it came from.
  const noteTexts = kept.filter((l) => l.startsWith(MARGIN)).map((l) => l.slice(1).trim())
  // Measured: run-on PDFs have ~90% of notes starting lowercase; real margin headings 33–46%.
  const fragments = noteTexts.filter((t) => /^[a-z‐\-–,;.)]/.test(t)).length
  const marginIsColumn = noteTexts.length < 5 || fragments / noteTexts.length < 0.75
  const clean = marginIsColumn
    ? kept
    : kept.reduce((acc, l) => {
        if (l.startsWith(MARGIN) && acc.length) acc[acc.length - 1] = `${acc[acc.length - 1]} ${l.slice(1).trim()}`.replace(/\s*‐\s*$/, '‐')
        else acc.push(l)
        return acc
      }, [])
  // The table of contents repeats every heading as an unbroken run of numbered lines
  // (a few lines apart at most, even when headings wrap or part titles intervene).
  // If the first "1." opens such a run, the body starts at the first "1." after it.
  const ones = clean.map((l, i) => (/^1\.\s*\S/.test(l) ? i : -1)).filter((i) => i >= 0)
  const isNumbered = (l) => /^\d{1,3}[A-Z]?\.\s*\S/.test(l)
  let tocEnd = ones[0] ?? 0
  let tocCount = 1
  for (let i = tocEnd + 1; i < clean.length && i - tocEnd <= 6; i++) {
    if (isNumbered(clean[i])) {
      tocEnd = i
      tocCount++
    }
  }
  const start = tocCount >= 6 ? ones.find((i) => i > tocEnd) ?? ones[0] ?? 0 : ones[0] ?? 0
  // Chapter/part headings that come just before section 1 belong to it.
  let back = start
  while (back > 0 && /^(CHAPTER|PART)\b/.test(clean[back - 2] ?? '') && back - start > -6) back -= 2

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
  const same = (a, b) => {
    const n = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
    const [x, y] = [n(a), n(b)]
    return x.length > 3 && y.length > 3 && (x === y || x.startsWith(y.slice(0, 24)) || y.startsWith(x.slice(0, 24)))
  }
  const tocHeadings = [...toc.values()].map((h) => h.replace(/\.$/, ''))

  const sections = []
  let renumbered = 0
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
    const m = line.match(/^(\d{1,3}[A-Z]?)\.(?:\s+(.{2,200})|([A-Z(].{1,200}))$/)
    // Some sources print a schedule mid-Act (CITA's Third Schedule after s.24): the next
    // expected section, with its heading in the arrangement, ends the schedule.
    if (inSchedules && m && parseInt(m[1], 10) === expected && tocHeadings.some((h) => same((m[2] ?? m[3]).replace(/\.$/, ''), h))) inSchedules = false
    const sec = !inSchedules && m
    const num = sec ? parseInt(sec[1], 10) : NaN
    const text = sec ? (sec[2] ?? sec[3]) : ''
    // "1. (1) The Commission…" is a section starting with its first subsection —
    // accepted only for exactly the next expected number, to avoid list items.
    // A section the source misnumbered ("1. Privilege of law officers" where 6 is due) is
    // recognised by its heading appearing in the arrangement, and takes the expected number.
    // "16A." — a section inserted by amendment after 16.
    const inserted = sec && /[A-Z]$/.test(sec[1]) && num === expected - 1 && !sections.some((s) => s.number === sec[1])
    const misnumbered = sec && !inserted && sections.length > 0 && (num < expected || num > expected + 3) && tocHeadings.some((h) => same(text.replace(/\.$/, ''), h))
    if (sec && ((num >= expected && num <= expected + 3 && (!/^\(/.test(text) || num === expected)) || inserted || misnumbered)) {
      if (misnumbered) renumbered++
      else if (num !== expected && !inserted) outOfOrder++
      const number = misnumbered ? String(expected) : sec[1]
      const rest = text.trim()
      const isHeading = !/^\(/.test(rest) && rest.length <= 140 && !/[;,—–-]$/.test(rest) && !/^(The|A|An|Any|Every|Where|If|Subject|Notwithstanding|In)\b.*\b(shall|may|is|are)\b/.test(rest)
      current = { part: label(), number, heading: isHeading ? rest.replace(/\.$/, '') : null, start: i, body: isHeading ? [] : [rest] }
      sections.push(current)
      expected = (misnumbered ? expected : num) + 1
      continue
    }
    if (current) current.body.push(line)
  }

  // Use the arrangement only if it agrees with the body where both give a heading —
  // some sources number their arrangement wrongly (two "1."s shift every heading).
  const withBoth = sections.filter((s) => s.heading && toc.has(s.number))
  const agree = withBoth.filter((s) => same(s.heading, toc.get(s.number))).length
  const tocUsable = toc.size >= Math.min(10, sections.length * 0.5) && (withBoth.length < 5 || agree / withBoth.length >= 0.6)
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
      // PLAC's PDFs print hyphens as " ‐ " (U+2010). Kept as hyphens: "two-thirds" matters more than the odd "con-stitution".
      .replace(/(\w) ?‐ ?(\w)/g, '$1-$2')
      // PDF kerning artifacts: "Act ," → "Act,", "V oters" → "Voters" (never touches "A" or "I").
      .replace(/ ([,;:.)])/g, '$1')
      .replace(/\b([B-HJ-Z]) ([a-z]{2,})/g, '$1$2')
      .trim()

  const out = sections.map((s, i) => ({ ...s, position: i + 1, body: reflow(s.body) })).filter((s) => s.body)
  const numbered = out.filter((s) => /^\d/.test(s.number))
  return {
    sections: out,
    quality: { sections: numbered.length, outOfOrder, renumbered, ok: numbered.length >= 3 && outOfOrder <= Math.max(2, numbered.length * 0.05) && renumbered <= Math.max(2, numbered.length * 0.2) },
  }
}
