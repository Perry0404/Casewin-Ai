import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { market_id, outcome } = body

    if (!market_id || !outcome) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['yes', 'no'].includes(outcome)) {
      return NextResponse.json({ error: 'Outcome must be yes or no' }, { status: 400 })
    }

    // Update market status
    const { error: marketError } = await supabase
      .from('prediction_markets')
      .update({
        status: 'resolved',
        actual_outcome: outcome,
        resolution_date: new Date().toISOString()
      })
      .eq('id', market_id)

    if (marketError) {
      console.error('Supabase error:', marketError)
      return NextResponse.json({ error: marketError.message }, { status: 400 })
    }

    // Update winning bets
    const { error: betsError } = await supabase
      .from('prediction_bets')
      .update({ status: 'won' })
      .eq('market_id', market_id)
      .eq('selected_outcome', outcome)

    if (betsError) {
      console.error('Bets update error:', betsError)
    }

    // Update losing bets
    const losingOutcome = outcome === 'yes' ? 'no' : 'yes'
    await supabase
      .from('prediction_bets')
      .update({ status: 'lost' })
      .eq('market_id', market_id)
      .eq('selected_outcome', losingOutcome)

    return NextResponse.json({ 
      success: true, 
      message: `Market resolved as ${outcome.toUpperCase()}` 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to resolve market' }, { status: 500 })
  }
}
