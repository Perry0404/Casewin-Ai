import type { Metadata } from 'next'
import { Shell } from '@/components/site'
import CopyButton from '@/components/CopyButton'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = { title: 'API & MCP server', description: 'Free REST API and Model Context Protocol server for Nigerian judgments and statutes.' }

const MCP_URL = `${SITE_URL}/api/mcp`

const CLAUDE_CONFIG = `{
  "mcpServers": {
    "openlegal-nigeria": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${MCP_URL}"]
    }
  }
}`

const TOOLS = [
  ['search_judgments', 'Full-text search over published judgments, with filters for court, area of law and year.'],
  ['get_judgment', 'One judgment in full: holding, issues, statutes and cases cited, full text.'],
  ['search_laws', 'Search statute sections, e.g. “personal liberty”.'],
  ['get_law_section', 'The text of one section, e.g. constitution-1999 § 36.'],
  ['list_laws', 'Statutes available, with their ids.'],
  ['list_courts', 'Courts publishing on the network.'],
  ['check_case', 'Is a case already on OpenLegal, or waiting for review?'],
  ['submit_judgment', 'Contribute a judgment’s full text (needs your contributor key — see /contribute).'],
  ['my_contributions', 'Your contribution points, rank and submission statuses.'],
]

const ENDPOINTS = [
  ['GET', '/api/v1/judgments?q=fair+hearing', 'Search judgments. Also: court, case_type, year_from, year_to, page, limit.'],
  ['GET', '/api/v1/judgments/{id}', 'One judgment with full text.'],
  ['GET', '/api/v1/laws', 'List statutes.'],
  ['GET', '/api/v1/laws?q=personal+liberty', 'Search statute sections.'],
  ['GET', '/api/v1/laws?law=constitution-1999&section=36', 'One section.'],
  ['POST', '/api/v1/submissions', 'Contribute a judgment. Header: Authorization: Bearer olk_… (your contributor key).'],
  ['GET', '/api/v1/submissions', 'Your points and submission statuses (same header).'],
]

function Code({ children, copy }: { children: string; copy?: boolean }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-2xl bg-ink p-5 font-mono text-[13px] leading-relaxed text-paper-2">{children}</pre>
      {copy && (
        <div className="absolute right-3 top-3 rounded-lg bg-white/90">
          <CopyButton text={children} label="Copy" />
        </div>
      )}
    </div>
  )
}

export default function Developers() {
  return (
    <Shell query="">
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-naija-600">Developers</p>
        <h1 className="mt-2 font-serif text-5xl font-medium tracking-tight text-ink">Build on Nigerian law</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-2">
          Everything on OpenLegal is available to programs — free, read-only, no key required. Please cite the court and link back to the
          judgment page when you show results.
        </p>

        <section id="mcp" className="mt-16 scroll-mt-24">
          <h2 className="font-serif text-3xl font-semibold text-ink">MCP server</h2>
          <p className="mt-3 text-ink-2">
            The <a href="https://modelcontextprotocol.io" className="text-naija-700 underline underline-offset-4">Model Context Protocol</a> lets AI
            assistants call OpenLegal directly. The server speaks Streamable HTTP at:
          </p>
          <div className="mt-4">
            <Code copy>{MCP_URL}</Code>
          </div>

          <h3 className="mt-8 font-semibold text-ink">Claude (web &amp; desktop)</h3>
          <p className="mt-2 text-ink-2">Settings → Connectors → Add custom connector, and paste the URL above.</p>

          <h3 className="mt-6 font-semibold text-ink">Claude Code</h3>
          <div className="mt-2">
            <Code copy>{`claude mcp add --transport http openlegal-nigeria ${MCP_URL}`}</Code>
          </div>

          <h3 className="mt-6 font-semibold text-ink">Clients that only support local servers</h3>
          <div className="mt-2">
            <Code copy>{CLAUDE_CONFIG}</Code>
          </div>

          <h3 className="mt-8 font-semibold text-ink">Tools</h3>
          <dl className="mt-3 divide-y divide-ink-line rounded-2xl border border-ink-line bg-white">
            {TOOLS.map(([n, d]) => (
              <div key={n} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[180px_1fr]">
                <dt className="font-mono text-sm text-naija-700">{n}</dt>
                <dd className="text-sm text-ink-2">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="api" className="mt-16 scroll-mt-24">
          <h2 className="font-serif text-3xl font-semibold text-ink">REST API</h2>
          <p className="mt-3 text-ink-2">JSON over HTTPS. CORS is open, so you can call it from a browser.</p>
          <dl className="mt-5 divide-y divide-ink-line rounded-2xl border border-ink-line bg-white">
            {ENDPOINTS.map(([m, p, d]) => (
              <div key={p} className="px-5 py-3.5">
                <dt className="font-mono text-sm">
                  <span className="mr-2 rounded bg-naija-50 px-1.5 py-0.5 text-xs font-semibold text-naija-700">{m}</span>
                  {p}
                </dt>
                <dd className="mt-1 text-sm text-ink-3">{d}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-8 font-semibold text-ink">Example</h3>
          <div className="mt-2">
            <Code copy>{`curl "${SITE_URL}/api/v1/judgments?q=declaration+of+title&case_type=land&limit=5"`}</Code>
          </div>
          <div className="mt-3">
            <Code>{`{
  "query": "declaration of title",
  "total": 12,
  "results": [
    {
      "id": "how-142-2026-chukwu-v-okeke-3f2a",
      "title": "Chukwu v. Okeke",
      "suit_number": "HOW/142/2026",
      "court": "High Court of Imo State",
      "holding": "…",
      "excerpt": "…sought a declaration of title…",
      "cite_as": "Chukwu v. Okeke (2026) Suit No. HOW/142/2026, High Court of Imo State",
      "url": "${SITE_URL}/judgments/how-142-2026-chukwu-v-okeke-3f2a"
    }
  ]
}`}</Code>
          </div>
          <p className="mt-6 text-sm text-ink-3">
            Demonstration judgments are excluded from the API and MCP server unless you pass <code className="font-mono">include_samples=true</code>.
          </p>
        </section>
      </div>
    </Shell>
  )
}
