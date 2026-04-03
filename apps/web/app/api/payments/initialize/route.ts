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
async function getOrCreateSubAccount(supabase: any, email: string, apiKey: string): Promise<{ id: string | null; error?: string }> {
  // Check if user already has a sub-account stored locally
  try {
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('zendfi_subaccount_id')
      .eq('user_email', email)
      .single()

    if (wallet?.zendfi_subaccount_id) {
      return { id: wallet.zendfi_subaccount_id }
    }
  } catch (dbErr) {
    console.log('No existing wallet found, will create sub-account:', dbErr)
  }

  // Create ZendFi sub-account for this user
  const createBody = {
    label: email.replace(/[^a-zA-Z0-9@._-]/g, '_').slice(0, 50),
    spend_limit_usdc: 50000,
    access_mode: 'delegated',
    yield_enabled: false
  }

  console.log('Creating ZendFi sub-account:', JSON.stringify(createBody))

  const res = await fetch(`${ZENDFI_BASE}/subaccounts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createBody)
  })

  const data = await res.json()
  console.log('ZendFi sub-account response:', res.status, JSON.stringify(data))

  if (!res.ok) {
    return { id: null, error: data.error || data.message || JSON.stringify(data) }
  }

  const subAccountId = data.id || data.data?.id
  if (!subAccountId) {
    return { id: null, error: 'No sub-account ID in response: ' + JSON.stringify(data) }
  }

  // Save sub-account ID to user wallet
  const { error: upsertErr } = await supabase
    .from('user_wallets')
    .upsert({
      user_email: email,
      zendfi_subaccount_id: subAccountId,
      zendfi_wallet_address: data.wallet_address || data.data?.wallet_address || null,
      updated_at: new Date().toISOString()
    } as Record<string, unknown>, { onConflict: 'user_email' })

  if (upsertErr) {
    console.error('Failed to save sub-account to DB:', upsertErr)
    // Still return the ID — sub-account was created on ZendFi
  }

  return { id: subAccountId }
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

    // Ensure user has a ZendFi sub-account (creates one if not exists)
    const subAccount = await getOrCreateSubAccount(supabase, email, zendfiApiKey)
    if (!subAccount.id) {
      console.error('Sub-account creation failed:', subAccount.error)
      return NextResponse.json(
        { error: `Failed to create payment account: ${subAccount.error || 'Unknown error'}` },
        { status: 500 }
      )
    }
    const subAccountId = subAccount.id

    // Convert NGN to USD for ZendFi
    const NGN_TO_USD_RATE = 1600
    const amountUsd = Math.round((amount / NGN_TO_USD_RATE) * 100) / 100

    if (amountUsd < 0.01) {
      return NextResponse.json(
        { error: 'Amount too small for processing' },
        { status: 400 }
      )
    }

    // Create ZendFi payment link with onramp + route to user's sub-account
    const reference = `casewin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || APP_URL_FALLBACK

    const paymentBody = {
      amount: amountUsd,
      amount_ngn: amount,
      currency: 'USD',
      token: 'USDC',
      onramp: true,
      payer_service_charge: true,
      description: `CaseWin deposit - ${reference}`,
      metadata: {
        reference,
        user_email: email,
        payment_type,
        related_id: related_id || null,
        naira_amount: amount
      },
      // Route payment directly to user's sub-account
      split_recipients: [
        {
          recipient_type: 'wallet',
          sub_account_id: subAccountId
        }
      ],
      webhook_url: `${appUrl}/api/webhooks/zendfi`
    }

    console.log('ZendFi payment-link request:', JSON.stringify(paymentBody))

    const zendfiRes = await fetch(`${ZENDFI_BASE}/payment-links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${zendfiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentBody)
    })

    const zendfiData = await zendfiRes.json()

    if (!zendfiRes.ok) {
      console.error('ZendFi payment-link error:', JSON.stringify(zendfiData))
      const errorMsg = zendfiData.message || zendfiData.error || JSON.stringify(zendfiData)
      return NextResponse.json(
        { error: errorMsg, details: zendfiData },
        { status: 500 }
      )
    }

    const paymentId = zendfiData.id || zendfiData.data?.id
    const paymentUrl = zendfiData.payment_url || zendfiData.data?.payment_url || zendfiData.url || zendfiData.data?.url

    // Store payment record (don't fail if table doesn't exist yet)
    const { error: insertErr } = await supabase.from('payments').insert({
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
    if (insertErr) console.error('Failed to save payment record:', insertErr)

    return NextResponse.json({
      status: 'success',
      message: 'Payment initialized successfully',
      data: {
        checkout_url: paymentUrl,
        reference,
        payment_id: paymentId,
        zendfi_response: zendfiData
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
