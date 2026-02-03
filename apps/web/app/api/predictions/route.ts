import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('prediction_markets')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: markets, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ markets: [], error: error.message })
    }

    // Transform data for frontend
    const transformedMarkets = (markets || []).map(market => ({
      id: market.id,
      title: market.title,
      description: market.description,
      category: market.category || 'other',
      deadline: market.closes_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      yes_votes: market.outcome_options?.yes_votes || 0,
      no_votes: market.outcome_options?.no_votes || 0,
      total_pool: market.total_pool || 0,
      resolved: market.status === 'resolved',
      outcome: market.actual_outcome
    }))

    return NextResponse.json({ markets: transformedMarkets })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ markets: [], error: 'Failed to fetch markets' })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, category, closes_at, outcome_options } = body

    const { data, error } = await supabase
      .from('prediction_markets')
      .insert([{
        title,
        description,
        category,
        closes_at,
        outcome_options: outcome_options || { yes_votes: 0, no_votes: 0 },
        total_pool: 0,
        status: 'open'
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ market: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to create market' }, { status: 500 })
  }
}
