'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SPECIALIZATIONS = [
  'Corporate Law', 'Criminal Law', 'Family Law', 'Land Law', 'Property Law',
  'Labour Law', 'Employment Law', 'Electoral Law', 'Constitutional Law',
  'Human Rights', 'Oil & Gas', 'Maritime Law', 'Arbitration', 'Tax Law',
  'Banking & Finance', 'Intellectual Property', 'Cybercrime', 'Data Protection',
  'Commercial Litigation', 'Administrative Law', 'Insurance Law', 'Pension Law',
  'Real Estate', 'Environmental Law', 'Immigration Law', 'International Trade'
]

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

export default function LawyerRegisterPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    bar_number: '',
    years_of_experience: '',
    specializations: [] as string[],
    hourly_rate: '',
    consultation_fee: '',
    location: '',
    state: '',
    bio: '',
    languages: ['English'],
  })

  const toggleSpec = (spec: string) => {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(spec)
        ? f.specializations.filter(s => s !== spec)
        : f.specializations.length < 6 ? [...f.specializations, spec] : f.specializations
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.specializations.length === 0) {
      setError('Select at least one specialization.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/lawyers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || null,
          full_name: form.full_name,
          email: form.email || user?.email,
          phone: form.phone,
          bar_number: form.bar_number,
          years_of_experience: parseInt(form.years_of_experience) || 0,
          specializations: form.specializations,
          hourly_rate: parseInt(form.hourly_rate) || 0,
          consultation_fee: parseInt(form.consultation_fee) || 0,
          location: form.location,
          state: form.state,
          bio: form.bio,
          languages: form.languages,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
          <p className="text-gray-400 mb-6">
            Your lawyer profile has been submitted for verification. Our team will review your credentials and notify you once verified.
          </p>
          <p className="text-gray-500 text-sm mb-6">Verification typically takes 1-3 business days.</p>
          <Link href="/marketplace" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-block">
            Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-3xl font-bold">
              <span className="text-white">CaseWin</span>
              <span className="text-green-500"> AI</span>
            </h1>
          </Link>
          <h2 className="text-2xl font-bold text-white">Register as a Lawyer</h2>
          <p className="text-gray-400 mt-2">Join Nigeria&apos;s premier AI-powered legal marketplace</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">{error}</div>
            )}

            {!user && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-400 text-sm">
                <Link href="/auth/signup" className="text-yellow-300 underline">Create an account</Link> first for a better experience. You can still register below.
              </div>
            )}

            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
                <input type="text" required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="Barrister John Doe" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email *</label>
                <input type="email" required value={form.email || user?.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone Number *</label>
                <input type="tel" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="+234 801 234 5678" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Supreme Court Enrollment Number *</label>
                <input type="text" required value={form.bar_number} onChange={e => setForm(f => ({ ...f, bar_number: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="SCN/XXXX/XXXX" />
              </div>
            </div>

            {/* Professional Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Years of Experience *</label>
                <input type="number" required min="1" max="60" value={form.years_of_experience} onChange={e => setForm(f => ({ ...f, years_of_experience: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Hourly Rate (₦) *</label>
                <input type="number" required min="5000" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="50000" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Consultation Fee (₦)</label>
                <input type="number" min="0" value={form.consultation_fee} onChange={e => setForm(f => ({ ...f, consultation_fee: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="20000" />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">State *</label>
                <select required value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500">
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Office Location</label>
                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="Victoria Island, Lagos" />
              </div>
            </div>

            {/* Specializations */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Specializations * (select up to 6)</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map(spec => (
                  <button key={spec} type="button" onClick={() => toggleSpec(spec)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      form.specializations.includes(spec)
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}>
                    {spec}
                  </button>
                ))}
              </div>
              {form.specializations.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">{form.specializations.length}/6 selected</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Professional Bio</label>
              <textarea rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500 resize-none"
                placeholder="Describe your legal experience, notable cases, and areas of expertise..." />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition">
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>

            <p className="text-gray-500 text-xs text-center">
              By registering, you agree to our <Link href="/terms" className="text-green-400">Terms</Link> and <Link href="/privacy" className="text-green-400">Privacy Policy</Link>.
              Your profile will be verified before appearing in the marketplace.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
