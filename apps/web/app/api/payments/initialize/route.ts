import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const ZENDFI_BASE = 'https://api.zendfi.tech/api/v1'

async function getAuthUser(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { response.cookies.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { response.cookies.set({ name, value: '', ...options }) },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Ensure user has a ZendFi sub-account (one per user, like Bayse Markets)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreateSubAccount(supabase: any, email: string, apiKey: string) {
  // Check if user already has a sub-account
  const { data: wallet } = await supabase
    .from('user_wallets')
    .select('zendfi_subaccount_id')
    .eq('user_email', email)
    .single() as { data: Record<string, string> | null }

  if (wallet?.zendfi_subaccount_id) return wallet.zendfi_subaccount_id

  // Create ZendFi sub-account for this user
  const res = await fetch(`${ZENDFI_BASE}/subaccounts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      label: email,
      spend_limit_usdc: 50000,
      access_mode: 'full'
    })
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('ZendFi sub-account creation failed:', data)
    return null
  }

  const subAccountId = data.id || data.data?.id

  // Save sub-account ID to user wallet
  await supabase
    .from('user_wallets')
    .upsert({
      user_email: email,
      zendfi_subaccount_id: subAccountId,
      zendfi_wallet_address: data.wallet_address || data.data?.wallet_address || null,
      updated_at: new Date().toISOString()
    } as any, { onConflict: 'user_email' })

  return subAccountId
}

// Server-side fallback: Vercel env vars for ZENDFI are not being injected
// despite being configured in the dashboard. This is a temporary workaround
// until the Vercel env var issue is resolved. These values ONLY run server-side.
const ZENDFI_KEY_FALLBACK = 'zfi_live_5uRZX6VuCMDNq3ZYEZMyen5YwypToRY7chR7fRHuVtQJ'
const APP_URL_FALLBACK = 'https://casewinai.com'

// POST /api/payments/initialize - Create ZendFi payment link
export async function POST(request: NextRequest) {
  try {
    // Read env vars at runtime, with fallbacks for Vercel env injection issue
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const zendfiApiKey = process.env.ZENDFI_API_KEY || ZENDFI_KEY_FALLBACK

    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, payment_type, related_id, callback_url } = body
    const email = authUser.email

    if (!email || !amount || !payment_type) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, payment_type' },
        { status: 400 }
      )
    }

    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum payment amount is ₦100' },
        { status: 400 }
      )
    }

    if (!zendfiApiKey) {
      console.error('ZENDFI_API_KEY not found. Available env keys:', Object.keys(process.env).filter(k => k.includes('ZEND') || k.includes('SUPABASE')))
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 503 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Convert NGN to USD for ZendFi (ZendFi only supports USD/EUR/GBP)
    const NGN_TO_USD_RATE = 1600 // approximate NGN/USD rate
    const amountUsd = Math.round((amount / NGN_TO_USD_RATE) * 100) / 100 // round to 2 decimal places
    
    if (amountUsd < 0.01) {
      return NextResponse.json(
        { error: 'Amount too small for processing' },
        { status: 400 }
      )
    }

    // Create ZendFi payment
    const reference = `casewin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || APP_URL_FALLBACK
    const redirectUrl = callback_url || `${appUrl}/predictions`

    const paymentBody = {
      amount: amountUsd,
      currency: 'USD',
      token: 'USDC',
      description: `CaseWin deposit - ${'\u20A6'}${amount.toLocaleString()} (${reference})`,
      metadata: {
        reference,
        user_email: email,
        payment_type,
        related_id: related_id || null,
        naira_amount: amount
      },
      webhook_url: `${appUrl}/api/webhooks/zendfi`
    }

    console.log('ZendFi request:', JSON.stringify({ url: `${ZENDFI_BASE}/payments`, body: paymentBody }))

    const zendfiRes = await fetch(`${ZENDFI_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${zendfiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentBody)
    })

    const zendfiData = await zendfiRes.json()

    if (!zendfiRes.ok) {
      console.error('ZendFi payment error:', JSON.stringify(zendfiData))
      const errorMsg = zendfiData.message || zendfiData.error || JSON.stringify(zendfiData)
      return NextResponse.json(
        { error: errorMsg, details: zendfiData },
        { status: 500 }
      )
    }

    const paymentId = zendfiData.id || zendfiData.data?.id
    const paymentUrl = zendfiData.payment_url || zendfiData.data?.payment_url

    // Store payment record
    await supabase.from('payments').insert({
      reference,
      user_email: email,
      amount,
      currency: 'NGN',
      payment_type,
      related_id,
      status: 'pending',
      provider: 'zendfi',
      provider_payment_id: paymentId,
      paystack_data: zendfiData
    })

    return NextResponse.json({
      status: 'success',
      message: 'Payment initialized successfully',
      data: {
        checkout_url: paymentUrl,
        reference,
        payment_id: paymentId
      }
    })
  } catch (error) {
    console.error('Error initializing payment:', error)
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}
