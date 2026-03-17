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

// Rank titles with XP thresholds
const RANKS = [
  { title: 'Rookie', minXP: 0, badge: '🟤' },
  { title: 'Analyst', minXP: 500, badge: '⚪' },
  { title: 'Trader', minXP: 2000, badge: '🟢' },
  { title: 'Strategist', minXP: 5000, badge: '🔵' },
  { title: 'Expert', minXP: 15000, badge: '🟣' },
  { title: 'Master', minXP: 50000, badge: '🟡' },
  { title: 'Legend', minXP: 150000, badge: '🔴' },
  { title: 'Oracle', minXP: 500000, badge: '💎' },
];

function getRank(xp: number) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r;
  }
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  return {
    ...rank,
    nextTitle: nextRank?.title || null,
    nextXP: nextRank?.minXP || null,
    progress: nextRank ? ((xp - rank.minXP) / (nextRank.minXP - rank.minXP)) * 100 : 100
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, weekly, monthly
    const limit = parseInt(searchParams.get('limit') || '50');

    const admin = getAdmin();

    // Get all user balances with stats
    const { data: balances, error } = await admin
      .from('user_balances')
      .select('user_id, balance, total_deposited, total_withdrawn, streak_count, best_streak, total_trades, total_wins, xp_points, rank_title')
      .order('xp_points', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Leaderboard error:', error);
      return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
    }

    // Get user profiles for display names
    const userIds = (balances || []).map(b => b.user_id);
    
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // Build leaderboard entries
    const leaderboard = (balances || []).map((b, idx) => {
      const profile = profileMap.get(b.user_id);
      const rank = getRank(b.xp_points || 0);
      const winRate = b.total_trades > 0 ? ((b.total_wins || 0) / b.total_trades * 100).toFixed(1) : '0';
      const profitLoss = (b.balance || 0) - (b.total_deposited || 0) + (b.total_withdrawn || 0);

      // Anonymize email for display
      const email = profile?.email || '';
      const displayName = profile?.full_name 
        || (email.includes('@') ? email.split('@')[0].slice(0, 3) + '***' : 'Anonymous');

      return {
        rank: idx + 1,
        userId: b.user_id,
        displayName,
        balance: b.balance || 0,
        totalTrades: b.total_trades || 0,
        totalWins: b.total_wins || 0,
        winRate: parseFloat(winRate),
        streakCount: b.streak_count || 0,
        bestStreak: b.best_streak || 0,
        xpPoints: b.xp_points || 0,
        rankTitle: rank.title,
        rankBadge: rank.badge,
        nextRankTitle: rank.nextTitle,
        nextRankXP: rank.nextXP,
        rankProgress: rank.progress,
        profitLoss,
        isOnFire: (b.streak_count || 0) >= 3, // 🔥 for 3+ streak
      };
    });

    // Get current user's rank
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let myRank = null;

    if (user) {
      const myEntry = leaderboard.find(l => l.userId === user.id);
      if (myEntry) {
        myRank = myEntry;
      } else {
        // User not in top N — get their data
        const { data: myBalance } = await admin
          .from('user_balances')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (myBalance) {
          const rank = getRank(myBalance.xp_points || 0);
          const { data: myProfile } = await admin
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

          // Count users with more XP to get rank position
          const { count } = await admin
            .from('user_balances')
            .select('*', { count: 'exact', head: true })
            .gt('xp_points', myBalance.xp_points || 0);

          myRank = {
            rank: (count || 0) + 1,
            userId: user.id,
            displayName: myProfile?.full_name || 'You',
            balance: myBalance.balance || 0,
            totalTrades: myBalance.total_trades || 0,
            totalWins: myBalance.total_wins || 0,
            winRate: myBalance.total_trades > 0 ? parseFloat(((myBalance.total_wins || 0) / myBalance.total_trades * 100).toFixed(1)) : 0,
            streakCount: myBalance.streak_count || 0,
            bestStreak: myBalance.best_streak || 0,
            xpPoints: myBalance.xp_points || 0,
            rankTitle: rank.title,
            rankBadge: rank.badge,
            nextRankTitle: rank.nextTitle,
            nextRankXP: rank.nextXP,
            rankProgress: rank.progress,
            profitLoss: (myBalance.balance || 0) - (myBalance.total_deposited || 0) + (myBalance.total_withdrawn || 0),
            isOnFire: (myBalance.streak_count || 0) >= 3,
          };
        }
      }
    }

    return NextResponse.json({
      leaderboard,
      myRank,
      ranks: RANKS,
      totalTraders: leaderboard.length,
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
