import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lawyer_id, client_id, booking_type, amount, scheduled_at, notes } = body

    if (!lawyer_id || !client_id || !booking_type || !amount) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 })
    }

    const { data, error } = await getSupabaseClient()
      .from('lawyer_bookings')
      .insert([{
        client_id,
        lawyer_id,
        booking_type,
        scheduled_at: scheduled_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        amount,
        notes,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) {
      console.error('getSupabaseClient() error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      booking: data
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({
      error: 'Failed to create booking'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')
    const lawyerId = searchParams.get('lawyer_id')

    let query = getSupabaseClient()
      .from('lawyer_bookings')
      .select(`
        *,
        client:client_id (full_name, email),
        lawyer:lawyer_id (full_name, email)
      `)
      .order('scheduled_at', { ascending: false })

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (lawyerId) {
      query = query.eq('lawyer_id', lawyerId)
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('getSupabaseClient() error:', error)
      return NextResponse.json({ bookings: [] })
    }

    return NextResponse.json({ bookings: bookings || [] })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ bookings: [] })
  }
}


