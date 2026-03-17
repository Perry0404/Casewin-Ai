import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET - Get user balance (real only — no fake demo balance)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ 
        balance: 0,
        isDemo: true,
        message: 'Login to start trading'
      });
    }

    const admin = getAdmin();

    // Get or create user balance using service role (bypasses RLS)
    let { data: userBalance } = await admin
      .from('user_balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!userBalance) {
      // Auto-create balance row for this user
      const { data: newBalance, error: createError } = await admin
        .from('user_balances')
        .insert({
          user_id: user.id,
          balance: 0,
          total_deposited: 0,
          total_withdrawn: 0,
          streak_count: 0,
          total_trades: 0,
          total_wins: 0,
          xp_points: 0,
          rank_title: 'Rookie'
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create balance:', createError);
        return NextResponse.json({ balance: 0, isDemo: false, error: 'Balance creation failed' });
      }

      userBalance = newBalance;
    }

    return NextResponse.json({
      balance: userBalance.balance || 0,
      totalDeposited: userBalance.total_deposited || 0,
      totalWithdrawn: userBalance.total_withdrawn || 0,
      streakCount: userBalance.streak_count || 0,
      bestStreak: userBalance.best_streak || 0,
      totalTrades: userBalance.total_trades || 0,
      totalWins: userBalance.total_wins || 0,
      xpPoints: userBalance.xp_points || 0,
      rankTitle: userBalance.rank_title || 'Rookie',
      isDemo: false
    });

  } catch (error) {
    console.error('Error getting balance:', error);
    return NextResponse.json({ balance: 0, isDemo: false, error: 'Failed to load balance' });
  }
}

// POST - Credit/debit balance (from crypto deposit sync, demo deposit, withdrawal)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { amount, action } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Login required to trade' }, { status: 401 });
    }

    const admin = getAdmin();

    // Get current balance using service role
    let { data: userBalance } = await admin
      .from('user_balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Auto-create if missing
    if (!userBalance) {
      const { data: created } = await admin
        .from('user_balances')
        .insert({ user_id: user.id, balance: 0, total_deposited: 0, total_withdrawn: 0 })
        .select()
        .single();
      userBalance = created;
    }

    const currentBalance = userBalance?.balance || 0;

    if (action === 'deposit') {
      const { data, error } = await admin
        .from('user_balances')
        .update({
          balance: currentBalance + amount,
          total_deposited: (userBalance?.total_deposited || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Deposit error:', error);
        return NextResponse.json({ error: 'Failed to deposit' }, { status: 500 });
      }

      // Record transaction
      await admin
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount: amount,
          balance_after: data.balance,
          description: `Wallet deposit (₦${amount.toLocaleString()})`
        });

      return NextResponse.json({ 
        success: true, 
        newBalance: data.balance,
        isDemo: false
      });

    } else if (action === 'withdraw') {
      if (amount > currentBalance) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }

      const { data, error } = await admin
        .from('user_balances')
        .update({
          balance: currentBalance - amount,
          total_withdrawn: (userBalance?.total_withdrawn || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Withdraw error:', error);
        return NextResponse.json({ error: 'Failed to withdraw' }, { status: 500 });
      }

      // Record transaction
      await admin
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: -amount,
          balance_after: data.balance,
          description: `Wallet withdrawal (₦${amount.toLocaleString()})`
        });

      return NextResponse.json({ 
        success: true, 
        newBalance: data.balance,
        isDemo: false
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
