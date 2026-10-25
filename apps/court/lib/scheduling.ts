// Judge allocation and hearing-date suggestions.

export interface JudgeLoad {
  id: string
  name: string
  courtroom: string | null
  division_id: string | null
  specialisations: string[]
  active_cases: number
}

/**
 * Suggests a judge for a new case: prefer judges in the same division who
 * take this case type, then the lightest docket. Returns the ranked list so
 * the registrar can see the alternatives and override.
 */
export function rankJudges(judges: JudgeLoad[], caseType: string, divisionId: string | null) {
  const avg = judges.length ? judges.reduce((s, j) => s + j.active_cases, 0) / judges.length : 0
  return judges
    .map((j) => {
      let score = -j.active_cases
      const reasons: string[] = []
      if (divisionId && j.division_id === divisionId) {
        score += 15
        reasons.push('sits in this division')
      }
      if (j.specialisations.includes(caseType)) {
        score += 10
        reasons.push('takes this case type')
      }
      if (avg && j.active_cases < avg * 0.85) reasons.push(`lighter docket than average (${j.active_cases} vs ${Math.round(avg)})`)
      if (avg && j.active_cases > avg * 1.25) reasons.push(`heavier docket than average (${j.active_cases} vs ${Math.round(avg)})`)
      return { ...j, score, reasons }
    })
    .sort((a, b) => b.score - a.score)
}

export interface DateSuggestion {
  date: string // YYYY-MM-DD
  listed: number
  capacity: number
}

/**
 * Earliest sitting days for a judge with room on the list. Skips weekends and
 * any dates the court has marked as non-sitting (public holidays, vacation).
 */
export function suggestDates(opts: {
  listedPerDay: Record<string, number>
  capacity?: number
  from?: Date
  count?: number
  nonSitting?: string[]
}): DateSuggestion[] {
  const capacity = opts.capacity ?? 12
  const count = opts.count ?? 4
  const nonSitting = new Set(opts.nonSitting ?? [])
  const out: DateSuggestion[] = []
  const d = new Date(opts.from ?? Date.now() + 7 * 86400000)
  d.setUTCHours(0, 0, 0, 0)

  for (let i = 0; i < 180 && out.length < count; i++) {
    const iso = d.toISOString().slice(0, 10)
    const dow = d.getUTCDay()
    const listed = opts.listedPerDay[iso] ?? 0
    if (dow !== 0 && dow !== 6 && !nonSitting.has(iso) && listed < capacity) {
      out.push({ date: iso, listed, capacity })
    }
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}
