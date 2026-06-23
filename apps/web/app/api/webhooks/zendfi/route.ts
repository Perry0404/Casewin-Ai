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
      const paymentType = metadata.payment_type || metadata.type || ''
      // Use the original Naira amount from metadata (we convert NGN->USD for ZendFi)
      const nairaAmount = Math.round(
        Number(metadata.naira_amount || paymentData.amount_ngn || paymentData.amount || metadata.amount || 0)
      )

      // ---- Invoice payment (agent commerce) ----
      // The payer is the lawyer's client, not a CaseWin wallet holder, so we do
      // NOT credit a deposit wallet here. Mark the invoice paid, credit the
      // lawyer's internal wallet 85%, and record CaseWin's 15% platform fee.
      if (metadata.invoice_number && metadata.lawyer_id) {
        const lawyerEmail = metadata.lawyer_email || null

        const { data: invoice } = await supabase
          .from('invoices')
          .update({ status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('invoice_number', metadata.invoice_number)
          .eq('lawyer_id', metadata.lawyer_id)
          .select()
          .single()

        const invoiceTotal = nairaAmount || Math.round(Number(invoice?.total || 0))
        const lawyerShare = Math.round(invoiceTotal * 0.85)
        const platformFee = invoiceTotal - lawyerShare

        // Credit the lawyer's internal wallet (85% share)
        const { data: lawyerWallet } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', metadata.lawyer_id)
          .single()
        const lawyerNewBalance = (lawyerWallet?.naira_balance || 0) + lawyerShare
        if (!lawyerWallet) {
          await supabase.from('user_wallets').insert({
            user_id: metadata.lawyer_id,
            user_email: lawyerEmail,
            naira_balance: lawyerShare,
            total_deposits: lawyerShare,
          })
        } else {
          await supabase.from('user_wallets').update({
            naira_balance: lawyerNewBalance,
            total_deposits: (lawyerWallet.total_deposits || 0) + lawyerShare,
            updated_at: new Date().toISOString(),
          }).eq('user_id', metadata.lawyer_id)
        }

        // Ledger entry for the lawyer payout
        if (lawyerEmail) {
          await supabase.from('wallet_transactions').insert({
            user_email: lawyerEmail,
            amount: lawyerShare,
            transaction_type: 'invoice_payout',
            related_id: metadata.invoice_number,
            balance_after: lawyerNewBalance,
            notes: `Invoice ${metadata.invoice_number} paid — 85% lawyer share`,
          })
        }

        // Record CaseWin's 15% platform fee
        if (platformFee > 0) {
          await supabase.from('platform_fees').insert({
            user_email: lawyerEmail || 'platform@casewin',
            amount: platformFee,
            fee_type: 'invoice',
            related_id: metadata.invoice_number,
            notes: `15% platform fee on invoice ${metadata.invoice_number} (NGN ${invoiceTotal.toLocaleString()})`,
          })
        }

        // Notify the lawyer
        if (lawyerEmail) {
          await supabase.from('notifications').insert({
            user_email: lawyerEmail,
            type: 'invoice_paid',
            title: 'Invoice Paid!',
            message: `${metadata.client_name || 'Your client'} paid invoice ${metadata.invoice_number}. NGN ${lawyerShare.toLocaleString()} credited to your wallet.`,
            read: false,
          })
        }

        console.log(`ZendFi: Invoice ${metadata.invoice_number} paid — credited NGN ${lawyerShare} to lawyer ${metadata.lawyer_id}`)
        return NextResponse.json({ received: true })
      }

      // ---- Subscription payment ----
      // Activate the plan only; subscription payments are not wallet deposits.
      if (paymentType === 'subscription' && metadata.user_id && metadata.plan) {
        const subExpiresAt = new Date()
        subExpiresAt.setMonth(subExpiresAt.getMonth() + 1)
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            activated_at: new Date().toISOString(),
            expires_at: subExpiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', metadata.user_id)
          .eq('plan', metadata.plan)
          .eq('status', 'pending')
        if (metadata.user_email) {
          await supabase.from('notifications').insert({
            user_email: metadata.user_email,
            type: 'subscription',
            title: 'Subscription Activated!',
            message: `Your ${metadata.plan} plan is now active. Enjoy premium tools.`,
            read: false,
          })
        }
        console.log(`ZendFi: Activated ${metadata.plan} subscription for ${metadata.user_email}`)
        return NextResponse.json({ received: true })
      }

      // ---- Wallet deposit / lawyer booking ----
      const userEmail = metadata.user_email
      const amount = nairaAmount
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

      // Invoice and subscription payments are handled in their own
      // early-return branches above; this path is wallet deposits + bookings.

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
