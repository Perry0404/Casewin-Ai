// The CaseWin justice-infrastructure stack.
//
// Single source of truth for the four layers that make up "Africa's justice
// infrastructure". The landing page, the tools page, and navigation all render
// from this so the product story stays consistent everywhere.
//
// status:
//   'live' — shipped and usable today
//   'soon' — scaffolded / on the roadmap (shown but marked Coming soon)

export type ToolStatus = 'live' | 'soon'

export interface StackTool {
  name: string
  href: string
  desc: string
  icon: string
  status: ToolStatus
  premium?: boolean
}

export interface JusticeLayer {
  id: string
  number: number
  title: string
  tagline: string
  description: string
  /** Tailwind gradient classes for the layer accent. */
  gradient: string
  /** Tailwind border colour token for cards. */
  border: string
  tools: StackTool[]
}

export const JUSTICE_STACK: JusticeLayer[] = [
  {
    id: 'knowledge',
    number: 1,
    title: 'Knowledge intelligence',
    tagline: 'Everything the firm knows, in one engine',
    description:
      'A private intelligence layer over your firm’s documents and the wider legal landscape — search by meaning, and let new developments find the lawyer.',
    gradient: 'from-blue-500 to-cyan-500',
    border: 'border-blue-500/30',
    tools: [
      { name: 'Knowledge Agent', href: '/tools/knowledge', desc: 'Upload firm documents and query them by meaning', icon: '\u{1F9E0}', status: 'live', premium: true },
      { name: 'Daily Intelligence Brief', href: '/tools/intelligence', desc: 'AI-curated legal updates tailored to your practice', icon: '\u{1F4F0}', status: 'live', premium: true },
      { name: 'Legal Research', href: '/tools/research', desc: 'Search 10,000+ Nigerian judgments and statutes', icon: '\u{1F50D}', status: 'live' },
      { name: 'Case Search', href: '/tools/cases', desc: 'Find and track relevant cases', icon: '\u{1F4DA}', status: 'live' },
      { name: 'Citations', href: '/tools/citations', desc: 'Verify and format legal citations', icon: '\u{1F517}', status: 'live' },
    ],
  },
  {
    id: 'lawyers',
    number: 2,
    title: 'AI for lawyers',
    tagline: 'Turn chaos into one case narrative',
    description:
      'Lawyers receive WhatsApp messages, voice notes, contracts and receipts — not structured data. This layer climbs from raw evidence to a finished draft, built for the lawyer, not instead of them.',
    gradient: 'from-purple-500 to-fuchsia-500',
    border: 'border-purple-500/30',
    tools: [
      { name: 'Document Drafting', href: '/tools/draft', desc: 'Contracts, letters, affidavits, pleadings', icon: '\u{1F4DD}', status: 'live' },
      { name: 'Contract Analysis', href: '/tools/analyze', desc: 'Risks, unfair terms, compliance issues', icon: '\u{1F4C4}', status: 'live' },
      { name: 'Case Prediction', href: '/tools/predict', desc: 'Outcome probability from case law', icon: '\u{1F52E}', status: 'live' },
      { name: 'Judgment Summarization', href: '/tools/summarize', desc: 'Facts, issues, ratio decidendi', icon: '\u{1F4CB}', status: 'live' },
      { name: 'Argument Generation', href: '/tools/arguments', desc: 'Persuasive arguments with authorities', icon: '\u{2696}\u{FE0F}', status: 'live' },
      { name: 'Compliance Check', href: '/tools/compliance', desc: 'CAMA, NDPR, CBN, tax laws', icon: '\u{2705}', status: 'live' },
      { name: 'Legal Translation', href: '/tools/translate', desc: 'Yoruba, Igbo, Hausa, Pidgin', icon: '\u{1F30D}', status: 'live' },
      { name: 'Legal Chatbot', href: '/tools/chatbot', desc: 'Ask Nigerian legal questions', icon: '\u{1F4AC}', status: 'live' },
    ],
  },
  {
    id: 'dispute',
    number: 3,
    title: 'AI dispute resolution',
    tagline: 'Most disputes should never reach court',
    description:
      'Resolve disputes before they ever become a case: AI intake, evidence analysis, a settlement engine that predicts probability, and a transactions layer that carries an agreement all the way to a closed matter.',
    gradient: 'from-emerald-500 to-green-500',
    border: 'border-emerald-500/30',
    tools: [
      { name: 'Case Intake', href: '/marketplace/case-intake', desc: 'Describe a dispute; AI structures the narrative', icon: '\u{1F4E5}', status: 'live' },
      { name: 'Settlement Engine', href: '/dispute/settlement', desc: 'Settlement range, timeline & litigation risk', icon: '\u{1F4CA}', status: 'live' },
      { name: 'Dispute Resolution', href: '/dispute', desc: 'Intake → analysis → settlement → court only if needed', icon: '\u{1F91D}', status: 'live' },
      { name: 'Legal Transactions', href: '/invoices', desc: 'Agreement → invoice → payment → matter closed', icon: '\u{1F9FE}', status: 'live' },
    ],
  },
  {
    id: 'court',
    number: 4,
    title: 'Court infrastructure',
    tagline: 'Courts are information systems',
    description:
      'Once courts go digital, justice becomes measurable. Structured e-filing, automatic case routing, optimised scheduling and tamper-proof evidence — the rails beneath the courtroom.',
    gradient: 'from-orange-500 to-amber-500',
    border: 'border-orange-500/30',
    tools: [
      { name: 'E-Filing Assistant', href: '/tools/filing', desc: 'Court-ready filing checklists & formatting', icon: '\u{1F4C1}', status: 'live' },
      { name: 'Case Classification', href: '/court/classify', desc: 'Auto-route cases: commercial, family, criminal, civil', icon: '\u{1F5C2}\u{FE0F}', status: 'live' },
      { name: 'Scheduling Optimizer', href: '/court/scheduling', desc: 'Airline logic for hearing dates — no wasted adjournments', icon: '\u{1F4C5}', status: 'live' },
      { name: 'Evidence Verification', href: '/court/evidence', desc: 'Hash + timestamp proof that evidence was never altered', icon: '\u{1F512}', status: 'live' },
      { name: 'Justice Analytics', href: '/court/analytics', desc: 'Backlogs, durations, where judges are needed', icon: '\u{1F4C8}', status: 'live' },
    ],
  },
]

export function getLayer(id: string): JusticeLayer | undefined {
  return JUSTICE_STACK.find((l) => l.id === id)
}
