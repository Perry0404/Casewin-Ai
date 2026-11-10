// Patterns that often signal details which must be redacted before a judgment is published.
// Used by the court registry and by the Justice admin.
export const REDACTION_HINTS: [RegExp, string][] = [
  [/\b(minor|child|aged \d{1,2}|\d{1,2}[- ]year[- ]old)\b/i, 'mentions a child or a person’s age'],
  [/\b(rape|sexual|defilement|indecent)\b/i, 'concerns a sexual offence — the victim’s identity must be withheld'],
  [/\b(in camera|under seal|sealed)\b/i, 'refers to sealed or in-camera proceedings'],
  [/\b(\+?234|0)[789][01]\d{8}\b/, 'contains what looks like a phone number'],
  [/\b\d{11}\b/, 'contains an 11-digit number (possible NIN or BVN)'],
]

export function redactionHints(text: string | null | undefined) {
  return REDACTION_HINTS.filter(([re]) => re.test(text ?? '')).map(([, why]) => why)
}
