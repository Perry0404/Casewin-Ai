'use client'

import Link from 'next/link'

const STEPS = [
  { n: 1, title: 'AI intake', desc: 'Describe the dispute in plain language. AI structures who, what, when and against whom.', href: '/marketplace/case-intake', cta: 'Start intake' },
  { n: 2, title: 'Evidence analysis', desc: 'Upload contracts, chats, receipts and voice notes — turned into one case narrative.', href: '/tools/knowledge', cta: 'Open Knowledge Agent' },
  { n: 3, title: 'Settlement estimate', desc: 'Get a realistic settlement range, expected timeline and litigation risk.', href: '/dispute/settlement', cta: 'Run Settlement Engine' },
  { n: 4, title: 'Lawyer review', desc: 'Bring a verified lawyer in to validate and negotiate — only if you want one.', href: '/marketplace', cta: 'Find a lawyer' },
  { n: 5, title: 'Agreement & payment', desc: 'Generate the settlement agreement, invoice and payment link. Matter closed.', href: '/invoices', cta: 'Generate agreement' },
]

export default function DisputePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-emerald-900/50 to-green-900/30 border-b border-emerald-900/40">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <p className="text-emerald-300 font-semibold tracking-widest text-xs uppercase mb-3">Layer 3 · AI dispute resolution</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Most disputes should never reach court.</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            The current system: dispute → lawyer → court → years. CaseWin’s path resolves the dispute
            first — and goes to court <span className="text-white font-semibold">only if necessary</span>.
          </p>
          <Link href="/matter" className="inline-block mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-colors">
            Open a matter →
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="space-y-4">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative">
              <div className="flex gap-4 bg-gray-900 rounded-xl p-5 border border-gray-800">
                <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300">
                  {s.n}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">{s.title}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{s.desc}</p>
                  <Link href={s.href} className="inline-block mt-3 text-emerald-400 text-sm font-semibold hover:underline">
                    {s.cta} →
                  </Link>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="ml-9 h-4 border-l-2 border-dashed border-gray-700" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gray-900 rounded-xl p-5 border border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            If settlement fails, the structured case file and evidence carry straight into
            <Link href="/tools/filing" className="text-emerald-400 hover:underline"> court filing</Link> —
            nothing is re-done.
          </p>
        </div>
      </div>
    </div>
  )
}
