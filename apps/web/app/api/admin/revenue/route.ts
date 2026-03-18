import { NextRequest, NextResponse } from 'next/server';
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

// Admin-only middleware check
async function isAdmin(userId: string) {
  const admin = getAdmin();
  const { data } = await admin
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .single();
  return !!data;
}

// GET — Revenue dashboard data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check admin status
    const adminCheck = await isAdmin(user.id);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const admin = getAdmin();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const since = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString();

    // 1. Total Revenue
    const { data: revenue } = await admin
      .from('platform_revenue')
      .select('type, amount, created_at')
      .gte('created_at', since);

    const totalRevenue = (revenue || []).reduce((sum, r) => sum + (r.amount || 0), 0);
    const tradeFeeRevenue = (revenue || []).filter(r => r.type === 'trade_fee').reduce((s, r) => s + r.amount, 0);
    const withdrawalFeeRevenue = (revenue || []).filter(r => r.type === 'withdrawal_fee').reduce((s, r) => s + r.amount, 0);

    // Revenue by day
    const revenueByDay: Record<string, number> = {};
    (revenue || []).forEach(r => {
      const day = r.created_at.split('T')[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + r.amount;
    });

    // 2. Transaction Summary
    const { data: transactions } = await admin
      .from('transaction_log')
      .select('type, amount, fee, net_amount, status, created_at')
      .gte('created_at', since);

    const txSummary = {
      totalDeposits: (transactions || []).filter(t => t.type === 'crypto_deposit').reduce((s, t) => s + t.amount, 0),
      totalTradeBuys: (transactions || []).filter(t => t.type === 'trade_buy').reduce((s, t) => s + t.amount, 0),
      totalTradeSells: (transactions || []).filter(t => t.type === 'trade_sell').reduce((s, t) => s + t.amount, 0),
      totalPayouts: (transactions || []).filter(t => t.type === 'bank_payout').reduce((s, t) => s + t.amount, 0),
      totalFees: (transactions || []).filter(t => t.type === 'fee_collected' || t.fee > 0).reduce((s, t) => s + (t.fee || 0), 0),
      count: (transactions || []).length,
    };

    // 3. User Stats
    const { count: totalUsers } = await admin
      .from('user_balances')
      .select('*', { count: 'exact', head: true });

    const { count: activeTraders } = await admin
      .from('user_balances')
      .select('*', { count: 'exact', head: true })
      .gt('total_trades', 0);

    const { data: totalBalances } = await admin
      .from('user_balances')
      .select('balance, total_deposited, total_withdrawn');

    const platformStats = {
      totalUsersBalance: (totalBalances || []).reduce((s, b) => s + (b.balance || 0), 0),
      totalDeposited: (totalBalances || []).reduce((s, b) => s + (b.total_deposited || 0), 0),
      totalWithdrawn: (totalBalances || []).reduce((s, b) => s + (b.total_withdrawn || 0), 0),
    };

    // 4. Market Stats
    const { count: totalMarkets } = await admin
      .from('prediction_markets')
      .select('*', { count: 'exact', head: true });

    const { count: openMarkets } = await admin
      .from('prediction_markets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    const { data: marketPools } = await admin
      .from('prediction_markets')
      .select('total_pool')
      .eq('status', 'open');

    const totalPoolValue = (marketPools || []).reduce((s, m) => s + (m.total_pool || 0), 0);

    // 5. Recent Transactions (last 50)
    const { data: recentTx } = await admin
      .from('transaction_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // 6. Recent Revenue Events (last 30)
    const { data: recentRevenue } = await admin
      .from('platform_revenue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    // 7. Top Traders
    const { data: topTraders } = await admin
      .from('user_balances')
      .select('user_id, balance, total_deposited, total_withdrawn, total_trades, total_wins, xp_points')
      .order('total_trades', { ascending: false })
      .limit(10);

    // Get names for top traders
    const traderIds = (topTraders || []).map(t => t.user_id);
    const { data: traderProfiles } = await admin
      .from('profiles')
      .select('id, email, full_name')
      .in('id', traderIds);
    const profileMap = new Map((traderProfiles || []).map(p => [p.id, p]));

    return NextResponse.json({
      period: parseInt(period),
      revenue: {
        total: totalRevenue,
        tradeFees: tradeFeeRevenue,
        withdrawalFees: withdrawalFeeRevenue,
        byDay: revenueByDay,
        recentEvents: recentRevenue,
      },
      transactions: {
        summary: txSummary,
        recent: (recentTx || []).map(tx => ({
          ...tx,
          metadata: undefined, // Don't expose raw metadata
        })),
      },
      users: {
        total: totalUsers || 0,
        activeTraders: activeTraders || 0,
        ...platformStats,
      },
      markets: {
        total: totalMarkets || 0,
        open: openMarkets || 0,
        totalPoolValue,
      },
      topTraders: (topTraders || []).map(t => {
        const profile = profileMap.get(t.user_id);
        const email = profile?.email || '';
        return {
          displayName: profile?.full_name || (email.includes('@') ? email.split('@')[0].slice(0, 3) + '***' : 'Anon'),
          trades: t.total_trades,
          wins: t.total_wins,
          deposited: t.total_deposited,
          withdrawn: t.total_withdrawn,
          balance: t.balance,
          xp: t.xp_points,
        };
      }),
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST — Admin actions (add admin, update fees, etc.)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const adminCheck = await isAdmin(user.id);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const admin = getAdmin();
    const body = await request.json();
    const { action } = body;

    if (action === 'add_admin') {
      const { email } = body;
      // Find user by email
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!profile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      await admin.from('admin_users').upsert({
        user_id: profile.id,
        role: 'admin',
      }, { onConflict: 'user_id' });

      return NextResponse.json({ success: true, message: `${email} added as admin` });
    }

    if (action === 'update_fee') {
      const { feeType, value } = body;
      const key = feeType === 'trade' ? 'TRADE_FEE_PERCENT' : 'WITHDRAWAL_FEE_PERCENT';
      
      await admin.from('app_config').upsert({
        key,
        value: value.toString(),
      }, { onConflict: 'key' });

      return NextResponse.json({ success: true, message: `${key} updated to ${value}%` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
