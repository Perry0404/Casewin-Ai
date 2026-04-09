'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SubscriptionGuardProps {
  tool: 'intelligence' | 'knowledge'
  children: React.ReactNode
}

interface Subscription {
  plan: string
  status: string
  expires_at: string
}

export default function SubscriptionGuard({ tool, children }: SubscriptionGuardProps) {
  const { user, loading: authLoading } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setLoading(false)
      setHasAccess(false)
      return
    }

    const checkSubscription = async () => {
      try {
        const res = await fetch(`/api/subscription?userId=${user.id}`)
        const data = await res.json()

        if (data.subscription && data.subscription.status === 'active') {
          setSubscription(data.subscription)

          // Individual plan: intelligence only
          // Firm plan: intelligence + knowledge
          const plan = data.subscription.plan
          if (plan === 'firm') {
            setHasAccess(true)
          } else if (plan === 'individual') {
            setHasAccess(tool === 'intelligence')
          } else {
            setHasAccess(false)
          }
        } else {
          setHasAccess(false)
        }
      } catch {
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [user, authLoading, tool])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Checking subscription...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md text-center border border-gray-700">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-gray-400 mb-6">
            {tool === 'intelligence'
              ? 'Daily Intelligence Brief is a premium automation tool for lawyers.'
              : 'Firm Knowledge Agent is a premium automation tool for law firms.'}
          </p>
          <p className="text-gray-500 text-sm mb-6">Sign in to check your subscription or subscribe.</p>
          <Link
            href="/auth/login"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    const requiredPlan = tool === 'knowledge' ? 'Law Firm' : 'Individual Lawyer'
    const price = tool === 'knowledge' ? '$30/mo (₦48,000)' : '$20/mo (₦32,000)'

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-lg text-center border border-gray-700">
          <div className="text-5xl mb-4">⚡</div>
          <h2 className="text-2xl font-bold text-white mb-2">Premium Automation Tool</h2>
          <p className="text-gray-400 mb-4">
            {tool === 'intelligence'
              ? 'Daily Intelligence Brief delivers AI-curated Nigerian legal updates, regulatory changes, and market insights tailored to your practice areas.'
              : 'Firm Knowledge Agent lets you upload firm documents and query them with AI — build your firm\'s institutional knowledge base.'}
          </p>
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <p className="text-green-400 font-semibold text-lg">{requiredPlan} Plan</p>
            <p className="text-white text-2xl font-bold">{price}</p>
            {subscription && subscription.plan === 'individual' && tool === 'knowledge' && (
              <p className="text-yellow-400 text-sm mt-2">
                You&apos;re on the Individual plan. Upgrade to Law Firm for Knowledge Agent access.
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <Link
              href="/pricing"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              View Plans & Subscribe
            </Link>
            <Link
              href="/tools"
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Back to Tools
            </Link>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            All other AI legal tools remain free for everyone.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
