import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Streak multipliers — consecutive winning predictions
const STREAK_REWARDS = [
  { streak: 3, multiplier: 1.2, xpBonus: 100, title: '🔥 Hot Streak!' },
  { streak: 5, multiplier: 1.5, xpBonus: 300, title: '⚡ Lightning Run!' },
  { streak: 7, multiplier: 2.0, xpBonus: 700, title: '🌟 Legendary Streak!' },
  { streak: 10, multiplier: 3.0, xpBonus: 1500, title: '💎 Diamond Hands!' },
  { streak: 15, multiplier: 5.0, xpBonus: 5000, title: '👑 Oracle Mode!' },
];

function getStreakReward(streak: number) {
  let reward = null;
  for (const r of STREAK_REWARDS) {
    if (streak >= r.streak) reward = r;
  }
  return reward;
}

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Call this after a market resolves to update streaks
// POST body: { userId, marketId, won: boolean }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, marketId, won } = body;

    if (!userId || !marketId || won === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const admin = getAdmin();

    // Get current user stats
    const { data: userBalance } = await admin
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!userBalance) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let newStreak = userBalance.streak_count || 0;
    let xpEarned = 0;
    let streakReward = null;
    let streakBroken = false;

    if (won) {
      // Winning — increment streak
      newStreak += 1;
      
      // Base XP for winning
      xpEarned = 50;

      // Check for streak bonus
      streakReward = getStreakReward(newStreak);
      if (streakReward) {
        xpEarned += streakReward.xpBonus;
      }

      // Update user stats
      await admin
        .from('user_balances')
        .update({
          streak_count: newStreak,
          best_streak: Math.max(newStreak, userBalance.best_streak || 0),
          total_wins: (userBalance.total_wins || 0) + 1,
          xp_points: (userBalance.xp_points || 0) + xpEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    } else {
      // Losing — reset streak but give consolation XP
      streakBroken = newStreak >= 3;
      newStreak = 0;
      xpEarned = 10; // consolation

      await admin
        .from('user_balances')
        .update({
          streak_count: 0,
          xp_points: (userBalance.xp_points || 0) + xpEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    // Record streak event
    await admin.from('streak_events').insert({
      user_id: userId,
      market_id: marketId,
      won,
      streak_after: newStreak,
      xp_earned: xpEarned,
      streak_multiplier: streakReward?.multiplier || 1.0,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      won,
      newStreak,
      xpEarned,
      totalXP: (userBalance.xp_points || 0) + xpEarned,
      streakReward: streakReward ? {
        title: streakReward.title,
        multiplier: streakReward.multiplier,
        xpBonus: streakReward.xpBonus
      } : null,
      streakBroken,
      bestStreak: Math.max(newStreak, userBalance.best_streak || 0),
      nextStreakMilestone: STREAK_REWARDS.find(r => r.streak > newStreak) || null
    });

  } catch (error) {
    console.error('Streak error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET — Get streak info for current user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const admin = getAdmin();

  const { data: userBalance } = await admin
    .from('user_balances')
    .select('streak_count, best_streak, total_trades, total_wins, xp_points, rank_title')
    .eq('user_id', userId)
    .single();

  if (!userBalance) {
    return NextResponse.json({ streak: 0, bestStreak: 0, xp: 0 });
  }

  const currentReward = getStreakReward(userBalance.streak_count || 0);
  const nextMilestone = STREAK_REWARDS.find(r => r.streak > (userBalance.streak_count || 0));

  // Get recent streak events
  const { data: events } = await admin
    .from('streak_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    streak: userBalance.streak_count || 0,
    bestStreak: userBalance.best_streak || 0,
    totalTrades: userBalance.total_trades || 0,
    totalWins: userBalance.total_wins || 0,
    winRate: userBalance.total_trades > 0 
      ? ((userBalance.total_wins || 0) / userBalance.total_trades * 100).toFixed(1) 
      : '0',
    xp: userBalance.xp_points || 0,
    currentReward,
    nextMilestone,
    recentEvents: events || [],
    streakRewards: STREAK_REWARDS
  });
}
