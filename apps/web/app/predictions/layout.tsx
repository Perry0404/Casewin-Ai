import Link from 'next/link'
import { PREDICTIONS_ENABLED } from '@/lib/features'

// Gate for the entire prediction market. While disabled, every /predictions/*
// route renders this "coming soon" notice instead of the market UI. Flip
// NEXT_PUBLIC_PREDICTIONS_ENABLED=true to bring it back.
export default function PredictionsLayout({ children }: { children: React.ReactNode }) {
  if (!PREDICTIONS_ENABLED) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md text-center border border-gray-700">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-white mb-2">Prediction Market Coming Soon</h2>
          <p className="text-gray-400 mb-6">
            The CaseWin prediction market is temporarily unavailable while we put
            the finishing touches in place. Check back soon.
          </p>
          <Link
            href="/"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
