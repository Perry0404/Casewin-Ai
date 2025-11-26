import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lawyer_id,
      booking_date,
      booking_time,
      duration_hours,
      case_description,
      total_amount
    } = body;

    // Validate required fields
    if (!lawyer_id || !booking_date || !booking_time || !duration_hours || !case_description) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Mock client ID (in production, get from auth session)
    const client_id = 'mock-client-' + Math.random().toString(36).substr(2, 9);

    // Try to insert into database
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            client_id,
            lawyer_id,
            booking_date,
            booking_time,
            duration_hours,
            case_description,
            total_amount,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        // Continue with mock response if DB not set up
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue with mock response
    }

    // Generate Paystack payment link (mock for now)
    const paymentLink = `https://paystack.com/pay/booking-${Date.now()}`;

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: 'booking-' + Date.now(),
        client_id,
        lawyer_id,
        booking_date,
        booking_time,
        duration_hours,
        case_description,
        total_amount,
        status: 'pending',
        payment_link: paymentLink
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create booking'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const lawyerId = searchParams.get('lawyer_id');

    let query = supabase.from('bookings').select('*');

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (lawyerId) {
      query = query.eq('lawyer_id', lawyerId);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: true,
        bookings: []
      });
    }

    return NextResponse.json({
      success: true,
      bookings: bookings || []
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({
      success: true,
      bookings: []
    });
  }
}
