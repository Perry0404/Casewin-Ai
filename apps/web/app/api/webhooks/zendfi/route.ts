import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) return false
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expected = hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

// POST /api/webhooks/zendfi - Handle ZendFi webhook events
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const webhookSecret = process.env.ZENDFI_WEBHOOK_SECRET || ''

    const rawBody = await request.text()
    const signature = request.headers.get('x-zendfi-signature') || ''

    // Verify webhook signature
    if (webhookSecret && signature) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error('ZendFi webhook signature verification failed')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(rawBody)
    const eventType = event.type || event.event
    const paymentData = event.data || event.payment || event

    console.log('ZendFi webhook received:', eventType, paymentData?.id)

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ received: true })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Handle payment confirmation (deposit confirmed)
    if (eventType === 'payment.confirmed' || eventType === 'PaymentConfirmed') {
      const metadata = paymentData.metadata || {}
      const reference = metadata.reference
      const userEmail = metadata.user_email
      const amount = paymentData.amount || metadata.amount

      if (!userEmail || !amount) {
        console.error('ZendFi webhook: missing user_email or amount in metadata')
        return NextResponse.json({ received: true })
      }

      // Update payment record
      if (reference) {
        await supabase
          .from('payments')
          .update({
            status: 'success',
            paid_at: new Date().toISOString(),
            paystack_data: paymentData
          })
          .eq('reference', reference)
      }

      // Credit user wallet (amount is in Naira)
      const depositAmount = Math.round(Number(amount))

      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_email', userEmail)
        .single()

      if (!wallet) {
        await supabase.from('user_wallets').insert({
          user_email: userEmail,
          naira_balance: depositAmount,
          total_deposits: depositAmount
        })
      } else {
        await supabase
          .from('user_wallets')
          .update({
            naira_balance: (wallet.naira_balance || 0) + depositAmount,
            total_deposits: (wallet.total_deposits || 0) + depositAmount,
            updated_at: new Date().toISOString()
          })
          .eq('user_email', userEmail)
      }

      // Record wallet transaction
      const newBalance = (wallet?.naira_balance || 0) + depositAmount
      await supabase.from('wallet_transactions').insert({
        user_email: userEmail,
        amount: depositAmount,
        transaction_type: 'deposit',
        related_id: paymentData.id || reference,
        balance_after: newBalance,
        notes: `ZendFi deposit - ${reference || paymentData.id}`
      })

      // Record platform fee (1% deposit fee like Bayse Markets)
      const fee = Math.round(depositAmount * 0.01)
      if (fee > 0) {
        await supabase.from('platform_fees').insert({
          user_email: userEmail,
          amount: fee,
          fee_type: 'deposit',
          related_id: reference || paymentData.id,
          notes: `1% deposit fee on NGN ${depositAmount.toLocaleString()}`
        })
      }

      // Notification
      await supabase.from('notifications').insert({
        user_email: userEmail,
        type: 'deposit',
        title: 'Deposit Successful!',
        message: `NGN ${depositAmount.toLocaleString()} has been added to your wallet.`,
        read: false,
      })

      // Handle booking payment
      if (metadata.payment_type === 'booking' && metadata.related_id) {
        await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            total_amount: depositAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', metadata.related_id)
      }

      console.log(`ZendFi: Credited NGN ${depositAmount} to ${userEmail}`)
    }

    // Handle payment failure
    if (eventType === 'payment.failed' || eventType === 'PaymentFailed') {
      const metadata = paymentData.metadata || {}
      const reference = metadata.reference

      if (reference) {
        await supabase
          .from('payments')
          .update({ status: 'failed', paystack_data: paymentData })
          .eq('reference', reference)
      }

      if (metadata.user_email) {
        await supabase.from('notifications').insert({
          user_email: metadata.user_email,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: 'Your deposit could not be processed. Please try again.',
          read: false,
        })
      }
    }

    // Handle payment expiry
    if (eventType === 'payment.expired' || eventType === 'PaymentExpired') {
      const metadata = paymentData.metadata || {}
      const reference = metadata.reference

      if (reference) {
        await supabase
          .from('payments')
          .update({ status: 'expired', paystack_data: paymentData })
          .eq('reference', reference)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('ZendFi webhook error:', error)
    return NextResponse.json({ received: true })
  }
}
