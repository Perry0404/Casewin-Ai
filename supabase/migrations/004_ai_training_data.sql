-- CaseWin AI Training Data Schema
-- This schema stores data for training and improving the AI prediction model

-- Training examples from resolved markets
CREATE TABLE IF NOT EXISTS ai_training_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Market info
  market_id UUID REFERENCES prediction_markets(id),
  market_title TEXT NOT NULL,
  market_description TEXT,
  market_category TEXT NOT NULL,
  market_type TEXT NOT NULL,
  
  -- Input features
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Features include:
  -- - text_embedding: vector representation of title/description
  -- - case_type: extracted case type
  -- - court_level: court hierarchy level
  -- - days_to_resolution: time factor
  -- - initial_yes_price: starting probability
  -- - final_yes_price: closing probability before resolution
  -- - total_volume: trading activity
  -- - total_traders: number of participants
  -- - sentiment_score: text sentiment
  -- - historical_similar_cases: outcomes of similar cases
  
  -- Outcome
  actual_outcome TEXT NOT NULL, -- 'yes', 'no', or specific outcome
  outcome_value DECIMAL, -- For scalar markets
  
  -- AI prediction at various stages
  ai_prediction_initial DECIMAL NOT NULL, -- Prediction when market opened
  ai_prediction_midpoint DECIMAL, -- Prediction halfway through
  ai_prediction_final DECIMAL, -- Prediction before resolution
  
  -- Accuracy metrics
  prediction_error DECIMAL GENERATED ALWAYS AS (
    ABS(ai_prediction_final - CASE WHEN actual_outcome = 'yes' THEN 1.0 ELSE 0.0 END)
  ) STORED,
  
  -- Metadata
  resolution_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Quality flags
  is_verified BOOLEAN DEFAULT false,
  quality_score DECIMAL DEFAULT 0.5, -- 0-1, used to weight training examples
  
  CONSTRAINT valid_outcome CHECK (actual_outcome IN ('yes', 'no', 'invalid', 'cancelled'))
);

-- Model versions and performance tracking
CREATE TABLE IF NOT EXISTS ai_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  model_type TEXT NOT NULL, -- 'rule-based', 'ml', 'hybrid', 'llm'
  
  -- Model configuration
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Config includes:
  -- - architecture: model architecture details
  -- - hyperparameters: training hyperparameters
  -- - feature_weights: for rule-based models
  -- - base_model: for fine-tuned LLMs
  
  -- Performance metrics
  accuracy DECIMAL, -- Overall accuracy
  brier_score DECIMAL, -- Brier score (lower is better)
  log_loss DECIMAL, -- Log loss metric
  calibration_error DECIMAL, -- How well-calibrated are predictions
  
  -- Category-specific performance
  category_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Training info
  training_examples_count INTEGER DEFAULT 0,
  training_started_at TIMESTAMPTZ,
  training_completed_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, training, active, deprecated
  is_production BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Real-time prediction logs for analysis
CREATE TABLE IF NOT EXISTS ai_prediction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT NOT NULL,
  market_id UUID REFERENCES prediction_markets(id),
  
  -- Prediction details
  prediction_probability DECIMAL NOT NULL,
  confidence DECIMAL NOT NULL,
  reasoning TEXT,
  factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Input snapshot
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Performance (filled in after resolution)
  was_correct BOOLEAN,
  absolute_error DECIMAL,
  
  -- Timing
  inference_time_ms INTEGER, -- How long prediction took
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Legal precedent database for Nigerian courts
CREATE TABLE IF NOT EXISTS legal_precedents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Case identification
  case_citation TEXT NOT NULL UNIQUE, -- e.g., "(2024) LPELR-SC/123/2024"
  case_name TEXT NOT NULL,
  
  -- Court info
  court TEXT NOT NULL, -- supreme_court, court_of_appeal, federal_high_court, etc.
  jurisdiction TEXT DEFAULT 'Nigeria',
  
  -- Case details
  case_type TEXT NOT NULL,
  subject_matter TEXT[],
  key_issues TEXT[],
  
  -- Outcome
  outcome TEXT NOT NULL, -- appellant_won, respondent_won, dismissed, etc.
  outcome_summary TEXT,
  
  -- Extracted features for ML
  features JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  decision_date DATE,
  judges TEXT[],
  is_landmark BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feature importance tracking
CREATE TABLE IF NOT EXISTS ai_feature_importance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT REFERENCES ai_model_versions(version),
  
  feature_name TEXT NOT NULL,
  feature_category TEXT NOT NULL, -- text, numeric, categorical, derived
  
  -- Importance metrics
  importance_score DECIMAL NOT NULL, -- Overall importance
  shap_value_mean DECIMAL, -- Mean SHAP value
  permutation_importance DECIMAL,
  
  -- Category-specific importance
  category_importance JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(model_version, feature_name)
);

-- User feedback for improving predictions
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  prediction_log_id UUID REFERENCES ai_prediction_logs(id),
  market_id UUID REFERENCES prediction_markets(id),
  
  -- Feedback type
  feedback_type TEXT NOT NULL, -- 'accuracy', 'reasoning', 'factors', 'general'
  
  -- Feedback content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  suggested_factors JSONB,
  
  -- Processing
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_training_examples_category ON ai_training_examples(market_category);
CREATE INDEX idx_training_examples_outcome ON ai_training_examples(actual_outcome);
CREATE INDEX idx_training_examples_quality ON ai_training_examples(quality_score);
CREATE INDEX idx_prediction_logs_market ON ai_prediction_logs(market_id);
CREATE INDEX idx_prediction_logs_version ON ai_prediction_logs(model_version);
CREATE INDEX idx_legal_precedents_type ON legal_precedents(case_type);
CREATE INDEX idx_legal_precedents_court ON legal_precedents(court);
CREATE INDEX idx_legal_precedents_date ON legal_precedents(decision_date);

-- Function to calculate model accuracy
CREATE OR REPLACE FUNCTION calculate_model_accuracy(p_model_version TEXT)
RETURNS TABLE(
  total_predictions INTEGER,
  correct_predictions INTEGER,
  accuracy DECIMAL,
  brier_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_predictions,
    COUNT(*) FILTER (WHERE was_correct = true)::INTEGER as correct_predictions,
    ROUND(
      COUNT(*) FILTER (WHERE was_correct = true)::DECIMAL / NULLIF(COUNT(*), 0),
      4
    ) as accuracy,
    ROUND(
      AVG(absolute_error ^ 2),
      4
    ) as brier_score
  FROM ai_prediction_logs
  WHERE model_version = p_model_version
    AND was_correct IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update training example after market resolution
CREATE OR REPLACE FUNCTION update_training_example_on_resolution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    INSERT INTO ai_training_examples (
      market_id,
      market_title,
      market_description,
      market_category,
      market_type,
      features,
      actual_outcome,
      ai_prediction_initial,
      ai_prediction_final,
      resolution_date
    )
    SELECT 
      NEW.id,
      NEW.title,
      NEW.description,
      NEW.category,
      NEW.market_type,
      jsonb_build_object(
        'initial_yes_price', NEW.yes_price,
        'total_volume', NEW.total_volume,
        'total_traders', NEW.total_traders,
        'liquidity_pool', NEW.liquidity_pool
      ),
      NEW.resolution_outcome,
      NEW.ai_prediction,
      NEW.ai_prediction,
      NEW.resolution_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_training_example
AFTER UPDATE ON prediction_markets
FOR EACH ROW
EXECUTE FUNCTION update_training_example_on_resolution();
