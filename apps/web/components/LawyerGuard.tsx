'use client'

import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'

interface LawyerGuardProps {
  children: ReactNode
}

interface Profile {
  user_type?: string
}

export default function LawyerGuard({ children }: LawyerGuardProps) {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hasVerifiedProfile, setHasVerifiedProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (!user) { setProfileLoading(false); return }
    const supabase = createClient()
    ;(async () => {
      // Source of truth for "verified lawyer" is lawyer_profiles.is_verified —
      // the same thing the marketplace uses. We grant tool access from that
      // directly, so a missed profiles.user_type sync can't lock a verified
      // lawyer out. Match by user_id, or by email as a fallback.
      let lpQuery = supabase.from('lawyer_profiles').select('id').eq('is_verified', true)
      lpQuery = user.email
        ? lpQuery.or(`user_id.eq.${user.id},email.eq.${user.email}`)
        : lpQuery.eq('user_id', user.id)

      const [{ data: profileData }, { data: lpData }] = await Promise.all([
        supabase.from('profiles').select('user_type').eq('id', user.id).single(),
        lpQuery.limit(1),
      ])

      if (profileData) setProfile(profileData)
      setHasVerifiedProfile(Array.isArray(lpData) && lpData.length > 0)
      setProfileLoading(false)
    })()
  }, [user])

  const userType = profile?.user_type
  const isLawyerType = userType === 'lawyer' || userType === 'law_firm'
  const hasAccess = isLawyerType || hasVerifiedProfile
  const isPending = !hasAccess && userType === 'lawyer_pending'

  // Still loading auth state
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 text-sm mb-6">
            Law Firm Automation tools are available to registered lawyers and law firms. Please sign in to continue.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/auth/login" className="w-full py-3 bg-green-700 text-white font-semibold rounded-xl hover:bg-green-800 transition-colors text-center">
              Sign In
            </Link>
            <Link href="/auth/signup?type=lawyer" className="w-full py-3 border-2 border-green-700 text-green-700 font-semibold rounded-xl hover:bg-green-50 transition-colors text-center">
              Register as Lawyer / Law Firm
            </Link>
            <Link href="/marketplace" className="text-sm text-gray-500 hover:text-gray-700 mt-2">
              ← Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Logged in but not a verified lawyer/law_firm
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className={`w-16 h-16 ${isPending ? 'bg-yellow-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <span className="text-3xl">{isPending ? '⏳' : '⚖️'}</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isPending ? 'Verification Pending' : 'Lawyers & Law Firms Only'}
          </h2>
          <p className="text-gray-600 text-sm mb-2">
            {isPending
              ? 'Your lawyer application is under review. Admin will verify your credentials and grant you access.'
              : 'Law Firm Automation tools are exclusively available to registered legal practitioners and law firms.'}
          </p>
          {!isPending && (
            <p className="text-gray-500 text-xs mb-6">
              You are signed in as a <span className="font-semibold text-gray-700">Client</span>. If you are a lawyer, please register with your professional credentials.
            </p>
          )}
          {isPending && (
            <p className="text-gray-500 text-xs mb-6">
              This usually takes 1-2 business days. You will be able to access lawyer tools once verified.
            </p>
          )}
          <div className="flex flex-col gap-3">
            {!isPending && (
              <>
                <Link href="/marketplace" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-center">
                  Browse Marketplace
                </Link>
                <Link href="/auth/signup?type=lawyer" className="w-full py-3 border-2 border-green-700 text-green-700 font-semibold rounded-xl hover:bg-green-50 transition-colors text-center">
                  Register as Lawyer / Law Firm
                </Link>
              </>
            )}
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mt-2">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // User is a verified lawyer or law_firm — grant access
  return <>{children}</>
}
