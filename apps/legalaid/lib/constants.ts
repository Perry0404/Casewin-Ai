export type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral'

export const COURT_URL = process.env.NEXT_PUBLIC_COURT_URL || 'https://court.casewinai.com'
export const OPENLEGAL_URL = process.env.NEXT_PUBLIC_OPENLEGAL_URL || 'https://openlegal.casewinai.com'
export const CASEWIN_URL = 'https://casewinai.com'

export const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const

export const LANGUAGES = ['English', 'Pidgin', 'Igbo', 'Yoruba', 'Hausa', 'Efik', 'Ibibio', 'Tiv', 'Ijaw', 'Kanuri', 'Fulfulde', 'Edo'] as const

export const KINDS: Record<string, { label: string; short: string; help: string }> = {
  detention: { label: 'Someone is detained', short: 'Detention', help: 'Held at a police station, correctional centre or by another agency.' },
  police_abuse: { label: 'Police extortion or abuse', short: 'Police abuse', help: 'Bail-for-money, torture, unlawful seizure, threats.' },
  family: { label: 'Family or domestic violence', short: 'Family', help: 'Violence at home, custody, maintenance, inheritance.' },
  land_housing: { label: 'Land, rent or eviction', short: 'Land & housing', help: 'Forced eviction, land grabbing, tenancy.' },
  employment: { label: 'Work and unpaid wages', short: 'Employment', help: 'Unpaid wages, wrongful dismissal, injury at work.' },
  other_civil: { label: 'Something else', short: 'Other', help: 'Any other legal problem you cannot afford a lawyer for.' },
}

export const FACILITY_TYPES: Record<string, string> = {
  police_station: 'Police station / division',
  correctional_centre: 'Correctional centre (prison)',
  efcc_dss_other: 'EFCC, DSS, military or other agency',
  unknown: 'I don’t know where',
}

export const STATUS: Record<string, { label: string; tone: Tone; public: string }> = {
  new: { label: 'Waiting for a volunteer', tone: 'warn', public: 'Received. We are finding a volunteer lawyer near you.' },
  assigned: { label: 'Volunteer assigned', tone: 'info', public: 'A volunteer has taken the case and will contact you.' },
  in_progress: { label: 'Being worked on', tone: 'info', public: 'A volunteer is working on the case.' },
  resolved: { label: 'Resolved', tone: 'good', public: 'The case has an outcome.' },
  closed: { label: 'Closed', tone: 'neutral', public: 'The case is closed.' },
  spam: { label: 'Not a genuine request', tone: 'bad', public: 'This request could not be verified.' },
}

export const OUTCOMES: Record<string, { label: string; release?: boolean }> = {
  released_bail: { label: 'Released on bail', release: true },
  released_unconditional: { label: 'Released without charge', release: true },
  charges_struck_out: { label: 'Charges struck out', release: true },
  discharged: { label: 'Discharged by the court', release: true },
  acquitted: { label: 'Acquitted', release: true },
  settled: { label: 'Settled / mediated' },
  judgment_won: { label: 'Judgment obtained' },
  referred: { label: 'Referred to another provider' },
  withdrawn: { label: 'Client withdrew' },
  other: { label: 'Other outcome' },
}

/** What a volunteer can record on a file. `first` counts as the first action on a claimed case. */
export const ACTIONS: Record<string, { label: string; first: boolean }> = {
  contacted_family: { label: 'Spoke to the family / reporter', first: true },
  visited_facility: { label: 'Visited the person in custody', first: true },
  bail_application: { label: 'Filed a bail application', first: true },
  fundamental_rights: { label: 'Filed fundamental rights enforcement', first: true },
  appeared_in_court: { label: 'Appeared in court', first: true },
  wrote_to_police: { label: 'Wrote to the police / agency', first: true },
  mediation: { label: 'Held a mediation / settlement meeting', first: true },
  obtained_documents: { label: 'Obtained charge sheet / remand order', first: true },
  note: { label: 'Note', first: false },
}

export const ROLES: Record<string, string> = {
  lawyer: 'Lawyer (called to the Nigerian Bar)',
  paralegal: 'Paralegal',
  law_student: 'Law student (supervised)',
  coordinator: 'Organisation coordinator',
}

export const ORG_KINDS: Record<string, string> = {
  legal_aid_council: 'Legal Aid Council of Nigeria office',
  pdss: 'Public Defender / Citizens’ Rights (state)',
  ngo: 'NGO / civil society',
  law_clinic: 'University law clinic',
  nba_branch: 'NBA branch / pro bono committee',
  chambers: 'Law firm / chambers (pro bono)',
  faith_community: 'Faith or community organisation',
  other: 'Other',
}

export const PRACTICE_AREAS = ['Criminal defence', 'Bail & remand', 'Fundamental rights', 'Family & domestic violence', 'Land & tenancy', 'Employment', 'Child justice', 'Inheritance'] as const
