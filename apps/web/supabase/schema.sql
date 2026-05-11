-- CaseWin AI Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  user_type TEXT CHECK (user_type IN ('client', 'lawyer', 'law_firm')) DEFAULT 'client',
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lawyer Profiles (extended info for lawyers)
CREATE TABLE lawyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  bar_number TEXT,
  bio TEXT DEFAULT '',
  location TEXT,
  state TEXT,
  languages TEXT[] DEFAULT ARRAY['English'],
  years_of_experience INTEGER DEFAULT 0,
  specializations TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10, 2),
  consultation_fee DECIMAL(10, 2),
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_cases INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet Table
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'NGN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund', 'earning', 'bet', 'win')) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  reference TEXT UNIQUE,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Documents Table
CREATE TABLE saved_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN ('contract', 'letter', 'pleading', 'affidavit', 'mou', 'power-of-attorney', 'will', 'tenancy', 'other')) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case Predictions Table
CREATE TABLE case_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  case_type TEXT NOT NULL,
  case_facts TEXT,
  legal_issues TEXT,
  jurisdiction TEXT,
  client_position TEXT,
  prediction_result JSONB NOT NULL,
  win_probability INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research History Table
CREATE TABLE research_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results JSONB,
  jurisdiction TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prediction Markets Table
CREATE TABLE prediction_markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  case_reference TEXT,
  court TEXT,
  category TEXT CHECK (category IN ('supreme_court', 'appeal', 'high_court', 'tribunal', 'other')),
  outcome_options JSONB NOT NULL, -- Array of possible outcomes
  total_pool DECIMAL(15, 2) DEFAULT 0,
  status TEXT CHECK (status IN ('open', 'closed', 'resolved', 'cancelled')) DEFAULT 'open',
  resolution_date TIMESTAMP WITH TIME ZONE,
  actual_outcome TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closes_at TIMESTAMP WITH TIME ZONE
);

-- Prediction Bets Table
CREATE TABLE prediction_bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  market_id UUID REFERENCES prediction_markets(id) ON DELETE CASCADE,
  selected_outcome TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  potential_payout DECIMAL(15, 2),
  status TEXT CHECK (status IN ('active', 'won', 'lost', 'refunded')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lawyer Bookings Table
CREATE TABLE lawyer_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  booking_type TEXT CHECK (booking_type IN ('consultation', 'case_review', 'document_review', 'representation')) NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  amount DECIMAL(15, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  meeting_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES lawyer_bookings(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error', 'payment', 'booking', 'prediction')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_saved_documents_user_id ON saved_documents(user_id);
CREATE INDEX idx_prediction_bets_user_id ON prediction_bets(user_id);
CREATE INDEX idx_prediction_bets_market_id ON prediction_bets(market_id);
CREATE INDEX idx_lawyer_bookings_client_id ON lawyer_bookings(client_id);
CREATE INDEX idx_lawyer_bookings_lawyer_id ON lawyer_bookings(lawyer_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

-- Wallets policies
CREATE POLICY "Users can view their own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own wallet" ON wallets FOR UPDATE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Saved documents policies
CREATE POLICY "Users can view their own documents" ON saved_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documents" ON saved_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON saved_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON saved_documents FOR DELETE USING (auth.uid() = user_id);

-- Predictions policies
CREATE POLICY "Users can view their own predictions" ON case_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own predictions" ON case_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Research history policies
CREATE POLICY "Users can view their own research" ON research_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own research" ON research_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prediction bets policies
CREATE POLICY "Users can view their own bets" ON prediction_bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can place bets" ON prediction_bets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bookings policies
CREATE POLICY "Clients can view their bookings" ON lawyer_bookings FOR SELECT USING (auth.uid() = client_id OR auth.uid() = lawyer_id);
CREATE POLICY "Clients can create bookings" ON lawyer_bookings FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Participants can update bookings" ON lawyer_bookings FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = lawyer_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Function to create profile and wallet on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, balance)
  VALUES (new.id, 0);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile and wallet
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    IF NEW.type IN ('deposit', 'refund', 'earning', 'win') THEN
      UPDATE wallets SET balance = balance + NEW.amount, updated_at = NOW() WHERE id = NEW.wallet_id;
    ELSIF NEW.type IN ('withdrawal', 'payment', 'bet') THEN
      UPDATE wallets SET balance = balance - NEW.amount, updated_at = NOW() WHERE id = NEW.wallet_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for wallet balance updates
CREATE TRIGGER on_transaction_complete
  AFTER UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();
