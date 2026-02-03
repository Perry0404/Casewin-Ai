// Database types for CaseWin AI

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  user_type: 'client' | 'lawyer' | 'law_firm'
  avatar_url: string | null
  bio: string | null
  location: string | null
  created_at: string
  updated_at: string
}

export interface LawyerProfile {
  id: string
  user_id: string
  bar_number: string | null
  years_of_experience: number
  specializations: string[]
  hourly_rate: number | null
  consultation_fee: number | null
  rating: number
  total_reviews: number
  total_cases: number
  win_rate: number
  is_verified: boolean
  verification_date: string | null
  created_at: string
}

export interface Wallet {
  id: string
  user_id: string
  balance: number
  currency: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  wallet_id: string
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'earning' | 'bet' | 'win'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  reference: string | null
  description: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface SavedDocument {
  id: string
  user_id: string
  title: string
  document_type: 'contract' | 'letter' | 'pleading' | 'affidavit' | 'mou' | 'power-of-attorney' | 'will' | 'tenancy' | 'other'
  content: string
  metadata: Record<string, any>
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface CasePrediction {
  id: string
  user_id: string
  case_type: string
  case_facts: string | null
  legal_issues: string | null
  jurisdiction: string | null
  client_position: string | null
  prediction_result: Record<string, any>
  win_probability: number | null
  created_at: string
}

export interface ResearchHistory {
  id: string
  user_id: string
  query: string
  results: Record<string, any> | null
  jurisdiction: string | null
  category: string | null
  created_at: string
}

export interface PredictionMarket {
  id: string
  title: string
  description: string | null
  case_reference: string | null
  court: string | null
  category: 'supreme_court' | 'appeal' | 'high_court' | 'tribunal' | 'other'
  outcome_options: Array<{ id: string; label: string; odds: number }>
  total_pool: number
  status: 'open' | 'closed' | 'resolved' | 'cancelled'
  resolution_date: string | null
  actual_outcome: string | null
  created_by: string | null
  created_at: string
  closes_at: string | null
}

export interface PredictionBet {
  id: string
  user_id: string
  market_id: string
  selected_outcome: string
  amount: number
  potential_payout: number | null
  status: 'active' | 'won' | 'lost' | 'refunded'
  created_at: string
}

export interface LawyerBooking {
  id: string
  client_id: string
  lawyer_id: string
  booking_type: 'consultation' | 'case_review' | 'document_review' | 'representation'
  scheduled_at: string
  duration_minutes: number
  amount: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes: string | null
  meeting_link: string | null
  created_at: string
}

export interface Review {
  id: string
  reviewer_id: string
  lawyer_id: string
  booking_id: string | null
  rating: number
  comment: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'payment' | 'booking' | 'prediction'
  is_read: boolean
  metadata: Record<string, any>
  created_at: string
}

// Extended types with relations
export interface LawyerWithProfile extends Profile {
  lawyer_profile: LawyerProfile | null
}

export interface BookingWithParties extends LawyerBooking {
  client: Profile
  lawyer: Profile & { lawyer_profile: LawyerProfile }
}

export interface MarketWithBets extends PredictionMarket {
  bets: PredictionBet[]
  user_bet?: PredictionBet
}
