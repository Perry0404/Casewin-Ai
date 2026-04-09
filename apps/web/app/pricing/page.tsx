'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  priceNGN: number
  priceUSD: number
  interval: string
  features: string[]
  toolLimit: number
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [isLoading, setIsLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [showNGN, setShowNGN] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const userId = localStorage.getItem('casewin_user_id') || ''
      const res = await fetch(`/api/subscription?userId=${userId}`)
      const data = await res.json()
      if (data.plans) setPlans(data.plans)
      if (data.subscription?.plan) setCurrentPlan(data.subscription.plan)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId)
    try {
      const userId = localStorage.getItem('casewin_user_id') || `user_${Date.now()}`
      const userEmail = localStorage.getItem('casewin_user_email') || ''

      localStorage.setItem('casewin_user_id', userId)

      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail, plan: planId }),
      })

      const data = await res.json()
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        alert(data.error || 'Failed to initialize payment')
      }
    } catch (err) {
      console.error(err)
      alert('Network error')
    } finally {
      setSubscribing(null)
    }
  }

  const planOrder = ['free', 'individual', 'firm']
  const sortedPlans = plans.sort((a, b) => planOrder.indexOf(a.id) - planOrder.indexOf(b.id))

  const planHighlights: Record<string, { color: string; badge?: string }> = {
    free: { color: 'border-gray-600' },
    individual: { color: 'border-green-500', badge: 'Most Popular' },
    firm: { color: 'border-purple-500', badge: 'Best Value' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">{'\u2696\uFE0F'}</span>
              <span className="text-xl font-bold text-white">CaseWin AI</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/tools" className="text-gray-300 hover:text-white transition">Tools</Link>
              <Link href="/auth/login" className="text-gray-300 hover:text-white transition">Sign In</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Free Tools. Premium Automation.
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-3">
          All AI legal tools are free for everyone — students, lawyers, firms.
        </p>
        <p className="text-lg text-green-400 max-w-2xl mx-auto mb-8">
          Subscribe for premium automation: Daily Intelligence Brief, Firm Knowledge Agent & more.
        </p>

        {/* Currency Toggle */}
        <div className="inline-flex items-center bg-gray-800/50 rounded-full p-1 border border-gray-700">
          <button
            onClick={() => setShowNGN(true)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              showNGN ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {'\u20A6'} NGN
          </button>
          <button
            onClick={() => setShowNGN(false)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              !showNGN ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            $ USD
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading plans...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sortedPlans.map(plan => {
              const highlight = planHighlights[plan.id] || { color: 'border-gray-600' }
              const isCurrent = currentPlan === plan.id
              const price = showNGN ? plan.priceNGN : plan.priceUSD
              const currency = showNGN ? '\u20A6' : '$'

              return (
                <div
                  key={plan.id}
                  className={`relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border-2 ${highlight.color} ${
                    plan.id === 'individual' ? 'md:scale-105 md:-mt-4' : ''
                  }`}
                >
                  {highlight.badge && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className={`${
                        plan.id === 'individual' ? 'bg-green-600' : 'bg-purple-600'
                      } text-white text-xs font-bold px-4 py-1.5 rounded-full`}>
                        {highlight.badge}
                      </span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>

                  <div className="mb-6">
                    {price === 0 ? (
                      <div className="text-4xl font-bold text-white">Free</div>
                    ) : (
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-white">
                          {currency}{price.toLocaleString()}
                        </span>
                        <span className="text-gray-400 ml-2">/{plan.interval}</span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start space-x-3 text-gray-300">
                        <span className="text-green-400 mt-0.5">{'\u2713'}</span>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full bg-gray-700 text-gray-400 py-3 rounded-xl font-semibold cursor-default"
                    >
                      Current Plan
                    </button>
                  ) : plan.id === 'free' ? (
                    <Link
                      href="/tools"
                      className="block w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold text-center transition"
                    >
                      Get Started
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={!!subscribing}
                      className={`w-full py-3 rounded-xl font-semibold transition ${
                        plan.id === 'individual'
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                      } disabled:opacity-50`}
                    >
                      {subscribing === plan.id ? 'Redirecting...' : `Subscribe Now`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Which tools are free?',
                a: 'All 18 AI legal tools are free for everyone — research, drafting, contract analysis, predictions, case manager, chatbot, and more. No account needed for basic use.',
              },
              {
                q: 'What do I get with a subscription?',
                a: 'Premium automation tools for lawyers & firms: Daily Intelligence Brief (personalized legal news), Firm Knowledge Agent (upload & search your firm documents), unlimited AI queries, and priority processing.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.',
              },
              {
                q: 'How do payments work?',
                a: 'We accept Nigerian bank transfers, cards, and USSD payments through our secure payment partner. All transactions are in Naira.',
              },
              {
                q: 'Can I add more users to the Firm plan?',
                a: 'The Firm plan includes up to 10 seats. Contact us for custom enterprise pricing for larger teams.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-gray-800/30 rounded-xl p-5 border border-gray-700/50">
                <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
