'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { FACILITY_TYPES, INCOME_BANDS, KINDS, LANGUAGES, STATES, VULNERABLE } from '@/lib/constants'
import type { Dict } from '@/lib/i18n'
import { Field, Notice, btn, cx, input } from '@/components/ui'
import { submitReport } from './actions'

function Submit({ t }: { t: Dict }) {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending} className={btn.primary + ' w-full !py-4 !text-base'}>
      {pending ? t.sending : t.send}
    </button>
  )
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-ink-950 pt-5">
      <legend className="sr-only">{title}</legend>
      <p className="flex items-baseline gap-3 text-[19px] font-semibold text-ink-950">
        <span className="font-mono text-[13px] font-normal text-ink-400">{n}.</span>
        {title}
      </p>
      <div className="mt-5 space-y-4">{children}</div>
    </fieldset>
  )
}

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
const kindText = (t: Dict, k: string) => (t as unknown as Record<string, [string, string]>)[`kind_${k}`] ?? [KINDS[k]!.label, KINDS[k]!.help]

export default function ReportForm({ defaultKind = 'detention', t, lang }: { defaultKind?: string; t: Dict; lang: string }) {
  const [state, action] = useFormState(submitReport, undefined)
  const [kind, setKind] = useState(KINDS[defaultKind] ? defaultKind : 'detention')
  const [self, setSelf] = useState(false)
  const [remanded, setRemanded] = useState(false)
  const [safe, setSafe] = useState(defaultKind === 'family' ? 'text_only' : 'yes')
  const custody = kind === 'detention'

  return (
    <form action={action} className="space-y-10">
      <input name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-0 w-0" aria-hidden />
      <input type="hidden" name="form_language" value={lang} />

      <Section n={1} title={t.s1}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {Object.keys(KINDS).map((k) => (
            <label key={k} className={cx('cursor-pointer rounded-md border p-4 transition-colors', kind === k ? 'border-ink-950 bg-ink-50 ring-1 ring-ink-950' : 'border-ink-200 hover:border-ink-400')}>
              <input
                type="radio"
                name="kind"
                value={k}
                checked={kind === k}
                onChange={() => {
                  setKind(k)
                  if (k === 'family' && safe === 'yes') setSafe('text_only')
                }}
                className="sr-only"
              />
              <span className="block font-semibold text-ink-950">{kindText(t, k)[0]}</span>
              <span className="mt-0.5 block text-[13px] text-ink-500">{kindText(t, k)[1]}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section n={2} title={custody ? t.s2_custody : t.s2_other}>
        <label className="flex items-center gap-3 rounded-md bg-parchment px-4 py-3 text-sm text-ink-700">
          <input type="checkbox" checked={self} onChange={(e) => setSelf(e.target.checked)} className="h-4 w-4 accent-ink-900" />
          {custody ? t.self_custody : t.self_other}
        </label>
        <Field label={t.full_name} required>
          <input name="person_name" required minLength={3} className={input} placeholder={t.full_name_ph} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.age} hint={t.age_hint}>
            <input name="person_age" type="number" min={1} max={120} inputMode="numeric" className={input} />
          </Field>
          <Field label={t.sex}>
            <select name="person_sex" className={input} defaultValue="">
              <option value="">{t.sex_none}</option>
              <option value="female">{t.female}</option>
              <option value="male">{t.male}</option>
            </select>
          </Field>
        </div>
        {custody && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.where_held}>
                <select name="facility_type" className={input} defaultValue="police_station">
                  {Object.entries(FACILITY_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t.facility_name}>
                <input name="facility" className={input} placeholder="e.g. Area F Police Division, Ikeja" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.arrest_date} hint={t.arrest_hint}>
                <input name="arrested_on" type="date" max={today()} className={input} />
              </Field>
              <Field label={t.accused}>
                <input name="allegation" className={input} placeholder={t.accused_ph} />
              </Field>
            </div>
            <label className="flex items-center gap-3 text-sm text-ink-700">
              <input type="checkbox" checked={remanded} onChange={(e) => setRemanded(e.target.checked)} className="h-4 w-4 accent-ink-900" />
              {t.remanded}
            </label>
            {remanded && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t.remand_date}>
                  <input name="remanded_on" type="date" max={today()} className={input} />
                </Field>
                <Field label={t.which_court}>
                  <input name="court_name" className={input} placeholder="e.g. Magistrate Court, Owerri" />
                </Field>
                <Field label={t.next_court}>
                  <input name="next_hearing_on" type="date" className={input} />
                </Field>
              </div>
            )}
          </>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.state} required>
            <select name="state" required className={input} defaultValue="">
              <option value="" disabled>
                {t.choose}
              </option>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label={t.lga}>
            <input name="lga" className={input} />
          </Field>
        </div>
      </Section>

      <Section n={3} title={t.s3}>
        <Field label={t.story} required hint={t.story_hint}>
          <textarea name="story" required minLength={30} rows={6} className={input} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.has_lawyer}>
            <select name="has_lawyer" className={input} defaultValue="no">
              <option value="no">{t.no}</option>
              <option value="yes">{t.has_lawyer_yes}</option>
            </select>
          </Field>
          <Field label={t.can_pay}>
            <select name="can_pay" className={input} defaultValue="no">
              <option value="no">{t.no}</option>
              <option value="yes">{t.can_pay_yes}</option>
            </select>
          </Field>
        </div>
        <Field label={t.income}>
          <select name="income_band" className={input} defaultValue="unknown">
            {Object.entries(INCOME_BANDS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.vulnerable}>
          <div className="flex flex-wrap gap-2">
            {Object.entries(VULNERABLE).map(([k, v]) => (
              <label key={k} className="cursor-pointer">
                <input type="checkbox" name="vulnerable" value={k} className="peer sr-only" />
                <span className="inline-block rounded-md border border-ink-300 px-3 py-1.5 text-[13px] text-ink-700 transition-colors peer-checked:border-ink-950 peer-checked:bg-ink-950 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brass-500/40">
                  {v}
                </span>
              </label>
            ))}
          </div>
        </Field>
      </Section>

      <Section n={4} title={t.s4}>
        {!self && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.your_name}>
              <input name="reporter_name" className={input} />
            </Field>
            <Field label={t.relationship}>
              <select name="relationship" className={input} defaultValue="family">
                <option value="family">{t.rel_family}</option>
                <option value="friend">{t.rel_friend}</option>
                <option value="colleague">{t.rel_colleague}</option>
                <option value="community">{t.rel_community}</option>
                <option value="other">{t.rel_other}</option>
              </select>
            </Field>
          </div>
        )}
        {self && <input type="hidden" name="relationship" value="self" />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.phone} required hint={t.phone_hint}>
            <input name="reporter_phone" type="tel" required inputMode="tel" className={input} placeholder="0803 123 4567" />
          </Field>
          <Field label={t.language}>
            <select name="language" className={input} defaultValue={lang === 'pcm' ? 'Pidgin' : lang === 'ha' ? 'Hausa' : lang === 'yo' ? 'Yoruba' : lang === 'ig' ? 'Igbo' : 'English'}>
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>
        <fieldset>
          <legend className="mb-1 text-[14px] font-medium text-ink-900">{t.safe}</legend>
          <p className="mb-2 text-[13px] text-ink-500">{t.safe_hint}</p>
          <div className="space-y-1.5">
            {(
              [
                ['yes', t.safe_yes],
                ['text_only', t.safe_text],
                ['no_calls', t.safe_no],
                ['other_way', t.safe_other],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center gap-3 text-[14px] text-ink-800">
                <input type="radio" name="safe_contact" value={k} checked={safe === k} onChange={() => setSafe(k)} className="h-4 w-4 accent-ink-950" />
                {label}
              </label>
            ))}
          </div>
          {safe !== 'yes' && (
            <div className="mt-3">
              <Field label={t.safe_note} required={safe === 'no_calls' || safe === 'other_way'}>
                <input name="safe_contact_note" required={safe === 'no_calls' || safe === 'other_way'} className={input} placeholder={t.safe_note_ph} />
              </Field>
            </div>
          )}
        </fieldset>
        <Field label={t.email}>
          <input name="reporter_email" type="email" className={input} />
        </Field>
      </Section>

      <div className="space-y-4 border-t border-ink-950 pt-6">
        <label className="flex gap-3 text-[14px] leading-relaxed text-ink-700">
          <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 shrink-0 accent-ink-950" />
          <span>
            {t.consent}{' '}
            <a href="/privacy" target="_blank" className="prose-link">
              Privacy
            </a>
          </span>
        </label>
        {state?.error && <Notice tone="bad">{state.error}</Notice>}
        <Submit t={t} />
      </div>
    </form>
  )
}
