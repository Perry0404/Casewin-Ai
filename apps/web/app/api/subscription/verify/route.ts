import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

// POST /api/subscription/verify — verify payment and activate subscription
export async function POST(req: NextRequest) {
  try {
    const { reference, userId } = await req.json()

    if (!reference && !userId) {
      return NextResponse.json({ error: 'reference or userId required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Find pending subscription
    let query = supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)

    if (reference) {
      query = query.eq('payment_reference', reference)
    } else if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: sub, error } = await query.single()

    if (error || !sub) {
      // No pending subscription - check if there's already an active one
      const { data: activeSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (activeSub) {
        return NextResponse.json({ success: true, subscription: activeSub, message: 'Already active' })
      }

      return NextResponse.json({ error: 'No pending subscription found' }, { status: 404 })
    }

    // Activate subscription
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', sub.id)

    if (updateError) {
      console.error('Subscription activation error:', updateError)
      return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      subscription: {
        ...sub,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
