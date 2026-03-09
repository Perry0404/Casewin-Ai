import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// WhatsApp Cloud API config
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'casewin-predictions-2026'
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || ''

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://casewin.ng'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ============================================================
// WEBHOOK VERIFICATION (GET) - Meta sends this to verify
// ============================================================
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ============================================================
// INCOMING MESSAGES (POST) - Meta sends messages here
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Extract message data from WhatsApp Cloud API payload
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'no messages' })
    }

    const message = messages[0]
    const from = message.from // sender's phone number
    const text = message.text?.body || ''

    if (!text.trim()) {
      return NextResponse.json({ status: 'empty message' })
    }

    console.log(`📨 WhatsApp Cloud: ${from}: ${text}`)

    // Process message and get response
    const response = await processWhatsAppMessage(from, text)

    // Send reply via WhatsApp Cloud API
    if (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID) {
      await sendWhatsAppMessage(from, response)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ status: 'error' }, { status: 200 }) // Always return 200 to Meta
  }
}

// ============================================================
// SEND MESSAGE VIA CLOUD API
// ============================================================
async function sendWhatsAppMessage(to: string, text: string) {
  try {
    await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    })
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
  }
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================
interface Session {
  state: 'idle' | 'browsing' | 'betting' | 'confirming'
  category?: string
  markets?: any[]
  selectedMarket?: any
  outcome?: 'yes' | 'no'
  shares?: number
}

const sessions = new Map<string, Session>()

function getSession(phone: string): Session {
  if (!sessions.has(phone)) {
    sessions.set(phone, { state: 'idle' })
  }
  return sessions.get(phone)!
}

// ============================================================
// MARKET HELPERS
// ============================================================
const CATEGORIES: Record<string, string> = {
  all: '🌐 All', sports: '⚽ Sports', crypto: '₿ Crypto',
  technology: '💻 Tech', world_politics: '🌍 Politics',
  elections: '🗳️ Elections', court_cases: '⚖️ Court Cases',
  entertainment: '🎬 Entertainment', corporate: '🏢 Corporate',
}

async function getMarkets(category?: string): Promise<any[]> {
  try {
    const params = category && category !== 'all' ? `?category=${category}` : ''
    const res = await fetch(`${API_BASE}/api/predictions${params}`)
    const data = await res.json()
    return data.markets || []
  } catch { return [] }
}

async function getOracleInsight(marketId: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/predictions/oracle?marketId=${marketId}`)
    const data = await res.json()
    const a = data.analyses?.[0]
    if (!a) return 'Oracle unavailable right now.'
    return `🧠 *AI Oracle*\n🎯 ${Math.round(a.ai_probability * 100)}% YES (${Math.round(a.ai_confidence * 100)}% confident)\n${a.risk_level === 'high' ? '🔴' : a.risk_level === 'low' ? '🟢' : '🟡'} Risk: ${a.risk_level}\n💡 ${a.reasoning}\n📋 ${a.recommendation}`
  } catch { return 'Oracle temporarily unavailable.' }
}

// ============================================================
// MESSAGE PROCESSOR
// ============================================================
async function processWhatsAppMessage(phone: string, text: string): Promise<string> {
  const session = getSession(phone)
  const cmd = text.toLowerCase().trim()

  // Global commands
  if (['help', 'menu', 'start', 'hi', 'hello'].includes(cmd)) {
    session.state = 'idle'
    return `🎯 *CaseWin Predictions*\n🧠 AI Oracle by Grok 4\n\n*Type a category:*\n⚽ sports\n₿ crypto\n💻 tech\n🌍 politics\n🗳️ elections\n⚖️ legal\n🌐 markets (all)\n\n*Or:*\n💰 balance\n❓ help`
  }

  if (cmd === 'balance') return `💰 Balance: ₦50,000\n\nType *markets* to start betting`

  // Category routing
  const catMap: Record<string, string> = {
    markets: 'all', all: 'all', sports: 'sports', crypto: 'crypto',
    tech: 'technology', technology: 'technology', politics: 'world_politics',
    legal: 'court_cases', elections: 'elections', entertainment: 'entertainment',
    corporate: 'corporate',
  }

  if (catMap[cmd]) {
    const cat = catMap[cmd]
    const markets = await getMarkets(cat)
    session.markets = markets.slice(0, 8)
    session.category = cat
    session.state = 'browsing'

    if (markets.length === 0) return `📭 No open ${CATEGORIES[cat] || cat} markets.\n\nTry *markets* for all.`

    const list = session.markets.map((m, i) => {
      const yes = Math.round((m.yes_price || 0.5) * 100)
      const no = Math.round((m.no_price || 0.5) * 100)
      return `*${i + 1}.* ${m.title}\n   ✅${yes}¢ | ❌${no}¢`
    }).join('\n\n')

    return `${CATEGORIES[cat] || '📊'} *Markets*\n\n${list}\n\n📌 Reply with a *number* to bet\n🔮 *oracle [number]* for AI insight`
  }

  // Browsing: select market
  if (session.state === 'browsing' && session.markets) {
    if (cmd.startsWith('oracle')) {
      const n = parseInt(cmd.replace('oracle', '').trim())
      if (n >= 1 && n <= session.markets.length) {
        return await getOracleInsight(session.markets[n - 1].id)
      }
    }

    const n = parseInt(cmd)
    if (n >= 1 && n <= session.markets.length) {
      session.selectedMarket = session.markets[n - 1]
      session.state = 'betting'
      const m = session.selectedMarket
      const yes = Math.round((m.yes_price || 0.5) * 100)
      const no = Math.round((m.no_price || 0.5) * 100)
      return `📊 *${m.title}*\n\n✅ YES: ${yes}¢ | ❌ NO: ${no}¢\n\nType:\n• *yes 100* — bet 100 shares YES\n• *no 200* — bet 200 shares NO\n• *oracle* — AI analysis\n• *back* — return`
    }
  }

  // Betting: yes/no amount
  if (session.state === 'betting' && session.selectedMarket) {
    if (cmd === 'oracle') return await getOracleInsight(session.selectedMarket.id)
    if (cmd === 'back') { session.state = 'browsing'; return 'Type a number to select a market.' }

    if (cmd.startsWith('yes') || cmd.startsWith('no')) {
      const outcome = cmd.startsWith('yes') ? 'yes' : 'no'
      const shares = parseInt(cmd.replace(outcome, '').trim()) || 50
      const price = outcome === 'yes' ? session.selectedMarket.yes_price : session.selectedMarket.no_price
      const cost = (shares * price).toFixed(2)
      const profit = (shares * (1 - price)).toFixed(2)

      session.outcome = outcome
      session.shares = shares
      session.state = 'confirming'

      return `🎯 *Confirm Bet*\n\n📊 ${session.selectedMarket.title}\n🎲 ${outcome.toUpperCase()} × ${shares} shares\n💰 Cost: ₦${cost}\n🏆 Potential: ₦${profit}\n\nType *confirm* or *cancel*`
    }
  }

  // Confirming
  if (session.state === 'confirming' && session.selectedMarket) {
    if (cmd === 'confirm' || cmd === 'y') {
      session.state = 'idle'
      const m = session.selectedMarket
      const outcome = session.outcome!
      const shares = session.shares!
      const price = outcome === 'yes' ? m.yes_price : m.no_price
      return `✅ *Bet Placed!*\n\n📊 ${m.title}\n🎲 ${outcome.toUpperCase()} × ${shares}\n💰 Cost: ₦${(shares * price).toFixed(2)}\n\nType *markets* to bet more`
    }
    if (cmd === 'cancel' || cmd === 'n') {
      session.state = 'betting'
      return '❌ Cancelled. Type *yes/no [amount]* for a new bet.'
    }
  }

  return `👋 *CaseWin Predictions*\n\nType *help* to get started\nor just type: *sports*, *crypto*, *tech*`
}
