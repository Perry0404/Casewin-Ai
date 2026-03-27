import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const korapaySecretKey = process.env.KORAPAY_SECRET_KEY || ''

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

// POST /api/payments/initialize - Initialize Korapay payment
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, payment_type, related_id, callback_url } = body
    const email = authUser.email

    // Validate required fields
    if (!email || !amount || !payment_type) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, payment_type' },
        { status: 400 }
      )
    }

    // Validate amount (minimum ₦100)
    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum payment amount is ₦100' },
        { status: 400 }
      )
    }

    // Require Korapay API key
    if (!korapaySecretKey) {
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 503 }
      )
    }

    // Initialize Korapay payment
    const reference = `casewin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const korapayResponse = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${korapaySecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reference,
        amount: amount,
        currency: 'NGN',
        customer: {
          email
        },
        redirect_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/booking-success`,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/korapay`,
        metadata: {
          payment_type,
          related_id
        }
      })
    })

    const korapayData = await korapayResponse.json()

    if (!korapayResponse.ok || !korapayData.status) {
      console.error('Korapay error:', korapayData)
      return NextResponse.json(
        { error: korapayData.message || 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    // Store payment record in database
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      await supabase.from('payments').insert({
        reference,
        user_email: email,
        amount: amount * 100, // Store in kobo
        currency: 'NGN',
        payment_type,
        related_id,
        status: 'pending',
        paystack_data: korapayData.data
      })
    }

    return NextResponse.json({
      status: 'success',
      message: 'Payment initialized successfully',
      data: {
        checkout_url: korapayData.data.checkout_url,
        reference: korapayData.data.reference
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
