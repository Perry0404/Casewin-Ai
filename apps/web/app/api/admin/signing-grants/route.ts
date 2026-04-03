import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ZENDFI_BASE = 'https://api.zendfi.tech/api/v1'
const ZENDFI_KEY_FALLBACK = 'zfi_live_5uRZX6VuCMDNq3ZYEZMyen5YwypToRY7chR7fRHuVtQJ'
const ADMIN_EMAILS = ['peaborleon@gmail.com'] // Add your admin email(s)

function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// GET /api/admin/signing-grants - List pending signing grant intents
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Simple auth check via query param (admin only)
  const adminKey = request.nextUrl.searchParams.get('key')
  if (adminKey !== 'casewin-admin-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all pending intents
  const { data: intents } = await supabase
    .from('signing_grant_intents')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json({ intents: intents || [] })
}

// POST /api/admin/signing-grants - Poll pending intents and store approved grants
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const zendfiApiKey = process.env.ZENDFI_API_KEY || ZENDFI_KEY_FALLBACK
  const supabase = createClient(supabaseUrl, supabaseKey)

  const body = await request.json()
  const { action, admin_key } = body

  if (admin_key !== 'casewin-admin-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Action: poll - Check all pending intents for approval
  if (action === 'poll') {
    const { data: pendingIntents } = await supabase
      .from('signing_grant_intents')
      .select('*')
      .eq('status', 'pending')

    if (!pendingIntents || pendingIntents.length === 0) {
      return NextResponse.json({ message: 'No pending intents', approved: 0 })
    }

    let approved = 0
    for (const intent of pendingIntents) {
      try {
        const pollRes = await fetch(`${ZENDFI_BASE}/subaccounts/signing-grants/browser-intents/poll`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${zendfiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            intent_id: intent.intent_id,
            intent_token: intent.intent_token
          })
        })

        const pollText = await pollRes.text()
        if (!pollRes.ok) continue

        const pollData = JSON.parse(pollText)

        if (pollData.status === 'approved' && pollData.grant?.signing_grant) {
          // Store the signing grant in user_wallets
          await supabase.from('user_wallets').update({
            zendfi_signing_grant: pollData.grant.signing_grant,
            updated_at: new Date().toISOString()
          }).eq('user_email', intent.user_email)

          // Mark intent as approved
          await supabase.from('signing_grant_intents').update({
            status: 'approved',
            grant_id: pollData.grant.grant_id,
            approved_at: new Date().toISOString()
          }).eq('intent_id', intent.intent_id)

          approved++
          console.log(`Signing grant approved for ${intent.user_email}`)
        }
      } catch (err) {
        console.error(`Error polling intent ${intent.intent_id}:`, err)
      }
    }

    return NextResponse.json({ message: `Polled ${pendingIntents.length} intents`, approved })
  }

  // Action: start - Manually start a signing grant intent for a user
  if (action === 'start') {
    const { user_email } = body

    // Get user's sub-account
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('zendfi_subaccount_id')
      .eq('user_email', user_email)
      .single()

    if (!wallet?.zendfi_subaccount_id) {
      return NextResponse.json({ error: 'User has no sub-account' }, { status: 400 })
    }

    const intentRes = await fetch(`${ZENDFI_BASE}/subaccounts/signing-grants/browser-intents/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${zendfiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sub_account_id: wallet.zendfi_subaccount_id,
        ttl_seconds: 31536000,
        max_uses: 10000,
        total_limit_usdc: 50000,
        per_tx_limit_usdc: 5000,
        mode: 'live'
      })
    })

    const intentText = await intentRes.text()
    console.log('Signing grant intent:', intentRes.status, intentText)

    if (!intentRes.ok) {
      return NextResponse.json({ error: `ZendFi error: ${intentText.substring(0, 200)}` }, { status: 500 })
    }

    const intentData = JSON.parse(intentText)

    await supabase.from('signing_grant_intents').insert({
      user_email,
      subaccount_id: wallet.zendfi_subaccount_id,
      intent_id: intentData.intent_id,
      intent_token: intentData.intent_token,
      approval_url: intentData.approval_url,
      status: 'pending',
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      approval_url: intentData.approval_url,
      intent_id: intentData.intent_id,
      message: `Open approval URL in browser to approve withdrawal access for ${user_email}`
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
