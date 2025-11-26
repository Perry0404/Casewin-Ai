'use client';

import { useState, useEffect } from 'react';
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
  profile_image?: string;
  bio: string;
}

export default function MarketplacePage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [filteredLawyers, setFilteredLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [maxRate, setMaxRate] = useState(50000);

  const specializations = [
    'Criminal Law',
    'Corporate Law',
    'Family Law',
    'Real Estate',
    'Immigration',
    'Intellectual Property',
    'Labour Law',
    'Tax Law'
  ];

  const locations = [
    'Lagos',
    'Abuja',
    'Port Harcourt',
    'Kano',
    'Ibadan',
    'Enugu',
    'Kaduna'
  ];

  useEffect(() => {
    fetchLawyers();
  }, []);

  useEffect(() => {
    filterLawyers();
  }, [lawyers, selectedSpecialization, selectedLocation, maxRate]);

  const fetchLawyers = async () => {
    try {
      const response = await fetch('/api/marketplace/lawyers');
      const data = await response.json();
      if (data.success) {
        setLawyers(data.lawyers);
        setFilteredLawyers(data.lawyers);
      }
    } catch (error) {
      console.error('Error fetching lawyers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLawyers = () => {
    let filtered = [...lawyers];

    if (selectedSpecialization !== 'all') {
      filtered = filtered.filter(l => l.specialization === selectedSpecialization);
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(l => l.location === selectedLocation);
    }

    filtered = filtered.filter(l => l.hourly_rate <= maxRate);

    setFilteredLawyers(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lawyers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">🇳🇬 Hire a Nigerian Lawyer</h1>
          <p className="text-xl text-indigo-100">
            Browse verified lawyers, compare rates, book consultations
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>

              {/* Specialization Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Hourly Rate Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Hourly Rate: ₦{maxRate.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="5000"
                  max="50000"
                  step="5000"
                  value={maxRate}
                  onChange={(e) => setMaxRate(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₦5,000</span>
                  <span>₦50,000</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedSpecialization('all');
                  setSelectedLocation('all');
                  setMaxRate(50000);
                }}
                className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Lawyers Grid */}
          <main className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                {filteredLawyers.length} lawyer{filteredLawyers.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {filteredLawyers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500 text-lg">No lawyers match your filters</p>
                <button
                  onClick={() => {
                    setSelectedSpecialization('all');
                    setSelectedLocation('all');
                    setMaxRate(50000);
                  }}
                  className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredLawyers.map((lawyer) => (
                  <Link
                    key={lawyer.id}
                    href={`/marketplace/lawyer/${lawyer.id}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-indigo-300"
                  >
                    <div className="flex items-start gap-4">
                      {/* Profile Image */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {lawyer.full_name.charAt(0)}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {lawyer.full_name}
                        </h3>
                        <p className="text-indigo-600 text-sm font-medium mb-2">
                          {lawyer.specialization}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            📍 {lawyer.location}
                          </span>
                          <span className="flex items-center gap-1">
                            ⭐ {lawyer.rating.toFixed(1)} ({lawyer.total_reviews})
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {lawyer.bio}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-900">
                            ₦{lawyer.hourly_rate.toLocaleString()}/hr
                          </span>
                          <span className="text-sm text-gray-500">
                            {lawyer.years_of_experience} years exp.
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
