// Loads demonstration data into a court so the registry, cause list and
// analytics can be shown before real cases exist. Everything it creates is
// flagged is_sample = true, shown with a "Sample" tag in the UI, and removed
// by Registry → Court settings → "Remove all sample data".
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node justice-db/scripts/seed-sample.mjs imo-high-court
//
// Party names are invented. Sample judges are labelled "(sample)".

import { createClient } from '@supabase/supabase-js'

const slug = process.argv[2] || 'imo-high-court'
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })

// Deterministic PRNG so repeated runs look the same.
let seed = 20260101
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
const pick = (a) => a[Math.floor(rand() * a.length)]
const weighted = (pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [v, w] of pairs) if ((r -= w) < 0) return v
  return pairs[0][0]
}
const DAY = 86400000

const { data: court } = await db.from('courts').select('id, name, state').eq('slug', slug).single()
if (!court) throw new Error(`No court with slug ${slug}`)
const { data: divisions } = await db.from('divisions').select('id, code, name').eq('court_id', court.id)
if (!divisions?.length) throw new Error('Add divisions first')

const { count: already } = await db.from('cases').select('id', { count: 'exact', head: true }).eq('court_id', court.id).eq('is_sample', true)
if (already) {
  console.log(`${already} sample cases already exist — remove them from Court settings before re-seeding.`)
  process.exit(0)
}

// ── Judges ──
const JUDGES = [
  ['Hon. Justice Adaeze Okoro (sample)', 'Court 1', ['land', 'civil']],
  ['Hon. Justice Emeka Nwosu (sample)', 'Court 2', ['commercial', 'employment']],
  ['Hon. Justice Ngozi Eze (sample)', 'Court 3', ['family', 'probate']],
  ['Hon. Justice Chidi Anyanwu (sample)', 'Court 4', ['criminal', 'fundamental_rights']],
  ['Hon. Justice Ifeoma Uche (sample)', 'Court 5', ['land', 'civil']],
  ['Hon. Justice Obinna Iwu (sample)', 'Court 6', ['commercial', 'civil']],
  ['Hon. Justice Amaka Onyeka (sample)', 'Court 7', ['land', 'probate']],
]
const { data: judges, error: jErr } = await db
  .from('judges')
  .insert(JUDGES.map(([name, courtroom, specialisations], i) => ({ court_id: court.id, division_id: divisions[i % divisions.length].id, name, courtroom, specialisations, is_sample: true })))
  .select('id, specialisations, division_id, courtroom')
if (jErr) throw jErr
// One judge carries a visibly heavier docket, as often happens in practice.
const judgeWeights = judges.map((j, i) => [j, i === 0 ? 2.2 : 1])

// ── Cases ──
const SURNAMES = ['Okonkwo', 'Eze', 'Nwachukwu', 'Ibe', 'Opara', 'Uzor', 'Okafor', 'Nnadi', 'Iheanacho', 'Mbah', 'Ugwu', 'Anozie', 'Ejiogu', 'Duru', 'Njoku', 'Onwuka', 'Akujobi', 'Emenike', 'Ihejirika', 'Obi', 'Chukwuma', 'Ogbonna', 'Nwankwo', 'Orji']
const COMPANIES = ['Owerri Agro Ltd', 'Orlu Microfinance Bank', 'Heartland Builders Ltd', 'Oguta Lake Hotels Ltd', 'Mbaise Transport Co.', 'Imo Palm Produce Ltd']
const TYPES = [['land', 30], ['civil', 18], ['commercial', 16], ['family', 9], ['probate', 6], ['criminal', 10], ['fundamental_rights', 7], ['employment', 4]]
const REASONS = [['Counsel absent', 26], ['Hearing notice not served', 19], ['Witness absent', 14], ['Judge not sitting', 12], ['Party absent', 9], ['Case file not ready', 7], ['Time ran out', 8], ['Settlement talks', 5]]

const now = Date.now()
const seq = Object.fromEntries(divisions.map((d) => [d.id, {}]))
const cases = []
for (let i = 0; i < 640; i++) {
  // More recent filings than old ones, but a long tail back four years.
  const ageDays = Math.floor(Math.pow(rand(), 1.6) * 1460) + 3
  const filed = new Date(now - ageDays * DAY)
  const year = filed.getUTCFullYear()
  const div = weighted(divisions.map((d, k) => [d, k === 0 ? 3 : 1]))
  seq[div.id][year] = (seq[div.id][year] ?? 0) + 1
  const type = weighted(TYPES)
  const judge = weighted(judgeWeights.map(([j, w]) => [j, j.specialisations.includes(type) ? w * 3 : w]))
  const claimant = type === 'criminal' ? 'The State' : rand() < 0.15 ? pick(COMPANIES) : `${pick(['Chief ', 'Mr. ', 'Mrs. ', 'Dr. ', ''])}${pick(['Chinedu', 'Ada', 'Ikenna', 'Ngozi', 'Uche', 'Kelechi', 'Chioma', 'Obinna'])} ${pick(SURNAMES)}`
  const defendant = rand() < 0.12 ? pick(COMPANIES) : `${pick(['Chinedu', 'Ada', 'Ikenna', 'Ngozi', 'Uche', 'Kelechi', 'Chioma', 'Obinna', 'Emeka', 'Nkem'])} ${pick(SURNAMES)}`
  const sur = (n) => (n.split(' ').length > 2 || /Ltd|Bank|Co\.|State/.test(n) ? n : n.split(' ').pop())
  const many = rand() < 0.3

  // Older cases are more likely disposed; clearance just under 100%.
  const pDisposed = Math.min(0.92, ageDays / 900)
  let status = 'active'
  let disposed_at = null
  if (rand() < pDisposed) {
    status = weighted([['judgment_delivered', 55], ['struck_out', 18], ['settled', 17], ['withdrawn', 10]])
    disposed_at = new Date(filed.getTime() + Math.min(ageDays - 1, 90 + rand() * Math.max(30, ageDays - 90)) * DAY).toISOString()
  } else {
    status = weighted([['active', 55], ['adjourned', 30], ['reserved', 6], ['pending_assignment', 3]])
  }
  cases.push({
    court_id: court.id,
    division_id: div.id,
    suit_number: `${div.code}/${seq[div.id][year]}/${year}`,
    title: `${sur(claimant)} v. ${sur(defendant)}${many ? ' & Ors.' : ''}`,
    case_type: type,
    claimants: [{ name: claimant }],
    defendants: [{ name: defendant }],
    judge_id: status === 'pending_assignment' ? null : judge.id,
    status,
    urgent: type === 'fundamental_rights' && rand() < 0.4,
    filed_at: filed.toISOString(),
    assigned_at: status === 'pending_assignment' ? null : new Date(filed.getTime() + 5 * DAY).toISOString(),
    disposed_at,
    adjournment_count: Math.floor(rand() * Math.min(14, ageDays / 45)),
    is_sample: true,
  })
}

// Keep the division sequences ahead of the sample numbers.
for (const d of divisions) {
  const y = new Date().getUTCFullYear()
  const used = seq[d.id][y] ?? 0
  await db.from('divisions').update({ next_suit_seq: used + 1, suit_seq_year: y }).eq('id', d.id)
}

const inserted = []
for (let i = 0; i < cases.length; i += 200) {
  const { data, error } = await db.from('cases').insert(cases.slice(i, i + 200)).select('id, status, judge_id, filed_at, disposed_at, case_type, title, suit_number, division_id')
  if (error) throw error
  inserted.push(...data)
}
console.log(`Inserted ${inserted.length} sample cases`)

// ── Hearings: last 90 days with outcomes, next 30 days listed ──
const jById = Object.fromEntries(judges.map((j) => [j.id, j]))
const hearings = []
const at = (day, minutes) => new Date(Math.floor(day / DAY) * DAY + (8 * 60 + minutes) * 60000).toISOString() // 09:00 WAT onwards
for (const c of inserted) {
  if (!c.judge_id) continue
  const open = !c.disposed_at
  for (let k = 0; k < 4; k++) {
    let day = now - Math.floor(rand() * 90) * DAY
    const dow = new Date(day).getUTCDay()
    if (dow === 0 || dow === 6) day += (dow === 0 ? 1 : 2) * DAY
    if (day > now || day < new Date(c.filed_at).getTime()) continue
    if (c.disposed_at && day > new Date(c.disposed_at).getTime()) continue
    const outcome = weighted([['held', 42], ['adjourned', 46], ['not_sitting', 12]])
    hearings.push({
      case_id: c.id,
      court_id: court.id,
      judge_id: c.judge_id,
      scheduled_for: at(day, Math.floor(rand() * 8) * 30),
      courtroom: jById[c.judge_id].courtroom,
      purpose: weighted([['mention', 30], ['hearing', 30], ['trial', 20], ['motion', 15], ['adoption', 5]]),
      outcome,
      adjournment_reason: outcome === 'adjourned' ? weighted(REASONS) : outcome === 'not_sitting' ? 'Judge not sitting' : null,
    })
  }
  if (open && rand() < 0.75) {
    let day = now + Math.floor(rand() * 30) * DAY
    const dow = new Date(day).getUTCDay()
    if (dow === 0 || dow === 6) day += (dow === 0 ? 1 : 2) * DAY
    hearings.push({
      case_id: c.id,
      court_id: court.id,
      judge_id: c.judge_id,
      scheduled_for: at(day, Math.floor(rand() * 8) * 30),
      courtroom: jById[c.judge_id].courtroom,
      purpose: weighted([['mention', 35], ['hearing', 30], ['trial', 20], ['motion', 10], ['ruling', 5]]),
    })
  }
}
// Make sure today has a full-looking list.
const today = new Date(now)
if (today.getUTCDay() !== 0 && today.getUTCDay() !== 6) {
  const open = inserted.filter((c) => !c.disposed_at && c.judge_id)
  for (let i = 0; i < 28 && i < open.length; i++) {
    hearings.push({
      case_id: open[i].id,
      court_id: court.id,
      judge_id: open[i].judge_id,
      scheduled_for: at(now, (i % 7) * 30),
      courtroom: jById[open[i].judge_id].courtroom,
      purpose: pick(['mention', 'hearing', 'trial', 'motion']),
    })
  }
}
for (let i = 0; i < hearings.length; i += 500) {
  const { error } = await db.from('hearings').insert(hearings.slice(i, i + 500))
  if (error) throw error
}
// next_hearing_at for open cases
const nextBy = {}
for (const h of hearings) if (!h.outcome && (!nextBy[h.case_id] || h.scheduled_for < nextBy[h.case_id])) nextBy[h.case_id] = h.scheduled_for
for (const [id, when] of Object.entries(nextBy)) await db.from('cases').update({ next_hearing_at: when }).eq('id', id)
console.log(`Inserted ${hearings.length} sample hearings`)

// ── Sample judgments (published, clearly labelled) ──
const delivered = inserted.filter((c) => c.status === 'judgment_delivered').slice(0, 6)
const BODY = {
  land: {
    holding: 'The claimant proved a better title to the land through cogent traditional evidence and acts of possession; declaration and injunction granted, damages for trespass awarded.',
    issues: ['Whether the claimant proved title by traditional history', 'Whether the defendant’s entry amounted to trespass'],
    statutes: ['Land Use Act 1978, s. 34', 'Evidence Act 2011, s. 131'],
    keywords: ['declaration of title', 'traditional history', 'trespass', 'customary right of occupancy'],
  },
  commercial: {
    holding: 'The defendant breached the supply agreement by failing to pay on the agreed dates; judgment entered for the liquidated sum with 10% post-judgment interest.',
    issues: ['Whether a binding contract existed', 'Whether the claimant proved the liquidated sum'],
    statutes: ['Sale of Goods Law of Imo State'],
    keywords: ['breach of contract', 'liquidated damages', 'interest'],
  },
  fundamental_rights: {
    holding: 'The applicant’s detention beyond the constitutional period without being brought before a court violated section 35(4); declaration and compensation granted.',
    issues: ['Whether the detention breached section 35 of the Constitution'],
    statutes: ['Constitution of the Federal Republic of Nigeria 1999, s. 35(4)', 'Fundamental Rights (Enforcement Procedure) Rules 2009'],
    keywords: ['fundamental rights', 'unlawful detention', 'personal liberty', 'section 35'],
  },
  default: {
    holding: 'The claim succeeds in part; the reliefs proved on the balance of probabilities are granted and the rest dismissed.',
    issues: ['Whether the claimant proved the claim on the balance of probabilities'],
    statutes: ['Evidence Act 2011, s. 134'],
    keywords: ['burden of proof', 'balance of probabilities'],
  },
}
const judgments = delivered.map((c, i) => {
  const b = BODY[c.case_type] ?? BODY.default
  const judge = judges.find((j) => j.id === c.judge_id)
  const name = JUDGES[judges.indexOf(judge)]?.[0] ?? 'Sample judge'
  const div = divisions.find((d) => d.id === c.division_id)
  return {
    slug: `sample-${c.suit_number.toLowerCase().replace(/\//g, '-')}-${i}`,
    court_id: court.id,
    case_id: c.id,
    source: 'court_upload',
    title: c.title,
    suit_number: c.suit_number,
    court_name: court.name,
    division: div?.name ?? null,
    state: court.state,
    judges: [name],
    case_type: c.case_type,
    delivered_on: (c.disposed_at ?? new Date().toISOString()).slice(0, 10),
    summary: `SAMPLE — demonstration only. This is not a real decision. It shows how a judgment published by the registry appears on OpenLegal Nigeria. ${b.holding}`,
    holding: b.holding,
    issues: b.issues,
    keywords: b.keywords,
    statutes_cited: b.statutes,
    cases_cited: [],
    full_text: `SAMPLE JUDGMENT — FOR DEMONSTRATION ONLY. NOT A REAL DECISION.\n\nIN THE ${court.name.toUpperCase()}\nIN THE ${(div?.name ?? '').toUpperCase()}\nSUIT NO: ${c.suit_number}\n\nBETWEEN: ${c.title}\n\nJUDGMENT\n\nThis sample text illustrates the structure of a published judgment: the parties, the issues for determination, the evidence, the court's resolution of each issue, and the orders made.\n\nISSUES FOR DETERMINATION\n${b.issues.map((x, k) => `${k + 1}. ${x}.`).join('\n')}\n\nRESOLUTION\nHaving considered the pleadings, the evidence and the written addresses of counsel, the court holds as follows. ${b.holding}\n\nThe statutes considered include: ${b.statutes.join('; ')}.\n\nThis is the judgment of the court.\n\n${name}\nJudge`,
    status: 'published',
    redaction_confirmed: true,
    published_at: new Date().toISOString(),
    is_sample: true,
  }
})
if (judgments.length) {
  const { error } = await db.from('judgments').insert(judgments)
  if (error) throw error
}
console.log(`Inserted ${judgments.length} sample judgments`)
console.log('Done. Remove everything later under Registry → Court settings → Remove all sample data.')
