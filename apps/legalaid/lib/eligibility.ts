import { INCOME_BANDS, MIN_WAGE } from '@/lib/constants'

// A guide for the volunteer, not a decision: the Legal Aid Council applies its own
// means test, and anyone in custody without a lawyer needs help first and questions later.
export function eligibility(c: { kind: string; income_band: string | null; vulnerable: string[] | null; person_age: number | null; can_pay: boolean }) {
  const reasons: string[] = []
  if (c.income_band === 'none' || c.income_band === 'below_min_wage') reasons.push(`income below the national minimum wage (₦${MIN_WAGE.toLocaleString()})`)
  if (c.kind === 'detention') reasons.push('in custody')
  if ((c.person_age ?? 99) < 18 || c.vulnerable?.includes('child')) reasons.push('a child')
  for (const v of c.vulnerable ?? []) if (v !== 'child') reasons.push(v === 'disability' ? 'has a disability' : v === 'pregnant' ? 'pregnant or nursing' : v === 'ill' ? 'sick or injured' : v === 'elderly' ? 'elderly' : 'displaced')
  const likely = reasons.length > 0 && c.income_band !== 'above_2x'
  return {
    likely,
    income: c.income_band ? INCOME_BANDS[c.income_band] : 'Not given',
    reasons,
    note: c.income_band === 'above_2x' ? 'Income is above twice the minimum wage — consider referring to a fee-paying lawyer unless the person is in custody.' : c.can_pay ? 'The family says it can pay something.' : null,
  }
}
