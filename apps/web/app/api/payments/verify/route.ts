import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ZENDFI_BASE = 'https://api.zendfi.tech/api/v1'
const ZENDFI_KEY_FALLBACK = 'zfi_live_5uRZX6VuCMDNq3ZYEZMyen5YwypToRY7chR7fRHuVtQJ'

// GET /api/payments/verify?reference=xxx - Verify payment status with ZendFi
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const zendfiApiKey = process.env.ZENDFI_API_KEY || ZENDFI_KEY_FALLBACK

    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Look up the payment in our database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('reference', reference)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // If already confirmed via webhook, just return status
    if (payment.status === 'success') {
      return NextResponse.json({
        status: 'success',
        message: 'Payment verified successfully',
        data: { status: 'success', amount: payment.amount, reference }
      })
    }

    // If there's a ZendFi payment ID, check status with ZendFi API
    if (zendfiApiKey && payment.provider_payment_id) {
      const zendfiRes = await fetch(`${ZENDFI_BASE}/payments/${payment.provider_payment_id}`, {
        headers: {
          'Authorization': `Bearer ${zendfiApiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (zendfiRes.ok) {
        const zendfiData = await zendfiRes.json()
        const paymentStatus = zendfiData.status || zendfiData.data?.status

        if (paymentStatus === 'confirmed' || paymentStatus === 'completed') {
          // Payment confirmed via polling — credit wallet if not yet done
          if (payment.status !== 'success') {
            const userEmail = payment.user_email
            const amount = payment.amount

            // Update payment status
            await supabase
              .from('payments')
              .update({
                status: 'success',
                paid_at: new Date().toISOString(),
                paystack_data: zendfiData
              })
              .eq('reference', reference)

            // Credit wallet
            const { data: wallet } = await supabase
              .from('user_wallets')
              .select('*')
              .eq('user_email', userEmail)
              .single()

            if (!wallet) {
              await supabase.from('user_wallets').insert({
                user_email: userEmail,
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
                .eq('user_email', userEmail)
            }

            const newBalance = (wallet?.naira_balance || 0) + amount
            await supabase.from('wallet_transactions').insert({
              user_email: userEmail,
              amount,
              transaction_type: 'deposit',
              related_id: payment.provider_payment_id,
              balance_after: newBalance,
              notes: `ZendFi deposit verified - ${reference}`
            })

            await supabase.from('notifications').insert({
              user_email: userEmail,
              type: 'deposit',
              title: 'Deposit Successful!',
              message: `₦${amount.toLocaleString()} has been added to your wallet.`,
              read: false,
            })
          }

          return NextResponse.json({
            status: 'success',
            message: 'Payment verified successfully',
            data: { status: 'success', amount: payment.amount, reference }
          })
        }

        if (paymentStatus === 'failed') {
          await supabase.from('payments').update({ status: 'failed' }).eq('reference', reference)
          return NextResponse.json({
            status: 'failed',
            message: 'Payment failed',
            data: { status: 'failed', reference }
          })
        }
      }
    }

    // Payment still pending
    return NextResponse.json({
      status: 'pending',
      message: 'Payment is still pending',
      data: { status: payment.status, amount: payment.amount, reference }
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
