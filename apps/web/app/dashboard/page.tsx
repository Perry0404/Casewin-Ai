'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Booking {
  id: string;
  lawyer_name: string;
  lawyer_specialization: string;
  booking_date: string;
  booking_time: string;
  duration_hours: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  total_amount: number;
  case_description: string;
  meeting_room_id: string;
}

interface CaseTracker {
  id: string;
  title: string;
  status: 'active' | 'resolved' | 'pending_review';
  lawyer_name: string;
  last_update: string;
  progress: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'cases' | 'meetings'>('overview');

  const [bookings] = useState<Booking[]>([
    {
      id: 'bk-001',
      lawyer_name: 'Barr. Adebayo Ogunlesi',
      lawyer_specialization: 'Corporate Law',
      booking_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      booking_time: '10:00',
      duration_hours: 2,
      status: 'confirmed',
      total_amount: 50000,
      case_description: 'Company incorporation and regulatory compliance review',
      meeting_room_id: 'consult-' + Math.random().toString(36).substring(2, 10),
    },
    {
      id: 'bk-002',
      lawyer_name: 'Barr. Chioma Nwankwo',
      lawyer_specialization: 'Family Law',
      booking_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      booking_time: '14:00',
      duration_hours: 1,
      status: 'pending',
      total_amount: 30000,
      case_description: 'Child custody arrangement consultation',
      meeting_room_id: 'consult-' + Math.random().toString(36).substring(2, 10),
    },
    {
      id: 'bk-003',
      lawyer_name: 'Barr. Ibrahim Yusuf',
      lawyer_specialization: 'Criminal Law',
      booking_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      booking_time: '09:00',
      duration_hours: 1,
      status: 'completed',
      total_amount: 35000,
      case_description: 'Bail application review and strategy',
      meeting_room_id: 'consult-' + Math.random().toString(36).substring(2, 10),
    },
  ]);

  const [cases] = useState<CaseTracker[]>([
    {
      id: 'case-001',
      title: 'Company Incorporation \u2014 TechNova Ltd',
      status: 'active',
      lawyer_name: 'Barr. Adebayo Ogunlesi',
      last_update: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 65,
    },
    {
      id: 'case-002',
      title: 'Child Custody \u2014 Nwankwo vs Nwankwo',
      status: 'pending_review',
      lawyer_name: 'Barr. Chioma Nwankwo',
      last_update: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 30,
    },
    {
      id: 'case-003',
      title: 'Bail Application \u2014 State vs Adamu',
      status: 'resolved',
      lawyer_name: 'Barr. Ibrahim Yusuf',
      last_update: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 100,
    },
  ]);

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const activeCases = cases.filter(c => c.status === 'active' || c.status === 'pending_review');

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    active: 'bg-green-100 text-green-700',
    pending_review: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-blue-100 text-blue-700',
  };

  const Navigation = () => (
    <nav className="flex gap-6">
      <Link href="/" className="text-white hover:text-indigo-200 transition-colors font-semibold">
        AI Tools
      </Link>
      <Link href="/marketplace" className="text-white hover:text-indigo-200 transition-colors font-semibold">
        Hire Lawyers
      </Link>
      <Link href="/predictions" className="text-white hover:text-indigo-200 transition-colors font-semibold">
        Predictions
      </Link>
      <Link href="/dashboard" className="text-white hover:text-indigo-200 transition-colors font-semibold underline">
        Dashboard
      </Link>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6 border-b border-indigo-400">
            <div>
              <h1 className="text-2xl font-bold">{"\u2696\uFE0F"} CaseWin-NG</h1>
            </div>
            <Navigation />
          </div>
          <div className="py-8">
            <h2 className="text-3xl font-bold mb-2">My Dashboard</h2>
            <p className="text-indigo-200">
              Track your consultations, cases, and upcoming video meetings
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">{"\uD83D\uDCC5"}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Upcoming Meetings</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">{"\uD83D\uDCC1"}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Cases</p>
                <p className="text-2xl font-bold text-gray-900">{activeCases.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">{"\u2705"}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedBookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">{"\uD83C\uDFA5"}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Video Calls</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex gap-8">
            {[
              { id: 'overview' as const, label: 'Overview', icon: '\uD83D\uDCCA' },
              { id: 'bookings' as const, label: 'My Bookings', icon: '\uD83D\uDCC5' },
              { id: 'cases' as const, label: 'Case Tracker', icon: '\uD83D\uDCC1' },
              { id: 'meetings' as const, label: 'Video Meetings', icon: '\uD83C\uDFA5' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Next Meeting */}
            {upcomingBookings.length > 0 && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-indigo-200 text-sm font-medium mb-1">NEXT CONSULTATION</p>
                    <h3 className="text-2xl font-bold mb-1">{upcomingBookings[0].lawyer_name}</h3>
                    <p className="text-indigo-200">
                      {upcomingBookings[0].lawyer_specialization} &bull;{' '}
                      {new Date(upcomingBookings[0].booking_date).toLocaleDateString('en-NG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}{' '}
                      at {upcomingBookings[0].booking_time}
                    </p>
                  </div>
                  <Link
                    href={`/consultation/${upcomingBookings[0].meeting_room_id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Join Video Call
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Hire Lawyer', href: '/marketplace', icon: '\uD83D\uDC68\u200D\u2696\uFE0F', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700' },
                  { label: 'Draft Document', href: '/tools/draft', icon: '\uD83D\uDCDD', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
                  { label: 'Analyze Contract', href: '/tools/analyze', icon: '\uD83D\uDD0D', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
                  { label: 'Predict Case', href: '/tools/predict', icon: '\uD83C\uDFAF', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700' },
                  { label: 'Legal Research', href: '/tools/research', icon: '\uD83D\uDCDA', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
                  { label: 'Predictions', href: '/predictions', icon: '\uD83D\uDCCA', color: 'bg-pink-50 hover:bg-pink-100 text-pink-700' },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`${action.color} rounded-xl p-4 text-center transition-colors`}
                  >
                    <span className="text-3xl block mb-2">{action.icon}</span>
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upcoming Bookings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Bookings</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                  {upcomingBookings.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <p>No upcoming bookings</p>
                      <Link href="/marketplace" className="text-indigo-600 text-sm hover:underline mt-1 inline-block">
                        Browse lawyers
                      </Link>
                    </div>
                  ) : (
                    upcomingBookings.map((booking) => (
                      <div key={booking.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{booking.lawyer_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.booking_date).toLocaleDateString('en-NG')} at {booking.booking_time}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                            {booking.status}
                          </span>
                          <Link
                            href={`/consultation/${booking.meeting_room_id}`}
                            className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                            title="Join Video Call"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Cases */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Cases</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                  {activeCases.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <p>No active cases</p>
                    </div>
                  ) : (
                    activeCases.map((caseItem) => (
                      <div key={caseItem.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900 text-sm">{caseItem.title}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[caseItem.status]}`}>
                            {caseItem.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {caseItem.lawyer_name} &bull; Updated {new Date(caseItem.last_update).toLocaleDateString('en-NG')}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 rounded-full h-2 transition-all"
                            style={{ width: `${caseItem.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{caseItem.progress}% complete</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">All Bookings</h3>
              <Link
                href="/marketplace"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                + New Booking
              </Link>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lawyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{booking.lawyer_name}</p>
                        <p className="text-sm text-gray-500">{booking.lawyer_specialization}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(booking.booking_date).toLocaleDateString('en-NG')} at {booking.booking_time}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {booking.duration_hours}hr{booking.duration_hours > 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {"\u20A6"}{booking.total_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(booking.status === 'confirmed' || booking.status === 'pending') && (
                          <Link
                            href={`/consultation/${booking.meeting_room_id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                            Join Call
                          </Link>
                        )}
                        {booking.status === 'completed' && (
                          <span className="text-xs text-gray-400">Ended</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cases Tab */}
        {activeTab === 'cases' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Case Tracker</h3>
            <div className="space-y-4">
              {cases.map((caseItem) => (
                <div key={caseItem.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{caseItem.title}</h4>
                      <p className="text-sm text-gray-500">
                        Assigned to {caseItem.lawyer_name} &bull; Last updated {new Date(caseItem.last_update).toLocaleDateString('en-NG')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[caseItem.status]}`}>
                      {caseItem.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-700">{caseItem.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`rounded-full h-3 transition-all ${
                          caseItem.progress === 100 ? 'bg-green-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${caseItem.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Case Timeline */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-3">Timeline</p>
                    <div className="space-y-3">
                      {[
                        { date: 'Case opened', done: true },
                        { date: 'Initial consultation', done: caseItem.progress >= 30 },
                        { date: 'Document review', done: caseItem.progress >= 50 },
                        { date: 'Strategy development', done: caseItem.progress >= 70 },
                        { date: 'Resolution', done: caseItem.progress === 100 },
                      ].map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${step.done ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Video Meetings</h3>
              <button
                onClick={() => {
                  const roomId = 'instant-' + Math.random().toString(36).substring(2, 10);
                  router.push(`/consultation/${roomId}`);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                Start Instant Meeting
              </button>
            </div>

            {/* Feature highlight */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg mb-1">In-App Video Consultations</h4>
                  <p className="text-gray-600 text-sm">
                    Meet your lawyer face-to-face without leaving CaseWin. No downloads required.
                    End-to-end encrypted meetings powered by Jitsi. Share your screen, chat, and
                    collaborate in real-time during your legal consultation.
                  </p>
                </div>
              </div>
            </div>

            {/* Meeting list */}
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      booking.status === 'completed' ? 'bg-gray-100' : 'bg-indigo-100'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${
                        booking.status === 'completed' ? 'text-gray-400' : 'text-indigo-600'
                      }`} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{booking.lawyer_name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.booking_date).toLocaleDateString('en-NG', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at {booking.booking_time} &bull; {booking.duration_hours}hr
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                      {booking.status}
                    </span>
                    {(booking.status === 'confirmed' || booking.status === 'pending') ? (
                      <Link
                        href={`/consultation/${booking.meeting_room_id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        Join Call
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">Meeting ended</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
