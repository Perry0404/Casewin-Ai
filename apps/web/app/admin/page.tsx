'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface RevenueData {
  period: number;
  revenue: {
    total: number;
    tradeFees: number;
    withdrawalFees: number;
    byDay: Record<string, number>;
    recentEvents: any[];
  };
  transactions: {
    summary: {
      totalDeposits: number;
      totalTradeBuys: number;
      totalTradeSells: number;
      totalPayouts: number;
      totalFees: number;
      count: number;
    };
    recent: any[];
  };
  users: {
    total: number;
    activeTraders: number;
    totalUsersBalance: number;
    totalDeposited: number;
    totalWithdrawn: number;
  };
  markets: {
    total: number;
    open: number;
    totalPoolValue: number;
  };
  topTraders: any[];
}

function formatMoney(amount: number) {
  return `₦${Math.abs(amount).toLocaleString()}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-NG', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export default function AdminDashboard() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'traders'>('overview');
  const [adminEmail, setAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/revenue?period=${period}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Access denied');
        return;
      }
      setData(json);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddAdmin = async () => {
    if (!adminEmail) return;
    setAddingAdmin(true);
    try {
      const res = await fetch('/api/admin/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_admin', email: adminEmail })
      });
      const json = await res.json();
      alert(res.ok ? json.message : json.error);
      if (res.ok) setAdminEmail('');
    } catch { alert('Failed'); } finally { setAddingAdmin(false); }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/10 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-red-500/30 text-center max-w-md">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <Link href="/predictions" className="text-green-400 hover:text-green-300 text-sm">Back to Markets</Link>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/10 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/10 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-xs text-slate-400">Revenue &amp; Transaction Monitoring</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                className="bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
              <button onClick={fetchData} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500">
                Refresh
              </button>
              <Link href="/predictions" className="px-3 py-1.5 text-slate-300 bg-slate-800 rounded-lg text-sm hover:bg-slate-700">
                Markets
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Revenue Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl p-5 border border-green-500/30">
            <p className="text-xs text-slate-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-green-400">{formatMoney(data.revenue.total)}</p>
            <p className="text-xs text-slate-500 mt-1">Last {data.period} days</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl p-5 border border-blue-500/30">
            <p className="text-xs text-slate-400 mb-1">Trade Fees</p>
            <p className="text-2xl font-bold text-blue-400">{formatMoney(data.revenue.tradeFees)}</p>
            <p className="text-xs text-slate-500 mt-1">2% per trade</p>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl p-5 border border-green-500/30">
            <p className="text-xs text-slate-400 mb-1">Withdrawal Fees</p>
            <p className="text-2xl font-bold text-green-400">{formatMoney(data.revenue.withdrawalFees)}</p>
            <p className="text-xs text-slate-500 mt-1">1.5% per payout</p>
          </div>
          <div className="bg-gradient-to-br from-orange-600/20 to-amber-600/20 rounded-2xl p-5 border border-orange-500/30">
            <p className="text-xs text-slate-400 mb-1">Trading Volume</p>
            <p className="text-2xl font-bold text-orange-400">
              {formatMoney(data.transactions.summary.totalTradeBuys + data.transactions.summary.totalTradeSells)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{data.transactions.summary.count} transactions</p>
          </div>
        </div>

        {/* Platform Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
            <p className="text-xl font-bold text-white">{data.users.total}</p>
            <p className="text-xs text-slate-400">Total Users</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
            <p className="text-xl font-bold text-green-400">{data.users.activeTraders}</p>
            <p className="text-xs text-slate-400">Active Traders</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
            <p className="text-xl font-bold text-blue-400">{formatMoney(data.users.totalDeposited)}</p>
            <p className="text-xs text-slate-400">Total Deposited</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
            <p className="text-xl font-bold text-red-400">{formatMoney(data.users.totalWithdrawn)}</p>
            <p className="text-xs text-slate-400">Total Withdrawn</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
            <p className="text-xl font-bold text-yellow-400">{data.markets.open}/{data.markets.total}</p>
            <p className="text-xs text-slate-400">Open Markets</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-slate-700/50 pb-2">
          {(['overview', 'transactions', 'traders'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-slate-800 text-white border-b-2 border-green-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'overview' ? '📊 Revenue Overview' : tab === 'transactions' ? '💸 All Transactions' : '🏆 Top Traders'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Daily Revenue Chart */}
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="font-bold text-white mb-4">Daily Revenue</h3>
              {Object.keys(data.revenue.byDay).length === 0 ? (
                <p className="text-slate-400 text-sm">No revenue recorded yet. Revenue comes from trade fees (2%) and withdrawal fees (1.5%).</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data.revenue.byDay)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .slice(0, 14)
                    .map(([day, amount]) => {
                      const maxAmount = Math.max(...Object.values(data.revenue.byDay));
                      const width = maxAmount > 0 ? (amount / maxAmount * 100) : 0;
                      return (
                        <div key={day} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-20">{day.slice(5)}</span>
                          <div className="flex-1 h-6 bg-slate-700/30 rounded overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded flex items-center px-2"
                              style={{ width: `${Math.max(2, width)}%` }}
                            >
                              <span className="text-xs text-white font-bold whitespace-nowrap">
                                {formatMoney(amount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Recent Revenue Events */}
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="font-bold text-white mb-4">Recent Revenue Events</h3>
              {(data.revenue.recentEvents || []).length === 0 ? (
                <p className="text-slate-400 text-sm">No revenue events yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.revenue.recentEvents.map((e: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/30">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                          e.type === 'trade_fee' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {e.type === 'trade_fee' ? 'Trade Fee' : 'Withdrawal Fee'}
                        </span>
                        <span className="text-sm text-slate-300">{e.description}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">+{formatMoney(e.amount)}</p>
                        <p className="text-xs text-slate-500">{formatDate(e.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Management */}
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="font-bold text-white mb-4">Admin Management</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="user@email.com"
                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                />
                <button
                  onClick={handleAddAdmin}
                  disabled={addingAdmin || !adminEmail}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500 disabled:opacity-50"
                >
                  {addingAdmin ? 'Adding...' : 'Add Admin'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Add admins by email. They can view this dashboard and manage settings.</p>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700/50">
              <div className="col-span-2">Type</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2 text-right">Fee</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2 text-right">Time</div>
            </div>
            {(data.transactions.recent || []).length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No transactions recorded yet.</div>
            ) : (
              data.transactions.recent.map((tx: any, i: number) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-700/30 hover:bg-slate-700/20 text-sm">
                  <div className="col-span-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      tx.type === 'crypto_deposit' ? 'bg-green-500/20 text-green-400' :
                      tx.type === 'trade_buy' ? 'bg-blue-500/20 text-blue-400' :
                      tx.type === 'trade_sell' ? 'bg-cyan-500/20 text-cyan-400' :
                      tx.type === 'bank_payout' ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {tx.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="col-span-2 text-right font-mono">
                    <span className={
                      tx.type.includes('deposit') || tx.type === 'trade_sell'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }>
                      {tx.type.includes('deposit') || tx.type === 'trade_sell' ? '+' : '-'}
                      {formatMoney(tx.amount)}
                    </span>
                  </div>
                  <div className="col-span-2 text-right font-mono text-yellow-400">
                    {tx.fee > 0 ? formatMoney(tx.fee) : '-'}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`text-xs ${
                      tx.status === 'completed' ? 'text-green-400' :
                      tx.status === 'pending' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {tx.status === 'completed' ? '✓' : tx.status}
                    </span>
                  </div>
                  <div className="col-span-3 text-slate-300 truncate text-xs">{tx.description}</div>
                  <div className="col-span-2 text-right text-xs text-slate-500">{formatDate(tx.created_at)}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Top Traders Tab */}
        {activeTab === 'traders' && (
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700/50">
              <div className="col-span-1">#</div>
              <div className="col-span-2">Trader</div>
              <div className="col-span-2 text-right">Deposited</div>
              <div className="col-span-2 text-right">Balance</div>
              <div className="col-span-1 text-right">Trades</div>
              <div className="col-span-1 text-right">Wins</div>
              <div className="col-span-1 text-right">Withdrawn</div>
              <div className="col-span-2 text-right">XP</div>
            </div>
            {(data.topTraders || []).map((t: any, i: number) => (
              <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-700/30 hover:bg-slate-700/20 text-sm">
                <div className="col-span-1 text-slate-400 font-mono">{i + 1}</div>
                <div className="col-span-2 text-white font-medium truncate">{t.displayName}</div>
                <div className="col-span-2 text-right text-green-400">{formatMoney(t.deposited)}</div>
                <div className="col-span-2 text-right text-blue-400">{formatMoney(t.balance)}</div>
                <div className="col-span-1 text-right text-slate-300">{t.trades}</div>
                <div className="col-span-1 text-right text-emerald-400">{t.wins}</div>
                <div className="col-span-1 text-right text-red-400">{formatMoney(t.withdrawn)}</div>
                <div className="col-span-2 text-right text-green-400">{(t.xp || 0).toLocaleString()}</div>
              </div>
            ))}
            {(data.topTraders || []).length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No traders yet.</div>
            )}
          </div>
        )}

        {/* Platform Money Flow */}
        <div className="mt-6 bg-gradient-to-br from-slate-800/50 to-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="font-bold text-white mb-4">💰 Platform Money Flow</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl mb-2">📥</p>
              <p className="text-lg font-bold text-green-400">{formatMoney(data.users.totalDeposited)}</p>
              <p className="text-xs text-slate-400">Total Deposits</p>
            </div>
            <div className="text-center">
              <p className="text-3xl mb-2">🏛️</p>
              <p className="text-lg font-bold text-blue-400">{formatMoney(data.markets.totalPoolValue)}</p>
              <p className="text-xs text-slate-400">In Market Pools</p>
            </div>
            <div className="text-center">
              <p className="text-3xl mb-2">📤</p>
              <p className="text-lg font-bold text-red-400">{formatMoney(data.users.totalWithdrawn)}</p>
              <p className="text-xs text-slate-400">Total Payouts</p>
            </div>
            <div className="text-center">
              <p className="text-3xl mb-2">🏆</p>
              <p className="text-lg font-bold text-green-400">{formatMoney(data.revenue.total)}</p>
              <p className="text-xs text-slate-400">Platform Revenue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

