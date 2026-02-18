import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - Get user balance
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Return default balance for non-authenticated users (demo mode)
      return NextResponse.json({ 
        balance: 50000,
        isDemo: true,
        message: 'Login to save your balance'
      });
    }

    // Get or create user balance
    let { data: userBalance, error } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !userBalance) {
      // Create new balance record for user
      const { data: newBalance, error: createError } = await supabase
        .from('user_balances')
        .insert({
          user_id: user.id,
          balance: 50000, // Starting balance
          total_deposited: 0,
          total_withdrawn: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create balance:', createError);
        return NextResponse.json({ balance: 50000, isDemo: true });
      }

      userBalance = newBalance;
    }

    return NextResponse.json({
      balance: userBalance.balance,
      totalDeposited: userBalance.total_deposited,
      totalWithdrawn: userBalance.total_withdrawn,
      isDemo: false
    });

  } catch (error) {
    console.error('Error getting balance:', error);
    return NextResponse.json({ balance: 50000, isDemo: true });
  }
}

// POST - Fund wallet (demo) or process deposit
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
      // Demo mode - just return success
      return NextResponse.json({ 
        success: true, 
        newBalance: amount,
        isDemo: true,
        message: 'Demo deposit successful. Login to save your balance.'
      });
    }

    // Get current balance
    const { data: userBalance } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const currentBalance = userBalance?.balance || 0;

    if (action === 'deposit') {
      // Update balance
      const { data, error } = await supabase
        .from('user_balances')
        .upsert({
          user_id: user.id,
          balance: currentBalance + amount,
          total_deposited: (userBalance?.total_deposited || 0) + amount,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to deposit' }, { status: 500 });
      }

      // Record transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount: amount,
          balance_after: data.balance,
          description: 'Wallet deposit (demo)'
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

      const { data, error } = await supabase
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
        return NextResponse.json({ error: 'Failed to withdraw' }, { status: 500 });
      }

      // Record transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: -amount,
          balance_after: data.balance,
          description: 'Wallet withdrawal (demo)'
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
