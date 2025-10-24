-- Create currencies table that's referenced by universal_transactions
-- This table is needed by hera_txn_create_v1 RPC function

BEGIN;

-- Create currencies table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.currencies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT,
  decimal_places INT DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common currencies
INSERT INTO public.currencies (code, name, symbol, decimal_places) VALUES
  ('AED', 'United Arab Emirates Dirham', 'د.إ', 2),
  ('USD', 'US Dollar', '$', 2),
  ('EUR', 'Euro', '€', 2),
  ('GBP', 'British Pound', '£', 2),
  ('INR', 'Indian Rupee', '₹', 2),
  ('SAR', 'Saudi Riyal', 'ر.س', 2),
  ('KWD', 'Kuwaiti Dinar', 'د.ك', 3),
  ('BHD', 'Bahraini Dinar', 'ب.د', 3),
  ('OMR', 'Omani Rial', 'ر.ع.', 3),
  ('QAR', 'Qatari Riyal', 'ر.ق', 2),
  ('JPY', 'Japanese Yen', '¥', 0),
  ('CNY', 'Chinese Yuan', '¥', 2),
  ('AUD', 'Australian Dollar', 'A$', 2),
  ('CAD', 'Canadian Dollar', 'C$', 2),
  ('CHF', 'Swiss Franc', 'CHF', 2),
  ('SEK', 'Swedish Krona', 'kr', 2),
  ('NZD', 'New Zealand Dollar', 'NZ$', 2)
ON CONFLICT (code) DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.currencies TO anon, authenticated, service_role;
GRANT ALL ON public.currencies TO service_role;

COMMIT;

-- Verify the table was created
SELECT 'Currencies table created successfully. Total currencies: ' || COUNT(*)::TEXT as status
FROM public.currencies;
