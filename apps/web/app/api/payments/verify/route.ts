import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const korapaySecretKey = process.env.KORAPAY_SECRET_KEY || ''

// GET /api/payments/verify?reference=xxx - Verify payment status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get('reference')
    const isMock = searchParams.get('mock') === 'true'

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    // Handle mock payments
    if (isMock || !korapaySecretKey) {
      return NextResponse.json({
        status: 'success',
        message: 'Mock payment verified successfully',
        data: {
          reference,
          amount: 1000000, // ₦10,000 in kobo
          status: 'success',
          paid_at: new Date().toISOString(),
          customer: {
            email: 'student@example.com'
          },
          metadata: {
            payment_type: 'booking'
          }
        },
        mock: true
      })
    }

    // Verify payment with Korapay
    const korapayResponse = await fetch(
      `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${korapaySecretKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const korapayData = await korapayResponse.json()

    if (!korapayResponse.ok || !korapayData.status) {
      console.error('Korapay verification error:', korapayData)
      return NextResponse.json(
        { error: korapayData.message || 'Payment verification failed' },
        { status: 500 }
      )
    }

    const transactionData = korapayData.data

    // Update payment record in database
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Update payment status
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: transactionData.status,
          paid_at: transactionData.paid_at,
          paystack_data: transactionData
        })
        .eq('reference', reference)

      if (updateError) {
        console.error('Error updating payment:', updateError)
      }

      // If payment successful, update wallet
      if (transactionData.status === 'success') {
        const userEmail = transactionData.customer.email
        const amountInKobo = transactionData.amount

        // Get or create wallet
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_email', userEmail)
          .single()

        if (!wallet) {
          // Create new wallet
          await supabase.from('user_wallets').insert({
            user_email: userEmail,
            lawcoins_balance: 5000, // Initial bonus
            naira_balance: amountInKobo,
            total_deposits: amountInKobo
          })
        } else {
          // Update existing wallet
          await supabase
            .from('user_wallets')
            .update({
              naira_balance: wallet.naira_balance + amountInKobo,
              total_deposits: wallet.total_deposits + amountInKobo,
              updated_at: new Date().toISOString()
            })
            .eq('user_email', userEmail)
        }

        // Record transaction
        const newBalance = (wallet?.naira_balance || 0) + amountInKobo
        await supabase.from('wallet_transactions').insert({
          user_email: userEmail,
          amount: amountInKobo,
          transaction_type: 'deposit',
          related_id: transactionData.id,
          balance_after: newBalance,
          notes: `Korapay deposit - ${reference}`
        })

        // Store notification for the user to pick up client-side
        const { error: notifError } = await supabase.from('notifications').insert({
          user_email: userEmail,
          type: 'deposit',
          title: 'Deposit Successful!',
          message: `₦${(amountInKobo / 100).toLocaleString()} has been added to your wallet. Ref: ${reference}`,
          read: false,
        })
        if (notifError) {
          // notifications table may not exist yet — non-critical
          console.warn('Notification insert failed:', notifError.message)
        }

        // If payment is for booking, update booking status
        const paymentType = transactionData.metadata?.payment_type
        const relatedId = transactionData.metadata?.related_id

        if (paymentType === 'booking' && relatedId) {
          await supabase
            .from('bookings')
            .update({
              status: 'confirmed',
              total_amount: amountInKobo / 100, // Store in naira
              updated_at: new Date().toISOString()
            })
            .eq('id', relatedId)
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Payment verified successfully',
      data: transactionData
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
