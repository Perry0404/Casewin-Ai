import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const zendfiApiKey = process.env.ZENDFI_API_KEY || ''
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
async function getOrCreateSubAccount(supabase: any, email: string) {
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
      'Authorization': `Bearer ${zendfiApiKey}`,
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

// POST /api/payments/initialize - Create ZendFi payment link (Bayse Markets style)
export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 503 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Ensure user has a sub-account
    await getOrCreateSubAccount(supabase, email)

    // Create ZendFi payment — generates payment link with virtual account
    const reference = `casewin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const redirectUrl = callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/predictions`

    const zendfiRes = await fetch(`${ZENDFI_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${zendfiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency: 'NGN',
        token: 'USDC',
        description: `CaseWin deposit - ${reference}`,
        metadata: {
          reference,
          user_email: email,
          payment_type,
          related_id: related_id || null
        },
        redirect_url: redirectUrl,
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/zendfi`
      })
    })

    const zendfiData = await zendfiRes.json()

    if (!zendfiRes.ok) {
      console.error('ZendFi payment error:', zendfiData)
      return NextResponse.json(
        { error: zendfiData.message || 'Failed to initialize payment' },
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
