import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const ZENDFI_BASE = 'https://api.zendfi.tech/api/v1'
const ZENDFI_KEY_FALLBACK = 'zfi_live_5uRZX6VuCMDNq3ZYEZMyen5YwypToRY7chR7fRHuVtQJ'

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

// POST /api/payments/sync - Check ZendFi for confirmed payments and credit wallet
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const zendfiApiKey = process.env.ZENDFI_API_KEY || ZENDFI_KEY_FALLBACK

    const authUser = await getAuthUser(request)
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = authUser.email
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all pending payments for this user
    const { data: pendingPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('user_email', email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!pendingPayments || pendingPayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending payments found',
        credited: 0
      })
    }

    let totalCredited = 0

    for (const payment of pendingPayments) {
      if (!payment.provider_payment_id) continue

      try {
        // Check payment status with ZendFi
        const zendfiRes = await fetch(`${ZENDFI_BASE}/payment-links/${payment.provider_payment_id}`, {
          headers: {
            'Authorization': `Bearer ${zendfiApiKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (!zendfiRes.ok) {
          // Also try /payments endpoint
          const zendfiRes2 = await fetch(`${ZENDFI_BASE}/payments/${payment.provider_payment_id}`, {
            headers: {
              'Authorization': `Bearer ${zendfiApiKey}`,
              'Content-Type': 'application/json'
            }
          })
          if (!zendfiRes2.ok) continue
          const data2 = await zendfiRes2.json()
          const status2 = data2.status || data2.data?.status
          if (status2 !== 'confirmed' && status2 !== 'completed' && status2 !== 'paid') continue

          // Credit from /payments endpoint
          await creditWallet(supabase, email, payment, data2)
          totalCredited += payment.amount
          continue
        }

        const zendfiData = await zendfiRes.json()
        const paymentStatus = zendfiData.status || zendfiData.data?.status

        if (paymentStatus === 'confirmed' || paymentStatus === 'completed' || paymentStatus === 'paid') {
          await creditWallet(supabase, email, payment, zendfiData)
          totalCredited += payment.amount
        }
      } catch (err) {
        console.error(`Error checking payment ${payment.reference}:`, err)
      }
    }

    // Refresh wallet
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('naira_balance')
      .eq('user_email', email)
      .single()

    return NextResponse.json({
      success: true,
      credited: totalCredited,
      balance: wallet?.naira_balance || 0,
      message: totalCredited > 0
        ? `Credited \u20A6${totalCredited.toLocaleString()} to your wallet!`
        : 'No new confirmed payments found. Payment may still be processing.'
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Failed to sync payments' }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function creditWallet(supabase: any, email: string, payment: any, zendfiData: any) {
  const amount = payment.amount

  // Update payment to success
  await supabase
    .from('payments')
    .update({
      status: 'success',
      paid_at: new Date().toISOString(),
      paystack_data: zendfiData
    })
    .eq('reference', payment.reference)

  // Credit wallet
  const { data: wallet } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_email', email)
    .single()

  if (!wallet) {
    await supabase.from('user_wallets').insert({
      user_email: email,
      naira_balance: amount,
      total_deposits: amount
    })
  } else {
    await supabase
      .from('user_wallets')
      .update({
        naira_balance: (wallet.naira_balance || 0) + amount,
        total_deposits: (wallet.total_deposits || 0) + amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_email', email)
  }

  // Record transaction
  const newBalance = (wallet?.naira_balance || 0) + amount
  await supabase.from('wallet_transactions').insert({
    user_email: email,
    amount,
    transaction_type: 'deposit',
    related_id: payment.provider_payment_id,
    balance_after: newBalance,
    notes: `ZendFi deposit synced - ${payment.reference}`
  }) // Don't fail if wallet_transactions table doesn't exist
}
