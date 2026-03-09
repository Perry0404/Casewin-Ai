import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Allow up to 30s for Oracle analysis

// ============================================================
// TWILIO CONFIG
// ============================================================
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || ''
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || ''
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '' // e.g. whatsapp:+14155238886
const TWILIO_WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp`
  : 'https://casewin.ng/api/whatsapp'

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://casewin.ng'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ============================================================
// TWILIO SIGNATURE VALIDATION
// ============================================================
function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!TWILIO_AUTH_TOKEN) return true // Skip validation if no auth token (sandbox testing)

  // Sort params alphabetically and concatenate
  const data = url + Object.keys(params).sort().reduce((acc, key) => acc + key + params[key], '')
  const expected = crypto
    .createHmac('sha1', TWILIO_AUTH_TOKEN)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64')

  return signature === expected
}

// ============================================================
// SEND MESSAGE VIA TWILIO REST API (for async replies)
// ============================================================
async function sendTwilioMessage(to: string, body: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.error('Twilio credentials not configured')
    return false
  }

  try {
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
    const params = new URLSearchParams({
      To: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
      From: TWILIO_WHATSAPP_NUMBER,
      Body: body,
    })

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      console.error('Twilio send error:', err)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send Twilio message:', error)
    return false
  }
}

// ============================================================
// TWIML RESPONSE HELPER
// ============================================================
function twimlResponse(message?: string): NextResponse {
  const xml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ============================================================
// WEBHOOK STATUS (GET) — Health check + sandbox info
// ============================================================
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    provider: 'twilio',
    bot: 'CaseWin Predictions',
    webhook: TWILIO_WEBHOOK_URL,
    sandbox: TWILIO_WHATSAPP_NUMBER
      ? `Send "join <sandbox-keyword>" to ${TWILIO_WHATSAPP_NUMBER} to start`
      : 'Configure TWILIO_WHATSAPP_NUMBER to enable',
    features: [
      'prediction_markets',
      'ai_oracle_grok4',
      'live_betting',
      'wallet_management',
      'legal_tools',
    ],
  })
}

// ============================================================
// INCOMING MESSAGES (POST) — Twilio sends messages here
// ============================================================
export async function POST(request: NextRequest) {
  try {
    // Twilio sends form-urlencoded data
    const formData = await request.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    // Validate Twilio signature (security)
    const signature = request.headers.get('x-twilio-signature') || ''
    if (TWILIO_AUTH_TOKEN && !validateTwilioSignature(signature, TWILIO_WEBHOOK_URL, params)) {
      console.warn('Invalid Twilio signature — rejecting request')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Extract message data from Twilio payload
    const from = params['From'] || ''      // whatsapp:+2348067117651
    const body = params['Body'] || ''       // message text
    const profileName = params['ProfileName'] || '' // WhatsApp display name
    const numMedia = parseInt(params['NumMedia'] || '0')

    if (!body.trim()) {
      return twimlResponse()
    }

    // Clean phone number for session key (remove 'whatsapp:' prefix)
    const phone = from.replace('whatsapp:', '')

    console.log(`📨 Twilio WhatsApp | ${profileName || phone}: ${body}`)

    // Process message and generate reply
    const reply = await processWhatsAppMessage(phone, body, profileName)

    // Return reply as TwiML (Twilio sends it to user)
    return twimlResponse(reply)
  } catch (error) {
    console.error('Twilio webhook error:', error)
    return twimlResponse('Something went wrong. Type *help* to try again.')
  }
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================
interface Session {
  state: 'idle' | 'browsing' | 'betting' | 'confirming' | 'asking_oracle'
  category?: string
  markets?: any[]
  selectedMarket?: any
  outcome?: 'yes' | 'no'
  shares?: number
  balance: number
  name?: string
  lastActivity: number
}

const sessions = new Map<string, Session>()

function getSession(phone: string, name?: string): Session {
  if (!sessions.has(phone)) {
    sessions.set(phone, {
      state: 'idle',
      balance: 50000,
      name,
      lastActivity: Date.now(),
    })
  }
  const s = sessions.get(phone)!
  s.lastActivity = Date.now()
  if (name) s.name = name
  return s
}

// Cleanup stale sessions every 30 minutes (serverless: runs per-request)
function cleanupSessions() {
  const now = Date.now()
  for (const [phone, session] of sessions) {
    if (now - session.lastActivity > 60 * 60 * 1000) { // 1 hour
      sessions.delete(phone)
    }
  }
}

// ============================================================
// MARKET HELPERS
// ============================================================
const CATEGORIES: Record<string, string> = {
  all: '🌐 All', sports: '⚽ Sports', crypto: '₿ Crypto',
  technology: '💻 Tech', world_politics: '🌍 Politics',
  elections: '🗳️ Elections', court_cases: '⚖️ Court Cases',
  entertainment: '🎬 Entertainment', corporate: '🏢 Corporate',
  criminal: '🚨 Criminal', regulatory: '📋 Regulatory',
  legal_reform: '📜 Legal Reform', supreme_court: '🏛️ Supreme Court',
}

async function getMarkets(category?: string): Promise<any[]> {
  try {
    const params = category && category !== 'all' ? `?category=${category}` : ''
    const res = await fetch(`${API_BASE}/api/predictions${params}`, { cache: 'no-store' })
    const data = await res.json()
    return data.markets || []
  } catch { return [] }
}

async function getOracleInsight(marketId: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/predictions/oracle?marketId=${marketId}`, { cache: 'no-store' })
    const data = await res.json()
    const a = data.analyses?.[0]
    if (!a) return '🧠 Oracle unavailable right now. Try again later.'
    return [
      '🧠 *AI Oracle Analysis*',
      `🎯 Probability: ${Math.round(a.ai_probability * 100)}% YES`,
      `📈 Confidence: ${Math.round(a.ai_confidence * 100)}%`,
      `${a.risk_level === 'high' ? '🔴' : a.risk_level === 'low' ? '🟢' : '🟡'} Risk: ${a.risk_level.toUpperCase()}`,
      '',
      `💡 ${a.reasoning}`,
      '',
      a.key_factors?.length ? `🔑 *Key Factors:*\n${a.key_factors.map((f: string) => `• ${f}`).join('\n')}` : '',
      '',
      `📋 *Recommendation:* ${a.recommendation}`,
    ].filter(Boolean).join('\n')
  } catch { return '🧠 Oracle temporarily unavailable.' }
}

async function askOracleQuestion(marketId: string, question: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/predictions/oracle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId, question }),
    })
    const data = await res.json()
    return data.answer || '🧠 Oracle could not answer right now.'
  } catch { return '🧠 Oracle temporarily unavailable.' }
}

async function executeTrade(marketId: string, outcome: string, shares: number): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/predictions/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId, action: 'buy', outcome, shares }),
    })
    const data = await res.json()
    if (data.error) return { success: false, error: data.error }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: 'Network error' }
  }
}

// ============================================================
// MESSAGE PROCESSOR — THE AI AGENT
// ============================================================
async function processWhatsAppMessage(phone: string, text: string, profileName?: string): Promise<string> {
  cleanupSessions()
  const session = getSession(phone, profileName)
  const cmd = text.toLowerCase().trim()
  const greeting = session.name ? ` ${session.name}` : ''

  // ---- GLOBAL COMMANDS (work in any state) ----
  if (['help', 'menu', 'start', 'hi', 'hello'].includes(cmd)) {
    session.state = 'idle'
    return [
      `🎯 *CaseWin Predictions*${greeting ? ` — Welcome${greeting}!` : ''}`,
      '🧠 AI Oracle Powered by Grok 4',
      '',
      '*📊 MARKETS — type a category:*',
      '⚽ sports  |  ₿ crypto  |  💻 tech',
      '🌍 politics  |  🗳️ elections  |  ⚖️ legal',
      '🎬 entertainment  |  🌐 markets (all)',
      '',
      '*💼 ACCOUNT:*',
      '💰 balance — Check wallet',
      '📂 portfolio — Your bets',
      '💳 deposit [amount] — Fund wallet',
      '',
      '*🤖 AI ORACLE:*',
      '🔮 oracle [#] — Analysis on a market',
      '❓ ask [question] — Ask about any market',
      '',
      '💡 Just type a category name to start!',
    ].join('\n')
  }

  if (cmd === 'balance') {
    return `💰 *Your Wallet*\n\n💳 Balance: *₦${session.balance.toLocaleString()}*\n\nType *deposit [amount]* to add funds\nType *markets* to start betting`
  }

  if (cmd.startsWith('deposit')) {
    const amount = parseInt(cmd.replace('deposit', '').trim()) || 0
    if (amount < 100) return '❌ Minimum deposit is ₦100.\n\nExample: *deposit 5000*'
    session.balance += amount
    return `✅ *Deposit Successful!*\n\n💳 Added: ₦${amount.toLocaleString()}\n💰 New Balance: *₦${session.balance.toLocaleString()}*`
  }

  if (cmd === 'portfolio') {
    return '📂 *Your Portfolio*\n\n📭 No active positions yet.\n\n💡 Type *markets* to browse and place your first bet!'
  }

  if (cmd === 'cancel' || (cmd === 'back' && session.state !== 'idle')) {
    if (session.state === 'confirming') {
      session.state = session.selectedMarket ? 'betting' : 'idle'
      return '❌ Bet cancelled.\n\nType *yes/no [amount]* for a new bet or *back* to browse.'
    }
    if (session.state === 'betting') {
      session.state = 'browsing'
      if (session.markets && session.markets.length > 0) {
        return formatMarketList(session.markets, session.category)
      }
    }
    session.state = 'idle'
    return '🏠 Back to main menu. Type *help* for options.'
  }

  // ---- CATEGORY SHORTCUTS ----
  const categoryMap: Record<string, string> = {
    markets: 'all', all: 'all',
    sports: 'sports', sport: 'sports', football: 'sports',
    crypto: 'crypto', bitcoin: 'crypto', btc: 'crypto', eth: 'crypto',
    tech: 'technology', technology: 'technology', ai: 'technology',
    politics: 'world_politics', 'world politics': 'world_politics',
    legal: 'court_cases', court: 'court_cases', cases: 'court_cases',
    elections: 'elections', election: 'elections', vote: 'elections',
    corporate: 'corporate', business: 'corporate',
    criminal: 'criminal', crime: 'criminal',
    entertainment: 'entertainment', movies: 'entertainment',
    regulatory: 'regulatory', regulation: 'regulatory',
    reform: 'legal_reform', supreme: 'supreme_court',
  }

  const matchedCategory = categoryMap[cmd]
  if (matchedCategory) {
    session.state = 'browsing'
    session.category = matchedCategory

    const markets = await getMarkets(matchedCategory)
    session.markets = markets.slice(0, 10)

    if (markets.length === 0) {
      session.state = 'idle'
      return `📭 No open markets in *${CATEGORIES[matchedCategory] || matchedCategory}*.\n\nTry *markets* for all.`
    }

    return formatMarketList(session.markets, matchedCategory)
  }

  // ---- BROWSING STATE: Select a market by number ----
  if (session.state === 'browsing' && session.markets) {
    // Oracle shortcut: "oracle 3"
    if (cmd.startsWith('oracle')) {
      const n = parseInt(cmd.replace('oracle', '').trim())
      if (n >= 1 && n <= session.markets.length) {
        const market = session.markets[n - 1]
        session.selectedMarket = market
        session.state = 'asking_oracle'
        const insight = await getOracleInsight(market.id)
        session.state = 'betting'
        return `${insight}\n\nType *yes [amount]* or *no [amount]* to bet\nType *ask [question]* for more insight\nType *back* to return`
      }
      return `📌 Reply *oracle [1-${session.markets.length}]* for AI analysis.`
    }

    const n = parseInt(cmd)
    if (n >= 1 && n <= session.markets.length) {
      session.selectedMarket = session.markets[n - 1]
      session.state = 'betting'
      return formatMarketDetails(session.selectedMarket)
    }

    return `📌 Reply with a number (*1*-*${session.markets.length}*) to select a market\n🔮 Or *oracle [number]* for AI analysis\n🏠 *back* to main menu`
  }

  // ---- BETTING STATE: yes/no amount ----
  if (session.state === 'betting' && session.selectedMarket) {
    const market = session.selectedMarket

    if (cmd === 'oracle') {
      const insight = await getOracleInsight(market.id)
      return `${insight}\n\nType *yes [amount]* or *no [amount]* to bet`
    }

    if (cmd.startsWith('ask ')) {
      const question = text.substring(4).trim()
      const answer = await askOracleQuestion(market.id, question)
      return `🧠 *Oracle says:*\n\n${answer}\n\nType *yes [amount]* or *no [amount]* to bet`
    }

    if (cmd === 'back') {
      session.state = 'browsing'
      if (session.markets && session.markets.length > 0) {
        return formatMarketList(session.markets, session.category)
      }
      return '🏠 Type a category to browse markets.'
    }

    if (cmd.startsWith('yes') || cmd.startsWith('no')) {
      const outcome = cmd.startsWith('yes') ? 'yes' : 'no'
      const shares = parseInt(cmd.replace(outcome, '').trim()) || 50
      if (shares < 10) return '❌ Minimum bet is 10 shares.\n\nExample: *yes 100*'
      if (shares > 5000) return '❌ Maximum bet is 5,000 shares.\n\nExample: *yes 1000*'

      const price = outcome === 'yes' ? (market.yes_price || 0.5) : (market.no_price || 0.5)
      const cost = shares * price

      if (cost > session.balance) {
        return `❌ *Insufficient Balance*\n\n💰 Cost: ₦${cost.toFixed(2)}\n💳 Balance: ₦${session.balance.toLocaleString()}\n\nType *deposit ${Math.ceil(cost - session.balance + 1000)}* to add funds`
      }

      session.outcome = outcome
      session.shares = shares
      session.state = 'confirming'

      const profit = shares * (1 - price)
      return [
        '🎯 *Confirm Your Bet*',
        '',
        `📊 ${market.title}`,
        `🎲 Position: *${outcome.toUpperCase()}*`,
        `📈 Shares: *${shares}*`,
        `💰 Cost: *₦${cost.toFixed(2)}*`,
        `🏆 Potential Profit: *₦${profit.toFixed(2)}*`,
        '',
        'Type *confirm* to place bet',
        'Type *cancel* to go back',
      ].join('\n')
    }

    return `📊 *${market.title}*\n\nType:\n• *yes [amount]* — bet YES (e.g. _yes 100_)\n• *no [amount]* — bet NO (e.g. _no 200_)\n• *oracle* — AI analysis\n• *ask [question]* — ask the oracle\n• *back* — return to markets`
  }

  // ---- CONFIRMING BET STATE ----
  if (session.state === 'confirming' && session.selectedMarket && session.outcome && session.shares) {
    if (cmd === 'confirm' || cmd === 'y') {
      const market = session.selectedMarket
      const outcome = session.outcome!
      const shares = session.shares!
      const price = outcome === 'yes' ? (market.yes_price || 0.5) : (market.no_price || 0.5)
      const cost = shares * price

      if (cost > session.balance) {
        session.state = 'betting'
        return `❌ Insufficient balance. Need ₦${cost.toFixed(2)}, have ₦${session.balance.toLocaleString()}.\n\nType *deposit ${Math.ceil(cost)}* to add funds.`
      }

      // Execute trade via API
      const result = await executeTrade(market.id, outcome, shares)
      if (!result.success) {
        session.state = 'betting'
        return `❌ Trade failed: ${result.error}\n\nType *yes [amount]* or *no [amount]* to try again.`
      }

      // Deduct from local balance
      session.balance -= cost
      const profit = shares * (1 - price)

      // Reset state
      session.state = 'idle'
      session.selectedMarket = null
      session.outcome = undefined
      session.shares = undefined

      return [
        '✅ *Bet Placed Successfully!*',
        '',
        `📊 ${market.title}`,
        `🎲 Position: *${outcome.toUpperCase()}*`,
        `📈 Shares: *${shares}*`,
        `💰 Cost: *₦${cost.toFixed(2)}*`,
        `🏆 Potential Profit: *₦${profit.toFixed(2)}*`,
        '',
        `💳 Remaining Balance: *₦${session.balance.toLocaleString()}*`,
        '',
        'Type *markets* to bet on more',
        'Type *portfolio* to view your bets',
      ].join('\n')
    }

    if (cmd === 'no' || cmd === 'n' || cmd === 'cancel') {
      session.state = 'betting'
      return '❌ Bet cancelled.\n\nType *yes [amount]* or *no [amount]* for a new bet.'
    }

    return 'Type *confirm* to place the bet or *cancel* to go back.'
  }

  // ---- ASKING ORACLE STATE ----
  if (session.state === 'asking_oracle' && session.selectedMarket) {
    if (cmd.startsWith('ask ')) {
      const question = text.substring(4).trim()
      const answer = await askOracleQuestion(session.selectedMarket.id, question)
      return `🧠 *Oracle:*\n\n${answer}\n\nType *yes [amount]* or *no [amount]* to bet\nType *back* to return`
    }
    session.state = 'betting'
    return await processWhatsAppMessage(phone, text, profileName)
  }

  // ---- LEGACY LEGAL COMMANDS ----
  if (cmd.startsWith('draft')) {
    const details = text.substring(5).trim()
    if (!details) return '❌ Provide document details.\n\nExample: *draft Land Sale Agreement between John Doe and Jane Smith*'
    try {
      const res = await fetch(`${API_BASE}/api/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: 'Contract', parties: details, jurisdiction: 'Nigeria' }),
      })
      const data = await res.json()
      if (data.success) {
        const preview = (data.document || '').substring(0, 1500)
        return `✅ *Document Draft Generated*\n\n${preview}...\n\n💰 Cost: ₦500`
      }
    } catch {}
    return '❌ Failed to generate document. Please try again.'
  }

  if (cmd.startsWith('research')) {
    const query = text.substring(8).trim()
    if (!query) return '❌ Provide a legal question.\n\nExample: *research What is the penalty for land trespass in Nigeria?*'
    try {
      const res = await fetch(`${API_BASE}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (data.result) return `🔍 *Legal Research*\n\n${data.result.substring(0, 2000)}`
    } catch {}
    return `🔍 Visit https://casewin.ng for full AI-powered research.`
  }

  if (cmd === 'lawyer' || cmd === 'lawyers') {
    return '👨‍⚖️ *Find Nigerian Lawyers*\n\n📍 Browse verified lawyers at:\n🌐 https://casewin.ng/marketplace\n\n💡 Coming soon: Book lawyers via WhatsApp!'
  }

  // ---- DEFAULT ----
  return `👋 Welcome to *CaseWin Predictions*${greeting}!\n\n🎯 Bet on outcomes with AI oracle insights\n🧠 Powered by Grok 4\n\nQuick start:\n• *markets* — Browse all markets\n• *sports* — Sports predictions\n• *crypto* — Crypto markets\n• *tech* — Tech predictions\n• *help* — Full menu`
}

// ============================================================
// FORMATTING HELPERS
// ============================================================
function formatMarketList(markets: any[], category?: string): string {
  const catLabel = CATEGORIES[category || 'all'] || '📊'
  const list = markets.map((m, i) => {
    const yes = Math.round((m.yes_price || 0.5) * 100)
    const no = Math.round((m.no_price || 0.5) * 100)
    const pool = m.total_pool >= 1000 ? `₦${(m.total_pool / 1000).toFixed(0)}K` : `₦${m.total_pool || 0}`
    return `*${i + 1}.* ${m.title}\n   ✅${yes}¢ | ❌${no}¢ | 💰${pool}`
  }).join('\n\n')

  return `${catLabel} *Markets*\n\n${list}\n\n📌 Reply with a *number* to bet\n🔮 *oracle [number]* for AI insight`
}

function formatMarketDetails(market: any): string {
  const yes = Math.round((market.yes_price || 0.5) * 100)
  const no = Math.round((market.no_price || 0.5) * 100)
  const pool = market.total_pool >= 1000 ? `₦${(market.total_pool / 1000).toFixed(0)}K` : `₦${market.total_pool || 0}`
  const deadline = market.deadline
    ? new Date(market.deadline).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'TBD'

  return [
    `📊 *${market.title}*`,
    market.description ? `\n${market.description}` : '',
    '',
    `📅 Closes: ${deadline}  |  💰 Pool: ${pool}`,
    `✅ YES: *${yes}¢*  |  ❌ NO: *${no}¢*`,
    '',
    '*How to bet:*',
    '• *yes [amount]* — e.g. _yes 100_',
    '• *no [amount]* — e.g. _no 200_',
    '• *oracle* — Get AI analysis',
    '• *ask [question]* — Ask the oracle',
    '• *back* — Return to markets',
  ].filter(Boolean).join('\n')
}
