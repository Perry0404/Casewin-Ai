'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, profile, wallet, loading, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please Log In</h1>
          <p className="text-gray-400 mb-6">You need to be logged in to view your dashboard.</p>
          <Link href="/auth/login" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  const quickActions = [
    { icon: '📝', title: 'Draft Document', href: '/tools/draft', color: 'from-blue-500 to-blue-600' },
    { icon: '🔮', title: 'Predict Case', href: '/tools/predict', color: 'from-purple-500 to-purple-600' },
    { icon: '🔍', title: 'Legal Research', href: '/tools/research', color: 'from-green-500 to-green-600' },
    { icon: '📊', title: 'Analyze Contract', href: '/tools/analyze', color: 'from-orange-500 to-orange-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-white">CaseWin</span>
            <span className="text-green-500"> AI</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link href="/tools" className="text-gray-300 hover:text-white">Tools</Link>
            <Link href="/marketplace" className="text-gray-300 hover:text-white">Marketplace</Link>
            <Link href="/predictions" className="text-gray-300 hover:text-white">Predictions</Link>
            <Link href="/documents" className="text-gray-300 hover:text-white">Documents</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/wallet" className="bg-gray-700 px-4 py-2 rounded-lg text-green-400 font-medium">
              ₦{wallet?.balance?.toLocaleString() || '0'}
            </Link>
            <Link href="/profile" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-400 mt-2">Here's what's happening with your legal practice.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Wallet Balance</span>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-white">₦{wallet?.balance?.toLocaleString() || '0'}</p>
            <Link href="/wallet" className="text-green-400 text-sm hover:text-green-300">Add funds →</Link>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Documents</span>
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
            <Link href="/documents" className="text-green-400 text-sm hover:text-green-300">View all →</Link>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Active Bets</span>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
            <Link href="/predictions" className="text-green-400 text-sm hover:text-green-300">Place bet →</Link>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Account Type</span>
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-2xl font-bold text-white capitalize">{profile?.user_type || 'Client'}</p>
            <Link href="/profile" className="text-green-400 text-sm hover:text-green-300">Edit profile →</Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`bg-gradient-to-r ${action.color} rounded-xl p-6 hover:opacity-90 transition`}
              >
                <span className="text-3xl">{action.icon}</span>
                <h3 className="text-lg font-semibold text-white mt-3">{action.title}</h3>
              </Link>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📋</div>
                <p>No recent activity yet</p>
                <p className="text-sm text-gray-500">Start using AI tools to see your history</p>
              </div>
            </div>
          </div>

          {/* Featured Markets */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Prediction Markets</h2>
              <Link href="/predictions" className="text-green-400 text-sm hover:text-green-300">View all →</Link>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-white font-medium mb-1">FRN v. Kalu (2026)</p>
                <p className="text-gray-400 text-sm mb-2">Supreme Court Appeal</p>
                <div className="flex justify-between items-center">
                  <span className="text-green-400 text-sm">Pool: ₦2.4M</span>
                  <Link href="/predictions" className="text-green-400 hover:text-green-300 text-sm">
                    Place Bet →
                  </Link>
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-white font-medium mb-1">EFCC v. Mompha</p>
                <p className="text-gray-400 text-sm mb-2">Federal High Court</p>
                <div className="flex justify-between items-center">
                  <span className="text-green-400 text-sm">Pool: ₦1.8M</span>
                  <Link href="/predictions" className="text-green-400 hover:text-green-300 text-sm">
                    Place Bet →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Tools Grid */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">All AI Tools</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: '📝', title: 'Draft Documents', href: '/tools/draft' },
              { icon: '🔮', title: 'Case Prediction', href: '/tools/predict' },
              { icon: '🔍', title: 'Legal Research', href: '/tools/research' },
              { icon: '📊', title: 'Contract Analysis', href: '/tools/analyze' },
              { icon: '📋', title: 'Summarize Judgments', href: '/tools/summarize' },
              { icon: '🌍', title: 'Translate Documents', href: '/tools/translate' },
              { icon: '⚖️', title: 'Generate Arguments', href: '/tools/arguments' },
              { icon: '✅', title: 'Compliance Check', href: '/tools/compliance' },
            ].map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-green-500 transition"
              >
                <span className="text-2xl">{tool.icon}</span>
                <h3 className="text-white font-medium mt-2">{tool.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
