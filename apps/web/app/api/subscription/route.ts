import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

const PLANS = {
  individual: {
    id: 'individual',
    name: 'Individual Lawyer',
    priceNGN: 32000, // ~$20/month
    priceUSD: 20,
    interval: 'monthly',
    features: [
      'All 18 AI Legal Tools',
      'Daily Intelligence Brief',
      'Case Law Database Search',
      'Unlimited AI Queries',
      '1 User Seat',
    ],
    toolLimit: -1, // unlimited
  },
  firm: {
    id: 'firm',
    name: 'Law Firm',
    priceNGN: 48000, // ~$30/month
    priceUSD: 30,
    interval: 'monthly',
    features: [
      'Everything in Individual',
      'Up to 10 User Seats',
      'Firm Knowledge Agent (PDF Upload)',
      'Priority AI Processing',
      'Firm-wide Analytics',
      'Custom Brief Templates',
    ],
    toolLimit: -1,
  },
  free: {
    id: 'free',
    name: 'Free Trial',
    priceNGN: 0,
    priceUSD: 0,
    interval: 'monthly',
    features: [
      '3 AI Queries per Day',
      'Basic Case Search',
      'Limited Intelligence Brief',
    ],
    toolLimit: 3,
  },
}

// GET /api/subscription — get current user's subscription + plans
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId')

    // Always return plans
    const plans = Object.values(PLANS)

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
      dailyLimit: sub ? -1 : PLANS.free.toolLimit,
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
    const ZENDFI_KEY = process.env.ZENDFI_SECRET_KEY || process.env.ZENDFI_KEY_FALLBACK || ''
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
        onramp: true,
        metadata: {
          type: 'subscription',
          user_id: userId,
          user_email: userEmail,
          plan: plan,
        },
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://casewinai.com'}/tools?subscribed=true`,
      }),
    })

    if (!paymentRes.ok) {
      const errText = await paymentRes.text()
      console.error('ZendFi payment error:', errText)
      throw new Error('Payment initialization failed')
    }

    const paymentData = await paymentRes.json()
    const paymentUrl = paymentData.data?.url || paymentData.url || paymentData.data?.payment_link

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
