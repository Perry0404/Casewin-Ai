'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Lawyer {
  id: string;
  full_name: string;
  specialization: string;
  location: string;
  hourly_rate: number;
  years_of_experience: number;
  rating: number;
  total_reviews: number;
  bio: string;
  bar_enrollment_number: string;
  education: string;
  languages: string[];
  courts_of_practice: string[];
}

interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function LawyerProfilePage() {
  const params = useParams();
  const lawyerId = params.id as string;

  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Navigation component
  const Navigation = () => (
    <nav className="flex gap-6">
      <Link href="/" className="text-white hover:text-green-200 transition-colors font-semibold">
        AI Tools
      </Link>
      <Link href="/marketplace" className="text-white hover:text-green-200 transition-colors font-semibold">
        Hire Lawyers
      </Link>
      <Link href="/dashboard" className="text-white hover:text-green-200 transition-colors font-semibold">
        Dashboard
      </Link>
    </nav>
  );

  // Booking form
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [caseDescription, setCaseDescription] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (lawyerId) {
      fetchLawyerProfile();
    }
  }, [lawyerId]);

  const fetchLawyerProfile = async () => {
    try {
      const response = await fetch(`/api/marketplace/lawyers?id=${lawyerId}`);
      const data = await response.json();
      
      if (data.success && data.lawyers.length > 0) {
        setLawyer(data.lawyers[0]);
        // Reviews will be loaded from Supabase when available
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching lawyer:', error);
    } finally {
      setLoading(false);
    }
  };

  const [consultationType, setConsultationType] = useState<'video' | 'in-person'>('video');
  const [bookingSuccess, setBookingSuccess] = useState<{ roomId: string } | null>(null);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);

    // Generate a unique meeting room ID
    const meetingRoomId = `cw-${lawyerId?.substring(0, 6)}-${Date.now().toString(36)}`;

    try {
      const response = await fetch('/api/marketplace/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lawyer_id: lawyerId,
          booking_date: bookingDate,
          booking_time: bookingTime,
          duration_hours: duration,
          case_description: caseDescription,
          total_amount: lawyer!.hourly_rate * duration,
          consultation_type: consultationType,
          meeting_room_id: meetingRoomId,
        })
      });

      const data = await response.json();

      if (data.success) {
        if (consultationType === 'video') {
          setBookingSuccess({ roomId: meetingRoomId });
        } else {
          alert('Booking request sent successfully! The lawyer will contact you shortly.');
          setShowBookingModal(false);
        }
        // Reset form
        setBookingDate('');
        setBookingTime('');
        setDuration(1);
        setCaseDescription('');
      } else {
        alert('Booking failed: ' + data.message);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Lawyer not found</p>
          <Link href="/marketplace" className="mt-4 inline-block text-green-600 hover:text-green-700">
            ← Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  const totalCost = lawyer.hourly_rate * duration;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6 border-b border-green-400">
            <div>
              <h1 className="text-2xl font-bold">⚖️ CaseWin-NG</h1>
            </div>
            <Navigation />
          </div>
          <div className="py-6">
            <Link href="/marketplace" className="text-green-100 hover:text-white inline-flex items-center gap-2">
              ← Back to marketplace
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    {lawyer.full_name.charAt(0)}
                  </div>
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{lawyer.full_name}</h1>
                  <p className="text-xl text-green-600 font-medium mb-3">{lawyer.specialization}</p>
                  
                  <div className="flex items-center gap-6 text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      📍 {lawyer.location}
                    </span>
                    <span className="flex items-center gap-1">
                      ⭐ {lawyer.rating.toFixed(1)} ({lawyer.total_reviews} reviews)
                    </span>
                    <span className="flex items-center gap-1">
                      💼 {lawyer.years_of_experience} years
                    </span>
                  </div>

                  <div className="text-2xl font-bold text-gray-900">
                    ₦{lawyer.hourly_rate.toLocaleString()}/hour
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">{lawyer.bio}</p>
            </div>

            {/* Credentials */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Credentials</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Bar Enrollment</h3>
                  <p className="text-gray-700">{lawyer.bar_enrollment_number}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Education</h3>
                  <p className="text-gray-700">{lawyer.education}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {lawyer.languages.map(lang => (
                      <span key={lang} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Courts of Practice</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {lawyer.courts_of_practice.map(court => (
                      <li key={court}>{court}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Client Reviews</h2>
              
              <div className="space-y-6">
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-semibold text-gray-900">{review.client_name}</div>
                      <div className="flex items-center text-yellow-500">
                        {'⭐'.repeat(review.rating)}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{review.comment}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('en-NG')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Book Consultation</h3>
              
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Hourly Rate:</span>
                  <span className="font-bold text-xl text-green-600">
                    ₦{lawyer.hourly_rate.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Video Call Badge */}
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">Video Consultation Available</p>
                  <p className="text-xs text-green-600">Meet face-to-face in-app. No downloads needed.</p>
                </div>
              </div>

              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow mb-3"
              >
                📅 Schedule Consultation
              </button>

              <button
                onClick={() => {
                  const roomId = `instant-${lawyerId?.substring(0, 6)}-${Date.now().toString(36)}`;
                  window.open(`/consultation/${roomId}`, '_blank');
                }}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                Start Instant Video Call
              </button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Why book with us?</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>In-app video consultations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Verified Nigerian lawyers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Secure payments via ZendFi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Solana escrow protection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>End-to-end encrypted calls</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>24/7 customer support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {bookingSuccess ? '🎉 Booking Confirmed!' : 'Book Consultation'}
                </h3>
                <button
                  onClick={() => { setShowBookingModal(false); setBookingSuccess(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {bookingSuccess ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-600">
                    Your video consultation with <strong>{lawyer.full_name}</strong> has been booked.
                    Join the meeting room when it&apos;s time.
                  </p>
                  <Link
                    href={`/consultation/${bookingSuccess.roomId}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Join Video Meeting Room
                  </Link>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/consultation/${bookingSuccess.roomId}`);
                      alert('Meeting link copied!');
                    }}
                    className="block w-full text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Copy meeting link to share with lawyer
                  </button>
                  <Link
                    href="/dashboard"
                    className="block text-sm text-gray-500 hover:text-gray-700"
                  >
                    Go to Dashboard →
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="space-y-4">
                  {/* Consultation Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consultation Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setConsultationType('video')}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          consultationType === 'video'
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl block mb-1">🎥</span>
                        <span className="text-sm font-medium">Video Call</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConsultationType('in-person')}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          consultationType === 'in-person'
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl block mb-1">🏢</span>
                        <span className="text-sm font-medium">In-Person</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (hours)
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {[1, 2, 3, 4, 5].map(h => (
                        <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Case Description
                    </label>
                    <textarea
                      required
                      value={caseDescription}
                      onChange={(e) => setCaseDescription(e.target.value)}
                      rows={4}
                      placeholder="Briefly describe your legal matter..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">Rate:</span>
                      <span className="font-semibold">₦{lawyer.hourly_rate.toLocaleString()}/hr</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">Duration:</span>
                      <span className="font-semibold">{duration} hour{duration > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">Type:</span>
                      <span className="font-semibold">{consultationType === 'video' ? '🎥 Video Call' : '🏢 In-Person'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        ₦{totalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
                  >
                    {bookingLoading ? 'Processing...' : consultationType === 'video' ? '🎥 Book Video Consultation' : '📅 Confirm Booking'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
