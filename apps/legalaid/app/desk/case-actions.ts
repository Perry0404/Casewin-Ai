'use server'

import { redirect } from 'next/navigation'
import { createHash } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { canWork, logEvent, requireMember } from '@/lib/auth'
import { DOC_KINDS } from '@/lib/constants'
import { alertVolunteer } from '@/lib/notify'

const str = (f: FormData, k: string, n = 300) => String(f.get(k) ?? '').trim().slice(0, n)
const ALLOWED = /^(application\/pdf|image\/(jpeg|png|webp|heic))$/

async function loadCase(id: string) {
  const { data } = await createAdminClient().from('la_cases').select('*').eq('id', id).maybeSingle()
  return data
}

/** An approved lawyer takes responsibility for a case held by a law student or paralegal. */
export async function superviseCase(f: FormData) {
  const m = await requireMember()
  const c = await loadCase(str(f, 'id'))
  if (!c) redirect('/desk')
  if (m.role !== 'lawyer' || c.supervisor_id || !c.assigned_to || c.assigned_to === m.user_id) redirect(`/desk/cases/${c.id}`)
  if (f.get('no_conflict') !== 'on') redirect(`/desk/cases/${c.id}?error=conflict`)
  const now = new Date().toISOString()
  const { data } = await createAdminClient()
    .from('la_cases')
    .update({ supervisor_id: m.user_id, supervised_at: now, updated_at: now })
    .eq('id', c.id)
    .is('supervisor_id', null)
    .select('id')
    .maybeSingle()
  if (!data) redirect(`/desk/cases/${c.id}?error=taken`)
  await logEvent({
    case_id: c.id,
    actor: m.user_id,
    actor_label: m.full_name,
    kind: 'supervised',
    body: `${m.full_name}${m.enrolment_number ? ` (${m.enrolment_number})` : ''} is the supervising lawyer. Confirmed no conflict of interest.`,
  })
  await alertVolunteer(c.assigned_to, c.id, `A lawyer is supervising ${c.ref}`, `${m.full_name} is now the supervising lawyer on ${c.ref}. You can now record court steps and outcomes.`, 'supervised').catch(() => {})
  redirect(`/desk/cases/${c.id}?saved=1`)
}

export async function uploadDocument(f: FormData) {
  const m = await requireMember()
  const c = await loadCase(str(f, 'id'))
  if (!c || !canWork(m, c)) redirect('/desk')
  const file = f.get('file')
  const kind = DOC_KINDS[str(f, 'kind', 30)] ? str(f, 'kind', 30) : 'other'
  if (!(file instanceof File) || file.size === 0) redirect(`/desk/cases/${c.id}?error=file#documents`)
  if (file.size > 10 * 1024 * 1024) redirect(`/desk/cases/${c.id}?error=too-big#documents`)
  if (!ALLOWED.test(file.type)) redirect(`/desk/cases/${c.id}?error=file-type#documents`)
  const bytes = Buffer.from(await file.arrayBuffer())
  const name = file.name.replace(/[^\w.\- ]+/g, '_').slice(0, 120)
  const path = `${c.id}/${crypto.randomUUID()}-${name}`
  const db = createAdminClient()
  const { error } = await db.storage.from('la-documents').upload(path, bytes, { contentType: file.type, upsert: false })
  if (error) redirect(`/desk/cases/${c.id}?error=upload#documents`)
  await db.from('la_documents').insert({ case_id: c.id, kind, name, path, size: file.size, sha256: createHash('sha256').update(bytes).digest('hex'), uploaded_by: m.user_id })
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'document', body: `Added ${DOC_KINDS[kind]}: ${name}` })
  redirect(`/desk/cases/${c.id}?saved=1#documents`)
}

/** Opens a document through a link that expires in 5 minutes, and records who opened it. */
export async function openDocument(f: FormData) {
  const m = await requireMember()
  const db = createAdminClient()
  const { data: d } = await db.from('la_documents').select('id, case_id, name, path').eq('id', str(f, 'doc')).maybeSingle()
  const c = d ? await loadCase(d.case_id) : null
  if (!d || !c || !canWork(m, c)) redirect('/desk')
  const { data } = await db.storage.from('la-documents').createSignedUrl(d.path, 300)
  if (!data?.signedUrl) redirect(`/desk/cases/${c.id}?error=upload#documents`)
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'document_opened', body: `Opened ${d.name}` })
  redirect(data.signedUrl)
}

/** Links to the case on CaseWin Court by suit number, so hearings come straight from the registry. */
export async function linkCourtCase(f: FormData) {
  const m = await requireMember()
  const c = await loadCase(str(f, 'id'))
  if (!c || !canWork(m, c)) redirect('/desk')
  const suit = str(f, 'suit_number', 60).toUpperCase().replace(/\s+/g, '')
  const db = createAdminClient()
  const { data: matches } = await db.from('cases').select('id, suit_number, title, court:courts(name)').eq('suit_number', suit).eq('is_sample', false).limit(2)
  if (!matches?.length) redirect(`/desk/cases/${c.id}?error=no-court-case#court`)
  if (matches.length > 1) redirect(`/desk/cases/${c.id}?error=many-court-cases#court`)
  const k = matches[0]!
  const courtName = (k.court as unknown as { name: string } | null)?.name ?? c.court_name
  await db.from('la_cases').update({ court_case_id: k.id, charge_number: k.suit_number, court_name: courtName, updated_at: new Date().toISOString() }).eq('id', c.id)
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'court_link', body: `Linked to ${k.suit_number} — ${k.title}, on CaseWin Court` })
  redirect(`/desk/cases/${c.id}?saved=1#court`)
}

// ── Clearing house: refer a case to an organisation ─────────────────────────

export async function referToOrg(f: FormData) {
  const m = await requireMember()
  if (!(m.isAdmin || m.role === 'coordinator')) redirect('/desk')
  const c = await loadCase(str(f, 'id'))
  if (!c) redirect('/desk')
  const db = createAdminClient()
  const { data: org } = await db.from('la_organisations').select('id, name, created_by').eq('id', str(f, 'org')).eq('status', 'approved').maybeSingle()
  if (!org) redirect(`/desk/cases/${c.id}?error=assign`)
  await db.from('la_cases').update({ referred_org: org.id, referred_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', c.id)
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'referred', body: `Referred to ${org.name}` })
  if (org.created_by)
    await alertVolunteer(org.created_by, c.id, `Case ${c.ref} referred to ${org.name}`, `Case ${c.ref} (${c.state}) has been referred to ${org.name}. Assign a member from your Team page within 48 hours.`, 'referred').catch(() => {})
  redirect(`/desk/cases/${c.id}?saved=1`)
}

// ── Diversion ────────────────────────────────────────────────────────────────

const DIVERSION_STATUS = ['suitable', 'referred', 'in_progress', 'completed', 'declined', 'unsuitable']
const DIVERSION_ROUTE = ['multi_door_courthouse', 'citizens_mediation_centre', 'community_mediation', 'restorative_meeting', 'plea_bargain', 'other']

export async function setDiversion(f: FormData) {
  const m = await requireMember()
  const c = await loadCase(str(f, 'id'))
  if (!c || !canWork(m, c)) redirect('/desk')
  const status = DIVERSION_STATUS.includes(str(f, 'status', 20)) ? str(f, 'status', 20) : null
  const route = DIVERSION_ROUTE.includes(str(f, 'route', 40)) ? str(f, 'route', 40) : null
  if (!status) redirect(`/desk/cases/${c.id}#diversion`)
  const note = str(f, 'note', 1000)
  await createAdminClient()
    .from('la_cases')
    .update({ diversion_status: status, diversion_route: route, diversion_note: note || null, diversion_updated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', c.id)
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'diversion', body: `Diversion: ${status.replace(/_/g, ' ')}${route ? ` — ${route.replace(/_/g, ' ')}` : ''}${note ? ` — ${note}` : ''}` })
  redirect(`/desk/cases/${c.id}?saved=1#diversion`)
}

// ── Rights-violation register ────────────────────────────────────────────────

const INCIDENT_KINDS = ['extortion', 'torture', 'unlawful_detention', 'detention_of_relative', 'sexual_violence', 'death_in_custody', 'unlawful_seizure', 'threats', 'other']
const AGENCIES = ['police', 'military', 'dss', 'efcc', 'correctional_service', 'other']

export async function logIncident(f: FormData) {
  const m = await requireMember()
  const caseId = str(f, 'case_id', 40) || null
  const c = caseId ? await loadCase(caseId) : null
  if (caseId && (!c || !canWork(m, c))) redirect('/desk')
  const kind = str(f, 'kind', 30)
  const state = str(f, 'state', 40) || c?.state || ''
  if (!INCIDENT_KINDS.includes(kind) || !state) redirect(caseId ? `/desk/cases/${caseId}?error=incident#rights` : '/desk/incidents?error=incident')
  const amount = Number(str(f, 'amount', 12).replace(/\D/g, ''))
  await createAdminClient()
    .from('la_incidents')
    .insert({
      case_id: caseId,
      kind,
      occurred_on: /^\d{4}-\d{2}-\d{2}$/.test(str(f, 'occurred_on', 10)) ? str(f, 'occurred_on', 10) : null,
      state,
      town: str(f, 'town', 120) || c?.lga || null,
      facility: str(f, 'facility', 200) || c?.facility || null,
      agency: AGENCIES.includes(str(f, 'agency', 30)) ? str(f, 'agency', 30) : 'police',
      description: str(f, 'description', 3000) || null,
      amount_demanded: amount > 0 ? amount : null,
      // Recorded by a volunteer who met the person or saw the evidence counts as verified.
      verified: f.get('verified') === 'on',
      recorded_by: m.user_id,
    })
  if (c) await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'incident', body: `Rights violation recorded: ${kind.replace(/_/g, ' ')}` })
  redirect(caseId ? `/desk/cases/${caseId}?saved=1#rights` : '/desk/incidents?saved=1')
}

export async function setShowPublicly(f: FormData) {
  const m = await requireMember()
  await createAdminClient().from('la_members').update({ show_publicly: f.get('show') === 'yes' }).eq('user_id', m.user_id)
  redirect('/desk/record?saved=1')
}
