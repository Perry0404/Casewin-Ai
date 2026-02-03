import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { market_id, user_id, vote, amount } = body

    if (!market_id || !vote || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current market
    const { data: market, error: marketError } = await supabase
      .from('prediction_markets')
      .select('*')
      .eq('id', market_id)
      .single()

    if (marketError || !market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    if (market.status !== 'open') {
      return NextResponse.json({ error: 'Market is closed' }, { status: 400 })
    }

    // Update outcome_options with new vote
    const currentOptions = market.outcome_options || { yes_votes: 0, no_votes: 0 }
    const updatedOptions = {
      ...currentOptions,
      yes_votes: vote === 'yes' ? (currentOptions.yes_votes || 0) + 1 : currentOptions.yes_votes || 0,
      no_votes: vote === 'no' ? (currentOptions.no_votes || 0) + 1 : currentOptions.no_votes || 0,
    }

    // Update market
    const { error: updateError } = await supabase
      .from('prediction_markets')
      .update({
        outcome_options: updatedOptions,
        total_pool: (market.total_pool || 0) + amount
      })
      .eq('id', market_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Create bet record if user_id provided
    if (user_id) {
      const potentialPayout = amount * 2 // Simple 2x payout for now

      await supabase
        .from('prediction_bets')
        .insert([{
          user_id,
          market_id,
          selected_outcome: vote,
          amount,
          potential_payout: potentialPayout,
          status: 'active'
        }])
    }

    return NextResponse.json({ 
      message: 'Vote placed successfully!',
      success: true 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to place vote' }, { status: 500 })
  }
}
