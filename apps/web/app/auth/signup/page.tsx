'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const SPECIALIZATIONS = [
  'Criminal Law',
  'Corporate Law',
  'Family Law',
  'Constitutional Law',
  'Property Law',
  'Labour Law',
  'Tax Law',
  'Banking & Finance',
  'Oil & Gas',
  'Intellectual Property',
  'Human Rights',
  'Maritime Law',
  'Environmental Law',
  'Immigration Law',
  'Litigation',
]

export default function SignupPage() {
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    userType: 'client',
    // Lawyer-specific fields
    barNumber: '',
    specializations: [] as string[],
    hourlyRate: '',
    bio: '',
    yearsOfExperience: '',
    lawFirm: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  // Check URL params for lawyer type
  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'lawyer') {
      setFormData(prev => ({ ...prev, userType: 'lawyer' }))
    }
  }, [searchParams])

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    // Validate lawyer fields
    if (formData.userType === 'lawyer') {
      if (!formData.barNumber) {
        setError('Bar number is required for lawyers')
        setLoading(false)
        return
      }
      if (formData.specializations.length === 0) {
        setError('Please select at least one specialization')
        setLoading(false)
        return
      }
      if (!formData.hourlyRate) {
        setError('Hourly rate is required')
        setLoading(false)
        return
      }
    }

    const { error, user } = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      formData.userType
    )

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // If lawyer, create lawyer profile
      if (formData.userType === 'lawyer' && user) {
        try {
          const res = await fetch('/api/lawyers/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              bar_number: formData.barNumber,
              specializations: formData.specializations,
              hourly_rate: parseFloat(formData.hourlyRate),
              bio: formData.bio,
              years_of_experience: parseInt(formData.yearsOfExperience) || 0,
              law_firm: formData.lawFirm,
            })
          })
          if (!res.ok) {
            console.error('Failed to create lawyer profile')
          }
        } catch (err) {
          console.error('Error creating lawyer profile:', err)
        }
      }
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-gray-400 mb-6">
              We've sent a confirmation link to <strong className="text-white">{formData.email}</strong>. 
              Click the link to verify your account.
            </p>
            <Link 
              href="/auth/login"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold">
              <span className="text-white">CaseWin</span>
              <span className="text-green-500"> AI</span>
            </h1>
          </Link>
          <p className="text-gray-400 mt-2">Create your account to get started.</p>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'client', label: '👤 Client' },
                  { value: 'lawyer', label: '👨‍⚖️ Lawyer' },
                  { value: 'law_firm', label: '🏢 Law Firm' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, userType: type.value })}
                    className={`py-3 rounded-lg text-sm font-medium transition ${
                      formData.userType === type.value
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                placeholder="••••••••"
              />
            </div>

            {/* Lawyer-specific fields */}
            {formData.userType === 'lawyer' && (
              <div className="space-y-5 pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>⚖️</span> Professional Information
                </h3>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Bar Number (NBA) *</label>
                  <input
                    type="text"
                    value={formData.barNumber}
                    onChange={(e) => setFormData({ ...formData, barNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                    placeholder="SCN/12345/2020"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                    placeholder="5"
                    min="0"
                    max="60"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Law Firm (Optional)</label>
                  <input
                    type="text"
                    value={formData.lawFirm}
                    onChange={(e) => setFormData({ ...formData, lawFirm: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                    placeholder="ABC Chambers & Co."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Hourly Rate (₦) *</label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                    placeholder="25000"
                    min="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Specializations * (Select at least one)</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-gray-700/50 rounded-lg">
                    {SPECIALIZATIONS.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={`px-3 py-1.5 text-xs rounded-full transition ${
                          formData.specializations.includes(spec)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                  {formData.specializations.length > 0 && (
                    <p className="text-xs text-green-400 mt-1">
                      Selected: {formData.specializations.join(', ')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Professional Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 resize-none"
                    placeholder="Tell clients about your experience, notable cases, and expertise..."
                  />
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-400 text-sm">
                  <strong>Note:</strong> Your profile will be reviewed by our team before appearing in the marketplace. You'll be notified once verified.
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm text-gray-400">
              <input type="checkbox" required className="mt-1 rounded border-gray-600 bg-gray-700" />
              <span>
                I agree to the{' '}
                <Link href="/terms" className="text-green-400 hover:text-green-300">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-green-400 hover:text-green-300">Privacy Policy</Link>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-green-400 hover:text-green-300">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
