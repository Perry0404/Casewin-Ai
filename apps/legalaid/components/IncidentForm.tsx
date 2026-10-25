import { STATES } from '@/lib/constants'
import { logIncident } from '@/app/desk/case-actions'
import { INCIDENT_LABELS } from './NationalPicture'
import { Field, btn, input } from './ui'

/** Used on the rights register (no case) and on a case file (caseId set, state taken from the case). */
export default function IncidentForm({ caseId, defaultState, facility }: { caseId?: string; defaultState?: string; facility?: string | null }) {
  return (
    <form action={logIncident} className="space-y-3">
      {caseId && <input type="hidden" name="case_id" value={caseId} />}
      <Field label="What happened">
        <select name="kind" required defaultValue="" className={input}>
          <option value="" disabled>
            Choose…
          </option>
          {Object.entries(INCIDENT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="By">
          <select name="agency" defaultValue="police" className={input}>
            <option value="police">Police</option>
            <option value="military">Military</option>
            <option value="dss">DSS</option>
            <option value="efcc">EFCC</option>
            <option value="correctional_service">Correctional service</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="When">
          <input type="date" name="occurred_on" className={input} />
        </Field>
      </div>
      {!caseId && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="State">
            <select name="state" defaultValue={defaultState} className={input}>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Town">
            <input name="town" className={input} />
          </Field>
        </div>
      )}
      <Field label="Station or facility" hint="Visible to CaseWin only, never published.">
        <input name="facility" defaultValue={facility ?? ''} className={input} />
      </Field>
      <Field label="Money demanded (₦), if any">
        <input name="amount" inputMode="numeric" className={input} />
      </Field>
      <Field label="Description" hint="Facts only: who, what, when. Visible to administrators and you.">
        <textarea name="description" rows={3} className={input} />
      </Field>
      <label className="flex gap-3 text-[14px] text-ink-800">
        <input type="checkbox" name="verified" className="mt-1 h-4 w-4 shrink-0 accent-ink-950" />
        <span>I saw this myself, saw evidence of it, or heard it directly from the person it happened to.</span>
      </label>
      <button className={btn.primary}>Record incident</button>
    </form>
  )
}
