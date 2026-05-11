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
      // Use the original Naira amount from metadata (we convert NGN->USD for ZendFi)
      const amount = metadata.naira_amount || paymentData.amount || metadata.amount

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

      // Handle subscription payment - activate the subscription
      if (metadata.type === 'subscription' && metadata.user_id && metadata.plan) {
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', metadata.user_id)
          .eq('plan', metadata.plan)
          .eq('status', 'pending')
        await supabase.from('notifications').insert({
          user_email: userEmail,
          type: 'subscription',
          title: 'Subscription Activated!',
          message: `Your ${metadata.plan} plan is now active. Enjoy premium tools.`,
          read: false,
        })
        console.log(`ZendFi: Activated ${metadata.plan} subscription for ${userEmail}`)
      }

      // Handle invoice payment - mark invoice paid and credit lawyer wallet
      if (metadata.invoice_number && metadata.lawyer_id) {
        await supabase
          .from('invoices')
          .update({ status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('invoice_number', metadata.invoice_number)
          .eq('lawyer_id', metadata.lawyer_id)
        // Credit lawyer wallet (lawyer keeps 85%, CaseWin takes 15%)
        const lawyerShare = Math.round(depositAmount * 0.85)
        const { data: lawyerWallet } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', metadata.lawyer_id)
          .single()
        if (!lawyerWallet) {
          await supabase.from('user_wallets').insert({ user_id: metadata.lawyer_id, naira_balance: lawyerShare, total_deposits: lawyerShare })
        } else {
          await supabase.from('user_wallets').update({
            naira_balance: (lawyerWallet.naira_balance || 0) + lawyerShare,
            total_deposits: (lawyerWallet.total_deposits || 0) + lawyerShare,
            updated_at: new Date().toISOString(),
          }).eq('user_id', metadata.lawyer_id)
        }
        console.log(`ZendFi: Invoice ${metadata.invoice_number} paid — credited NGN ${lawyerShare} to lawyer ${metadata.lawyer_id}`)
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
