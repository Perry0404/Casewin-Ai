// Explainable case classification for the registry.
//
// Deliberately rule-based: a registrar must be able to see *why* a filing was
// routed somewhere, and the result must be the same every time. Each case type
// has weighted signals; the strongest total wins and the matched signals are
// returned as the reasons.

type Signal = [pattern: RegExp, weight: number, reason: string]

const SIGNALS: Record<string, Signal[]> = {
  land: [
    [/\b(land|parcel|plot|c of o|certificate of occupancy|survey plan|deed of (conveyance|assignment)|right of occupancy)\b/i, 3, 'mentions land or title documents'],
    [/\b(trespass|declaration of title|possession|customary right|land use act|tenement|quit notice|landlord|tenant|recovery of premises)\b/i, 3, 'claims title, possession or tenancy'],
    [/\b(boundary|family land|communal land|kindred)\b/i, 2, 'concerns family or communal land'],
  ],
  family: [
    [/\b(divorce|dissolution of marriage|matrimonial|marriage act|decree nisi|judicial separation)\b/i, 4, 'seeks dissolution or relief over a marriage'],
    [/\b(custody|maintenance|child(ren)?'?s? welfare|adoption|guardianship|alimony)\b/i, 3, 'concerns custody or maintenance'],
    [/\b(wife|husband|spouse)\b/i, 1, 'parties are spouses'],
  ],
  probate: [
    [/\b(probate|letters of administration|estate of|deceased|testator|intestate|will|executor|administrator)\b/i, 4, 'concerns a deceased person’s estate'],
  ],
  criminal: [
    [/\b(charge|accused|defendant is charged|offence|criminal code|penal code|prosecution|bail|remand|acja)\b/i, 4, 'is a criminal charge or bail matter'],
    [/\b(murder|manslaughter|armed robbery|theft|stealing|fraud|kidnapping|rape|assault|cultism)\b/i, 3, 'names a criminal offence'],
  ],
  fundamental_rights: [
    [/\b(fundamental rights?|fundamental right enforcement|fren|chapter iv|section (33|34|35|36|37|38|39|40|41|42)\b)/i, 5, 'seeks enforcement of fundamental rights'],
    [/\b(unlawful(ly)? detain(ed|tion)|illegal detention|torture|police custody|habeas corpus)\b/i, 3, 'alleges unlawful detention or ill-treatment'],
  ],
  election: [
    [/\b(election petition|electoral act|returning officer|inec|primaries|candidate|ballot)\b/i, 5, 'challenges an election or nomination'],
  ],
  employment: [
    [/\b(wrongful (termination|dismissal)|employment|employer|employee|salary|wages|gratuity|pension|labour|redundancy)\b/i, 3, 'arises from an employment relationship'],
  ],
  commercial: [
    [/\b(contract|agreement|breach|invoice|loan|bank|overdraft|guarantee|debt|liquidated|goods sold|supply)\b/i, 3, 'arises from a contract, debt or banking relationship'],
    [/\b(company|shareholder|director|cama|partnership|insurance|arbitration)\b/i, 2, 'involves a company, partnership or insurer'],
    [/₦|\bn\s?\d|naira|\bsum of\b/i, 1, 'claims a liquidated sum'],
  ],
  civil: [
    [/\b(negligence|defamation|libel|slander|damages|tort|nuisance|injunction)\b/i, 2, 'claims damages or an injunction in tort'],
  ],
}

export interface Classification {
  case_type: string
  confidence: number
  reasons: string[]
  urgent: boolean
  urgency_reasons: string[]
  runner_up: string | null
}

const URGENT: Signal[] = [
  [/\b(ex parte|interim injunction|urgent|imminent|demolition|eviction (today|tomorrow)|detained|remand|bail)\b/i, 1, 'asks for urgent or interim relief'],
  [/\b(minor|child)\b.*\b(custody|abuse|welfare)\b/i, 1, 'involves a child’s welfare'],
]

export function classifyFiling(text: string, processType?: string): Classification {
  const scores: Record<string, { score: number; reasons: string[] }> = {}

  for (const [type, signals] of Object.entries(SIGNALS)) {
    for (const [pattern, weight, reason] of signals) {
      if (pattern.test(text)) {
        scores[type] ??= { score: 0, reasons: [] }
        scores[type].score += weight
        scores[type].reasons.push(reason)
      }
    }
  }

  // The originating process is itself strong evidence.
  if (processType === 'charge') bump(scores, 'criminal', 4, 'was filed as a charge')
  if (processType === 'petition' && /marriage|matrimonial|divorce/i.test(text)) bump(scores, 'family', 2, 'is a matrimonial petition')
  if (processType === 'petition' && /election/i.test(text)) bump(scores, 'election', 2, 'is an election petition')

  const ranked = Object.entries(scores).sort((a, b) => b[1].score - a[1].score)
  const urgency = URGENT.filter(([p]) => p.test(text)).map(([, , r]) => r)

  if (ranked.length === 0) {
    return { case_type: 'civil', confidence: 30, reasons: ['no specialist signals found, so routed to the general civil list'], urgent: urgency.length > 0, urgency_reasons: urgency, runner_up: null }
  }

  const [top, second] = ranked
  const margin = top[1].score - (second?.[1].score ?? 0)
  const confidence = Math.min(97, 45 + top[1].score * 6 + margin * 5)

  return {
    case_type: top[0],
    confidence,
    reasons: top[1].reasons,
    urgent: urgency.length > 0,
    urgency_reasons: urgency,
    runner_up: second ? second[0] : null,
  }
}

function bump(scores: Record<string, { score: number; reasons: string[] }>, type: string, weight: number, reason: string) {
  scores[type] ??= { score: 0, reasons: [] }
  scores[type].score += weight
  scores[type].reasons.push(reason)
}
