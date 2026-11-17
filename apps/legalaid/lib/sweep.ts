import { createAdminClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/auth'
import { alertVolunteer } from '@/lib/notify'

/** Claims with no first action after 48 hours go back to the board. Runs whenever the board or admin loads. */
export async function sweepOverdue() {
  const db = createAdminClient()
  const { data } = await db.from('la_cases').select('id, ref, assigned_to').eq('status', 'assigned').is('first_action_at', null).lt('first_action_due', new Date().toISOString())
  // Panel lawyers work through their coordinator on WhatsApp; the coordinator follows up, not the sweep.
  const ids = [...new Set((data ?? []).map((c) => c.assigned_to).filter(Boolean))] as string[]
  const { data: panel } = ids.length ? await db.from('la_members').select('user_id').in('user_id', ids).eq('on_panel', true) : { data: [] }
  const onPanel = new Set((panel ?? []).map((p) => p.user_id))
  for (const c of data ?? []) {
    if (c.assigned_to && onPanel.has(c.assigned_to)) continue
    const { data: done } = await db
      .from('la_cases')
      .update({ assigned_to: null, assigned_org: null, assigned_at: null, first_action_due: null, status: 'new', updated_at: new Date().toISOString() })
      .eq('id', c.id)
      .eq('status', 'assigned')
      .is('first_action_at', null)
      .select('id')
      .maybeSingle()
    if (!done) continue
    await logEvent({ case_id: c.id, kind: 'released', actor_label: 'CaseWin Legal Aid', body: 'No action within 48 hours — returned to the board.' })
    await logEvent({ case_id: c.id, kind: 'public_update', actor_label: 'CaseWin Legal Aid', body: 'We are finding another volunteer for this case.', public: true })
    if (c.assigned_to) await alertVolunteer(c.assigned_to, c.id, `${c.ref} went back to the board`, `Case ${c.ref} had no action in 48 hours and has gone back to the board for another volunteer.`, 'returned').catch(() => {})
  }
  return (data ?? []).length
}
