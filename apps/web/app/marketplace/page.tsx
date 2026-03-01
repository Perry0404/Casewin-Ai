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

const LAWYERS_CACHE_KEY = 'casewin_lawyers_cache';
const CACHE_EXPIRY_KEY = 'casewin_lawyers_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export default function MarketplacePage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [filteredLawyers, setFilteredLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [maxRate, setMaxRate] = useState(100000);
  const [searchQuery, setSearchQuery] = useState('');

  const Navigation = () => (
    <nav className="flex gap-6">
      <Link href="/" className="text-white hover:text-gray-300 transition-colors font-semibold">
        AI Tools
      </Link>
      <Link href="/marketplace" className="text-white hover:text-gray-300 transition-colors font-semibold underline">
        Hire Lawyers
      </Link>
      <Link href="/predictions" className="text-white hover:text-gray-300 transition-colors font-semibold">
        Predictions
      </Link>
    </nav>
  );

  const specializations = [
    'Criminal Law', 'Corporate Law', 'Family Law', 'Real Estate', 'Immigration',
    'Intellectual Property', 'Labour Law', 'Tax Law', 'Constitutional Law',
    'Human Rights', 'Maritime Law', 'Oil & Gas', 'Banking & Finance',
    'Insurance Law', 'Media & Entertainment'
  ];

  const locations = [
    'Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti',
    'Enugu', 'Anambra', 'Imo', 'Abia', 'Ebonyi',
    'Rivers', 'Port Harcourt', 'Delta', 'Bayelsa', 'Cross River', 'Akwa Ibom', 'Edo',
    'FCT Abuja', 'Abuja', 'Kwara', 'Kogi', 'Niger', 'Benue', 'Plateau', 'Nasarawa',
    'Kano', 'Kaduna', 'Katsina', 'Sokoto', 'Zamfara', 'Kebbi', 'Jigawa',
    'Borno', 'Yobe', 'Adamawa', 'Bauchi', 'Gombe', 'Taraba'
  ];

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const saveLawyersToCache = (lawyersData: Lawyer[]) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAWYERS_CACHE_KEY, JSON.stringify(lawyersData));
        localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
        setLastUpdated(new Date().toLocaleString());
      }
    } catch (e) {
      console.error('Error saving to cache:', e);
    }
  };

  const loadLawyersFromCache = (): Lawyer[] | null => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(LAWYERS_CACHE_KEY);
        const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
        if (cached && expiry) {
          const expiryTime = parseInt(expiry, 10);
          if (Date.now() < expiryTime) return JSON.parse(cached);
        }
      }
      return null;
    } catch (e) {
      console.error('Error loading from cache:', e);
      return null;
    }
  };

  useEffect(() => {
    fetchLawyers();
  }, []);

  useEffect(() => {
    filterLawyers();
  }, [lawyers, selectedSpecialization, selectedLocation, maxRate, searchQuery]);

  const fetchLawyers = async () => {
    try {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        const cachedLawyers = loadLawyersFromCache();
        if (cachedLawyers) {
          setLawyers(cachedLawyers);
          setFilteredLawyers(cachedLawyers);
          setLoading(false);
          return;
        }
      }
      const response = await fetch('/api/marketplace/lawyers');
      const data = await response.json();
      if (data.success) {
        setLawyers(data.lawyers);
        setFilteredLawyers(data.lawyers);
        saveLawyersToCache(data.lawyers);
      }
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      const cachedLawyers = loadLawyersFromCache();
      if (cachedLawyers) {
        setLawyers(cachedLawyers);
        setFilteredLawyers(cachedLawyers);
        setIsOffline(true);
      }
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
      filtered = filtered.filter(l => 
        l.location.toLowerCase().includes(selectedLocation.toLowerCase()) ||
        selectedLocation.toLowerCase().includes(l.location.toLowerCase())
      );
    }
    filtered = filtered.filter(l => l.hourly_rate <= maxRate);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.full_name.toLowerCase().includes(query) ||
        l.bio.toLowerCase().includes(query) ||
        l.specialization.toLowerCase().includes(query)
      );
    }
    setFilteredLawyers(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lawyers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isOffline && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
          You are offline - Showing cached lawyers. Some features may be limited.
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6 border-b border-blue-700">
            <div>
              <h1 className="text-2xl font-bold">CaseWinAI</h1>
            </div>
            <Navigation />
          </div>
          <div className="py-12">
            <h2 className="text-4xl font-bold mb-4">Legal Marketplace</h2>
            <p className="text-xl text-gray-200">
              AI-powered legal automation & verified Nigerian lawyers across all 36 states
            </p>
            {isOffline && lastUpdated && (
              <p className="text-sm text-gray-300 mt-2">
                Offline Mode - Last updated: {lastUpdated}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI Legal Automation Services */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">⚡</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">AI Legal Automation</h2>
          </div>
          <p className="text-gray-600 ml-11">Instant AI-powered legal services — no appointment needed</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/marketplace/case-intake" className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-200 hover:border-blue-600 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
              <span className="text-2xl group-hover:brightness-200">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Case Intake</h3>
            <p className="text-sm text-gray-600 mb-3">Describe your legal issue and get instant AI analysis — complexity assessment, risk level, recommended actions, and auto-matched lawyers.</p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Free</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">AI-Powered</span>
            </div>
          </Link>

          <Link href="/tools/draft" className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-200 hover:border-blue-600 p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
              <span className="text-2xl group-hover:brightness-200">📄</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Generator</h3>
            <p className="text-sm text-gray-600 mb-3">Generate contracts, affidavits, tenancy agreements, MOUs, powers of attorney, and more — drafted by AI in seconds.</p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">8 Document Types</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">AI-Powered</span>
            </div>
          </Link>

          <Link href="/tools/analyze" className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-200 hover:border-blue-600 p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors">
              <span className="text-2xl group-hover:brightness-200">🔍</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contract Analyzer</h3>
            <p className="text-sm text-gray-600 mb-3">Upload or paste any contract for AI risk scoring, clause-by-clause analysis, missing clause detection, and compliance checks.</p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">Risk Scoring</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">AI-Powered</span>
            </div>
          </Link>

          <Link href="/tools/compliance" className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-200 hover:border-blue-600 p-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-yellow-600 transition-colors">
              <span className="text-2xl group-hover:brightness-200">✅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance Checker</h3>
            <p className="text-sm text-gray-600 mb-3">Check your business against CAMA 2020, NDPR, CBN regulations, tax laws, and more. Get instant compliance reports.</p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">Nigerian Law</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">AI-Powered</span>
            </div>
          </Link>

          <Link href="/tools/research" className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-200 hover:border-blue-600 p-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
              <span className="text-2xl group-hover:brightness-200">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Research</h3>
            <p className="text-sm text-gray-600 mb-3">Search Nigerian case law, statutes, and legal precedents. AI finds relevant cases and summarizes holdings instantly.</p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium">25+ Landmark Cases</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">AI-Powered</span>
            </div>
          </Link>

          <Link href="/tools/predict" className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-200 hover:border-blue-600 p-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
              <span className="text-2xl group-hover:brightness-200">⚖️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Case Predictor</h3>
            <p className="text-sm text-gray-600 mb-3">Get AI-powered win probability analysis for your case based on Nigerian legal precedents, judge patterns, and similar cases.</p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">Precedent Analysis</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">AI-Powered</span>
            </div>
          </Link>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-lg">👨‍⚖️</span>
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Or Hire a Lawyer</span>
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-800">
            <strong>Legal Notice:</strong> CaseWinAI is a technology platform connecting clients with independent legal practitioners. All lawyers listed are verified members of the Nigerian Bar Association.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Search & Filter</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Lawyers</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Name, specialty, or keyword..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">State / Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All States (36 + FCT)</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Hourly Rate: ₦{maxRate.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="5000"
                  value={maxRate}
                  onChange={(e) => setMaxRate(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <button
                onClick={() => {
                  setSelectedSpecialization('all');
                  setSelectedLocation('all');
                  setMaxRate(100000);
                  setSearchQuery('');
                }}
                className="w-full py-2 text-sm text-blue-900 hover:text-blue-700 font-medium"
              >
                Reset Filters
              </button>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className={`w-3 h-3 rounded-full ${isOffline ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                  <span>{isOffline ? 'Offline Mode' : 'Online'}</span>
                </div>
                {!isOffline && (
                  <button
                    onClick={fetchLawyers}
                    className="mt-2 w-full py-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Refresh & Cache Data
                  </button>
                )}
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                {filteredLawyers.length} lawyer{filteredLawyers.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {filteredLawyers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500 text-lg">No lawyers match your filters</p>
                <p className="text-sm text-gray-400 mt-2">
                  {isOffline ? 'Try refreshing when you have internet connection.' : 'Try adjusting your search criteria.'}
                </p>
                <button
                  onClick={() => {
                    setSelectedSpecialization('all');
                    setSelectedLocation('all');
                    setMaxRate(100000);
                    setSearchQuery('');
                  }}
                  className="mt-4 text-blue-900 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredLawyers.map((lawyer) => (
                  <Link
                    key={lawyer.id}
                    href={`/marketplace/lawyer/${lawyer.id}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-blue-900"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {lawyer.full_name.charAt(0)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {lawyer.full_name}
                        </h3>
                        <p className="text-blue-900 text-sm font-medium mb-2">
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
