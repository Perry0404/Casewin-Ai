import { createAdminClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/auth'

/** Claims with no first action after 48 hours go back to the board. Runs whenever the board or admin loads. */
export async function sweepOverdue() {
  const db = createAdminClient()
  const { data } = await db.from('la_cases').select('id').eq('status', 'assigned').is('first_action_at', null).lt('first_action_due', new Date().toISOString())
  for (const c of data ?? []) {
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
  }
  return (data ?? []).length
}
