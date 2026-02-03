import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data: markets, error } = await supabase
      .from('prediction_markets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ markets: [], error: error.message })
    }

    return NextResponse.json({ markets: markets || [] })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ markets: [], error: 'Failed to fetch markets' })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, case_reference, court, category, closes_at } = body

    if (!title || !description || !category || !closes_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('prediction_markets')
      .insert([{
        title,
        description,
        case_reference,
        court,
        category,
        closes_at: new Date(closes_at).toISOString(),
        outcome_options: { yes_votes: 0, no_votes: 0 },
        total_pool: 0,
        status: 'open'
      }])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, market: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to create market' }, { status: 500 })
  }
}
