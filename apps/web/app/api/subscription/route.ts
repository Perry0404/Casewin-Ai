import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

// FREE tools (open to everyone — students, public, anyone):
//   research, draft, predict, analyze, summarize, translate, arguments,
//   compliance, deadlines, billing, cases, filing, citations, chatbot,
//   fees, hearing-prep, clauses
//
// PREMIUM tools (subscription required — lawyers & firms only):
//   intelligence (Daily Intelligence Brief)
//   knowledge (Firm Knowledge Agent)
//   Plus: unlimited queries, priority processing, firm analytics

const PREMIUM_TOOLS = ['intelligence', 'knowledge']

// Comp / free-trial access. Emails listed here (or in the COMP_ACCESS_EMAILS
// env var, comma-separated) get full firm-tier premium access without paying —
// used to grant testers access to the Knowledge Agent + Daily Brief.
const COMP_ACCESS_EMAILS = (process.env.COMP_ACCESS_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

const PLANS = {
  individual: {
    id: 'individual',
    name: 'Individual Lawyer',
    priceNGN: 32000, // ~$20/month
    priceUSD: 20,
    interval: 'monthly',
    features: [
      'All Free Tools (unlimited)',
      'Daily Intelligence Brief',
      'Unlimited AI Queries',
      'Priority AI Processing',
      '1 User Seat',
    ],
    premiumTools: PREMIUM_TOOLS,
    maxSeats: 1,
  },
  firm: {
    id: 'firm',
    name: 'Law Firm',
    priceNGN: 48000, // ~$30/month
    priceUSD: 30,
    interval: 'monthly',
    features: [
      'Everything in Individual',
      'Firm Knowledge Agent (PDF Upload)',
      'Up to 10 User Seats',
      'Firm-wide Analytics',
      'Custom Brief Templates',
    ],
    premiumTools: [...PREMIUM_TOOLS],
    maxSeats: 10,
  },
  free: {
    id: 'free',
    name: 'Free',
    priceNGN: 0,
    priceUSD: 0,
    interval: 'monthly',
    features: [
      'All AI Legal Tools (open)',
      'Case Search & Research',
      'Document Drafting',
      'Contract Analysis',
      'Prediction Markets',
    ],
    premiumTools: [] as string[],
    maxSeats: 1,
  },
}

// GET /api/subscription — get current user's subscription + plans
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId')
    const email = (req.nextUrl.searchParams.get('email') || req.headers.get('x-user-email') || '').toLowerCase()

    // Always return plans
    const plans = Object.values(PLANS)

    // Comp / free-trial testers get firm-tier access without payment.
    if (email && COMP_ACCESS_EMAILS.includes(email)) {
      return NextResponse.json({
        plans,
        subscription: { plan: 'firm', status: 'active', expires_at: '2099-12-31T00:00:00.000Z', comp: true },
        premiumTools: PREMIUM_TOOLS,
      })
    }

    if (!userId) {
      return NextResponse.json({ plans, subscription: null })
    }

    const supabase = getSupabaseClient()

    // Check user's subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sub) {
      // Check if expired
      const expiresAt = new Date(sub.expires_at)
      if (expiresAt < new Date()) {
        // Mark expired
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', sub.id)

        return NextResponse.json({
          plans,
          subscription: { ...sub, status: 'expired' },
        })
      }
    }

    // Check daily usage for free tier
    let dailyUsage = 0
    if (!sub) {
      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase
        .from('ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00Z`)

      dailyUsage = count || 0
    }

    return NextResponse.json({
      plans,
      subscription: sub || { plan: 'free', status: 'active' },
      dailyUsage,
      premiumTools: sub ? (PLANS as any)[sub.plan]?.premiumTools || [] : [],
    })
  } catch (error) {
    console.error('Subscription check error:', error)
    return NextResponse.json({
      plans: Object.values(PLANS),
      subscription: null,
    })
  }
}

// POST /api/subscription — create/upgrade subscription
export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail, plan } = await req.json()

    if (!userId || !plan) {
      return NextResponse.json({ error: 'userId and plan required' }, { status: 400 })
    }

    const planDetails = PLANS[plan as keyof typeof PLANS]
    if (!planDetails || plan === 'free') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Create ZendFi payment link
    const ZENDFI_KEY = process.env.ZENDFI_API_KEY || 'zfi_live_5uRZX6VuCMDNq3ZYEZMyen5YwypToRY7chR7fRHuVtQJ'
    const amountUSD = planDetails.priceUSD

    const paymentRes = await fetch('https://api.zendfi.tech/api/v1/payment-links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZENDFI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountUSD,
        currency: 'USD',
        token: 'USDC',
        onramp: true,
        payer_service_charge: true,
        metadata: {
          type: 'subscription',
          user_id: userId,
          user_email: userEmail,
          plan: plan,
        },
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://casewinai.com'}/api/webhooks/zendfi`,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://casewinai.com'}/tools?subscribed=true`,
      }),
    })

    if (!paymentRes.ok) {
      const errText = await paymentRes.text()
      console.error('ZendFi payment error:', errText)
      throw new Error('Payment initialization failed')
    }

    const paymentData = await paymentRes.json()
    // ZendFi returns the link under different keys depending on endpoint version.
    // Check all known shapes (payment_url is the most common) so we never hand
    // the client an empty URL — which previously silently broke subscriptions.
    const paymentUrl =
      paymentData.payment_url || paymentData.data?.payment_url ||
      paymentData.url || paymentData.data?.url ||
      paymentData.checkout_url || paymentData.data?.checkout_url ||
      paymentData.payment_link || paymentData.data?.payment_link

    if (!paymentUrl) {
      console.error('ZendFi: no payment URL in response:', JSON.stringify(paymentData))
      return NextResponse.json({ success: false, error: 'Payment link could not be created' }, { status: 502 })
    }

    // Record pending subscription
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        user_email: userEmail,
        plan: plan,
        status: 'pending',
        amount_usd: amountUSD,
        amount_ngn: planDetails.priceNGN,
        payment_reference: paymentData.data?.reference || paymentData.reference || '',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Subscription insert error:', insertError)
    }

    return NextResponse.json({
      success: true,
      paymentUrl,
      plan: planDetails,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
