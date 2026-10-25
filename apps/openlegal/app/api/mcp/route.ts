import { NextRequest, NextResponse } from 'next/server'
import { toolGetJudgment, toolGetLawSection, toolListCourts, toolListLaws, toolSearchJudgments, toolSearchLaws } from '@/lib/tools'

export const dynamic = 'force-dynamic'

// OpenLegal Nigeria MCP server — Streamable HTTP transport, stateless.
// Every request is a single JSON-RPC message answered with a JSON response;
// no sessions and no server-initiated messages, which suits a read-only
// public data source.

const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']

const SERVER_INFO = { name: 'openlegal-nigeria', title: 'OpenLegal Nigeria', version: '1.0.0' }

const INSTRUCTIONS =
  'OpenLegal Nigeria provides judgments published by Nigerian courts and the text of Nigerian statutes. ' +
  'Search first, then fetch the full judgment or section you need. Always give the user the cite_as string and url for anything you rely on. ' +
  'Results marked sample: true are demonstration data and must never be presented as real law.'

const TOOLS = [
  {
    name: 'search_judgments',
    title: 'Search Nigerian judgments',
    description: 'Full-text search over judgments published by Nigerian courts. Supports quoted phrases, OR and -exclusions. Returns ranked results with excerpts, holdings and citations.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search terms, e.g. "declaration of title" customary, or a suit number like HOW/142/2026' },
        court: { type: 'string', description: 'Exact court name to filter by, e.g. "High Court of Imo State"' },
        case_type: { type: 'string', enum: ['civil', 'commercial', 'land', 'family', 'probate', 'criminal', 'fundamental_rights', 'election', 'employment'] },
        year_from: { type: 'integer' },
        year_to: { type: 'integer' },
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 25, default: 10 },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_judgment',
    title: 'Read a judgment',
    description: 'Fetch one judgment in full by its id (from search_judgments): holding, issues, statutes and cases cited, and the full text.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The judgment id returned by search_judgments' },
        max_chars: { type: 'integer', description: 'Truncate the full text to this many characters (default 60000)' },
      },
      required: ['id'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'search_laws',
    title: 'Search Nigerian statutes',
    description: 'Full-text search over statute sections (e.g. the 1999 Constitution). Returns matching sections with excerpts.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'e.g. "fair hearing" or "personal liberty"' },
        law: { type: 'string', description: 'Optional law_id to search within, e.g. constitution-1999' },
        limit: { type: 'integer', minimum: 1, maximum: 25, default: 8 },
      },
      required: ['query'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_law_section',
    title: 'Read a statute section',
    description: 'Fetch the text of one section of a statute.',
    inputSchema: {
      type: 'object',
      properties: {
        law_id: { type: 'string', description: 'e.g. constitution-1999 (see list_laws)' },
        section: { type: 'string', description: 'Section number, e.g. 36' },
      },
      required: ['law_id', 'section'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'list_laws',
    title: 'List statutes',
    description: 'List the statutes available on OpenLegal with their law_id.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'list_courts',
    title: 'List courts',
    description: 'List the courts publishing on the network.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
]

type Rpc = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: Record<string, unknown> }

const ok = (id: Rpc['id'], result: unknown) => NextResponse.json({ jsonrpc: '2.0', id, result })
const fail = (id: Rpc['id'], code: number, message: string, status = 200) => NextResponse.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, { status })

function toolResult(data: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data as Record<string, unknown> }
}

async function callTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'search_judgments':
      return toolResult(await toolSearchJudgments(args))
    case 'get_judgment': {
      const j = await toolGetJudgment(args as { id: string; max_chars?: number })
      return j ? toolResult(j) : { content: [{ type: 'text', text: `No published judgment with id "${args.id}".` }], isError: true }
    }
    case 'search_laws':
      return toolResult(await toolSearchLaws(args as { query: string; law?: string; limit?: number }))
    case 'get_law_section': {
      const s = await toolGetLawSection(args as { law_id: string; section: string })
      return s ? toolResult(s) : { content: [{ type: 'text', text: `Section ${args.section} of ${args.law_id} not found. Use list_laws or search_laws.` }], isError: true }
    }
    case 'list_laws':
      return toolResult(await toolListLaws())
    case 'list_courts':
      return toolResult(await toolListCourts())
    default:
      return null
  }
}

export async function POST(req: NextRequest) {
  let msg: Rpc
  try {
    msg = await req.json()
  } catch {
    return fail(null, -32700, 'Parse error', 400)
  }
  if (Array.isArray(msg)) return fail(null, -32600, 'Batching is not supported', 400)
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return fail(msg?.id, -32600, 'Invalid request', 400)

  // Notifications (no id) get 202 Accepted with no body.
  if (msg.id === undefined || msg.method.startsWith('notifications/')) return new NextResponse(null, { status: 202 })

  try {
    switch (msg.method) {
      case 'initialize': {
        const requested = String(msg.params?.protocolVersion ?? '')
        return ok(msg.id, {
          protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS,
        })
      }
      case 'ping':
        return ok(msg.id, {})
      case 'tools/list':
        return ok(msg.id, { tools: TOOLS })
      case 'tools/call': {
        const name = String(msg.params?.name ?? '')
        const args = (msg.params?.arguments ?? {}) as Record<string, unknown>
        const result = await callTool(name, args)
        if (!result) return fail(msg.id, -32602, `Unknown tool: ${name}`)
        return ok(msg.id, result)
      }
      default:
        return fail(msg.id, -32601, `Method not found: ${msg.method}`)
    }
  } catch (e) {
    console.error('mcp error', e)
    // Tool failures are reported as tool results so the model can recover.
    if (msg.method === 'tools/call') return ok(msg.id, { content: [{ type: 'text', text: 'The search service is temporarily unavailable. Try again shortly.' }], isError: true })
    return fail(msg.id, -32603, 'Internal error')
  }
}

// No server-to-client stream: this server never initiates messages.
export async function GET() {
  return new NextResponse('OpenLegal Nigeria MCP server. Send JSON-RPC over POST.', { status: 405, headers: { Allow: 'POST' } })
}

export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
