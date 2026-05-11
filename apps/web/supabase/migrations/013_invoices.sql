-- Agent Commerce: Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  invoice_number TEXT UNIQUE NOT NULL,
  matter TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_link TEXT,
  payment_reference TEXT,
  zendfi_payment_link_id TEXT,
  due_date DATE,
  notes TEXT,
  ai_draft TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: lawyers can only see their own invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers manage own invoices"
  ON invoices FOR ALL
  USING (auth.uid() = lawyer_id)
  WITH CHECK (auth.uid() = lawyer_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS invoices_lawyer_id_idx ON invoices (lawyer_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices (status);

NOTIFY pgrst, 'reload schema';
