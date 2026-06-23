import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { PREDICTIONS_ENABLED } from '@/lib/features'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

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

const VALID_CATEGORIES = [
  'Sports', 'Entertainment', 'World Politics', 'Crypto',
  'Technology', 'Nigerian Law', 'Financial Law', 'Criminal Law'
]

// POST /api/predictions/create - Users create their own markets
export async function POST(request: NextRequest) {
  if (!PREDICTIONS_ENABLED) {
    return NextResponse.json({ error: 'Prediction market is currently disabled' }, { status: 503 })
  }
  try {
    const authUser = await getAuthUser(request)
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Sign in to create a market' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, deadline } = body

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length < 10) {
      return NextResponse.json({ error: 'Title must be at least 10 characters (phrase it as a yes/no question)' }, { status: 400 })
    }
    if (title.trim().length > 200) {
      return NextResponse.json({ error: 'Title must be under 200 characters' }, { status: 400 })
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 })
    }
    if (!deadline) {
      return NextResponse.json({ error: 'Deadline is required' }, { status: 400 })
    }

    const deadlineDate = new Date(deadline)
    const now = new Date()
    const minDeadline = new Date(now.getTime() + 60 * 60 * 1000) // at least 1 hour from now
    if (deadlineDate < minDeadline) {
      return NextResponse.json({ error: 'Deadline must be at least 1 hour from now' }, { status: 400 })
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Rate limit: max 5 markets per user per day
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('prediction_markets')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', authUser.email)
      .gte('created_at', dayAgo)

    if ((count || 0) >= 5) {
      return NextResponse.json({ error: 'You can create up to 5 markets per day' }, { status: 429 })
    }

    const { data: market, error } = await supabase
      .from('prediction_markets')
      .insert({
        title: title.trim(),
        description: (description || '').trim().substring(0, 500),
        category,
        closes_at: deadlineDate.toISOString(),
        status: 'open',
        total_pool: 0,
        outcome_options: { yes_shares: 20000, no_shares: 20000 },
        created_by: authUser.email
      })
      .select()
      .single()

    if (error) {
      console.error('Create market error:', error)
      return NextResponse.json({ error: 'Failed to create market' }, { status: 500 })
    }

    return NextResponse.json({ success: true, market })
  } catch (error) {
    console.error('Create market error:', error)
    return NextResponse.json({ error: 'Failed to create market' }, { status: 500 })
  }
}
