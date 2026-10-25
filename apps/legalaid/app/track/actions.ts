'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { COMPLAINT_KINDS, OUTCOMES, STATUS } from '@/lib/constants'
import { hashIp, hashPin } from '@/lib/cases'

export type TrackResult =
  | { error: string }
  | {
      ref: string
      status: string
      statusText: string
      kind: string
      state: string
      created_at: string
      assigned: boolean
      volunteerFirstName: string | null
      outcome: string | null
      next_hearing_on: string | null
      events: { kind: string; body: string | null; created_at: string }[]
    }
  | undefined

export async function track(_: TrackResult, f: FormData): Promise<TrackResult> {
  const ref = String(f.get('ref') ?? '').trim().toUpperCase().replace(/\s+/g, '').slice(0, 12)
  const pin = String(f.get('pin') ?? '').replace(/\D/g, '').slice(0, 6)
  const db = createAdminClient()
  const ipHash = hashIp((headers().get('x-forwarded-for') ?? '').split(',')[0]!.trim() || 'unknown')
  const { count } = await db.from('la_track_attempts').select('ip_hash', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('at', new Date(Date.now() - 3600000).toISOString())
  if ((count ?? 0) >= 10) return { error: 'Too many attempts. Wait an hour and try again.' }

  const { data: c } = await db
    .from('la_cases')
    .select('id, ref, status, kind, state, created_at, assigned_to, outcome, next_hearing_on, pin_hash')
    .eq('ref', ref)
    .maybeSingle()
  if (!c || c.pin_hash !== hashPin(ref, pin)) {
    await db.from('la_track_attempts').insert({ ip_hash: ipHash })
    return { error: 'That reference and PIN don’t match. Check both and try again.' }
  }
  const [{ data: events }, { data: vol }] = await Promise.all([
    db.from('la_case_events').select('kind, body, created_at').eq('case_id', c.id).eq('public', true).order('created_at', { ascending: false }).limit(50),
    c.assigned_to ? db.from('la_members').select('full_name').eq('user_id', c.assigned_to).maybeSingle() : Promise.resolve({ data: null }),
  ])
  return {
    ref: c.ref,
    status: c.status,
    statusText: c.outcome ? OUTCOMES[c.outcome]?.label ?? STATUS[c.status]!.public : STATUS[c.status]?.public ?? c.status,
    kind: c.kind,
    state: c.state,
    created_at: c.created_at,
    assigned: Boolean(c.assigned_to),
    volunteerFirstName: vol?.full_name ? vol.full_name.split(/\s+/).slice(0, 2).join(' ') : null,
    outcome: c.outcome,
    next_hearing_on: c.next_hearing_on,
    events: events ?? [],
  }
}

export type ProblemResult = { error?: string; ok?: string } | undefined

/** A family reports a problem (or asks for deletion). Needs the same reference and PIN as tracking. */
export async function reportProblem(_: ProblemResult, f: FormData): Promise<ProblemResult> {
  const ref = String(f.get('ref') ?? '').trim().toUpperCase().replace(/\s+/g, '').slice(0, 12)
  const pin = String(f.get('pin') ?? '').replace(/\D/g, '').slice(0, 6)
  const kind = String(f.get('kind') ?? '')
  const body = String(f.get('body') ?? '').trim().slice(0, 2000)
  if (!COMPLAINT_KINDS[kind]) return { error: 'Choose what the problem is.' }
  const db = createAdminClient()
  const { data: c } = await db.from('la_cases').select('id, ref, assigned_to, pin_hash').eq('ref', ref).maybeSingle()
  if (!c || c.pin_hash !== hashPin(ref, pin)) return { error: 'That reference and PIN don’t match.' }
  // Kept off the case timeline on purpose: the volunteer a complaint is about must not see it.
  await db.from('la_complaints').insert({ case_id: c.id, kind, body: body || null, against: kind === 'delete_my_data' ? null : c.assigned_to })
  return {
    ok:
      kind === 'delete_my_data'
        ? 'Received. We will delete this report and your details within 30 days, unless a volunteer is in the middle of court proceedings for you — then we will contact you first.'
        : kind === 'asked_for_money'
          ? 'Thank you. Do not pay anyone. An administrator will look into this today, and the volunteer can be removed from your case.'
          : 'Thank you. An administrator will look into this.',
  }
}
