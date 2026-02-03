'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Lawyer {
  id: string
  user_id: string
  full_name: string
  email: string
  bio: string
  location: string
  avatar_url: string
  bar_number: string
  years_of_experience: number
  specializations: string[]
  hourly_rate: number
  consultation_fee: number
  rating: number
  total_reviews: number
  is_verified: boolean
}

export default function MarketplacePage() {
  const { user } = useAuth()
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bookingModal, setBookingModal] = useState<Lawyer | null>(null)

  const specialties = [
    'Corporate Law', 'Criminal Defense', 'Family Law', 'Property Law', 
    'Human Rights', 'Labour Law', 'Tax Law', 'Immigration Law'
  ]

  const locations = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Enugu', 'Ibadan']

  useEffect(() => {
    fetchLawyers()
  }, [selectedSpecialty, selectedLocation])

  const fetchLawyers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedSpecialty !== 'all') params.append('specialty', selectedSpecialty)
      if (selectedLocation !== 'all') params.append('location', selectedLocation)
      
      const response = await fetch(`/api/marketplace/lawyers?${params}`)
      const data = await response.json()
      setLawyers(data.lawyers || [])
    } catch (error) {
      console.error('Error fetching lawyers:', error)
      setLawyers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredLawyers = lawyers.filter(lawyer => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      lawyer.full_name?.toLowerCase().includes(query) ||
      lawyer.specializations?.some(s => s.toLowerCase().includes(query)) ||
      lawyer.location?.toLowerCase().includes(query)
    )
  })

  const handleBooking = async (lawyer: Lawyer, bookingType: string) => {
    if (!user) {
      alert('Please log in to book a consultation')
      return
    }

    try {
      const response = await fetch('/api/marketplace/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lawyer_id: lawyer.user_id,
          client_id: user.id,
          booking_type: bookingType,
          amount: lawyer.consultation_fee || lawyer.hourly_rate,
          scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert('Booking request sent! The lawyer will confirm shortly.')
        setBookingModal(null)
      } else {
        alert(data.error || 'Failed to book')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('Failed to book. Please try again.')
    }
  }

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-3xl">⚖️</span>
              <div>
                <h1 className="text-2xl font-bold text-white">CaseWin <span className="text-green-500">AI</span></h1>
                <p className="text-xs text-gray-400">Lawyer Marketplace</p>
              </div>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/tools" className="text-gray-300 hover:text-white">AI Tools</Link>
              <Link href="/marketplace" className="text-green-400 font-semibold">Hire Lawyers</Link>
              <Link href="/predictions" className="text-gray-300 hover:text-white">Predictions</Link>
              {user ? (
                <Link href="/dashboard" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Dashboard
                </Link>
              ) : (
                <Link href="/auth/login" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold">
            🇳🇬 VERIFIED NIGERIAN LAWYERS
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-6 mb-4">
            Find & Hire Top Nigerian Lawyers
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Connect with verified legal professionals across Nigeria. Book consultations, get legal advice, and hire representation.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by name, specialty, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              />
            </div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
            >
              <option value="all">All Specialties</option>
              {specialties.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
            >
              <option value="all">All Locations</option>
              {locations.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            {loading ? 'Loading...' : `${filteredLawyers.length} lawyers found`}
          </p>
          <Link 
            href="/auth/signup?type=lawyer" 
            className="text-green-400 hover:text-green-300 text-sm"
          >
            Are you a lawyer? Join our marketplace →
          </Link>
        </div>

        {/* Lawyers Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading lawyers...</p>
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
            <div className="text-6xl mb-4">👨‍⚖️</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Lawyers Found</h3>
            <p className="text-gray-400 mb-6">
              {lawyers.length === 0 
                ? "No lawyers have registered yet. Be the first!" 
                : "No lawyers match your search criteria."}
            </p>
            <Link 
              href="/auth/signup?type=lawyer"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Register as a Lawyer
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLawyers.map(lawyer => (
              <div key={lawyer.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-green-500 transition-all">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-2xl text-white font-bold">
                      {lawyer.full_name?.charAt(0) || '👤'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{lawyer.full_name || 'Anonymous Lawyer'}</h3>
                        {lawyer.is_verified && (
                          <span className="text-green-400" title="Verified">✓</span>
                        )}
                      </div>
                      <p className="text-green-400 text-sm">
                        {lawyer.specializations?.join(', ') || 'General Practice'}
                      </p>
                      <p className="text-gray-400 text-sm">📍 {lawyer.location || 'Nigeria'}</p>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {lawyer.bio || 'Experienced legal professional ready to help with your case.'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-gray-700/50 rounded-lg p-2">
                      <div className="text-white font-bold">{lawyer.years_of_experience || 0}</div>
                      <div className="text-gray-400 text-xs">Years</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-2">
                      <div className="text-yellow-400 font-bold">⭐ {lawyer.rating?.toFixed(1) || '0.0'}</div>
                      <div className="text-gray-400 text-xs">{lawyer.total_reviews || 0} reviews</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-2">
                      <div className="text-green-400 font-bold">₦{((lawyer.hourly_rate || 0) / 1000).toFixed(0)}K</div>
                      <div className="text-gray-400 text-xs">/hour</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setBookingModal(lawyer)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
                    >
                      Book Consultation
                    </button>
                    <Link
                      href={`/marketplace/lawyer/${lawyer.user_id}`}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Become a Lawyer CTA */}
        <div className="mt-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Are You a Nigerian Lawyer?</h2>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Join CaseWin's marketplace and connect with clients across Nigeria. 
            Get paid for consultations, case reviews, and legal representation.
          </p>
          <Link
            href="/auth/signup?type=lawyer"
            className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100"
          >
            Register as a Lawyer →
          </Link>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Book Consultation</h3>
                <p className="text-gray-400">{bookingModal.full_name}</p>
              </div>
              <button onClick={() => setBookingModal(null)} className="text-gray-400 hover:text-white text-2xl">
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleBooking(bookingModal, 'consultation')}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold"
              >
                💬 Quick Consultation - ₦{(bookingModal.consultation_fee || bookingModal.hourly_rate || 10000).toLocaleString()}
              </button>
              <button
                onClick={() => handleBooking(bookingModal, 'case_review')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                📋 Case Review - ₦{((bookingModal.hourly_rate || 15000) * 2).toLocaleString()}
              </button>
              <button
                onClick={() => handleBooking(bookingModal, 'document_review')}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold"
              >
                📄 Document Review - ₦{(bookingModal.hourly_rate || 15000).toLocaleString()}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Secure payment via Korapay • Cancel anytime before confirmation
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
