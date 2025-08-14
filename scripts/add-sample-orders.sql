-- =====================================================
-- Add Sample Orders to Test Order System
-- Run this after the main seed script
-- =====================================================

-- Disable RLS temporarily
ALTER TABLE universal_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines DISABLE ROW LEVEL SECURITY;

-- Create sample orders
INSERT INTO universal_transactions (
  id,
  organization_id,
  transaction_type,
  transaction_date,
  reference_number,
  total_amount,
  status
) VALUES
-- Order 1: Dine-in with Pizza and Salad
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440000', 'order', NOW() - INTERVAL '10 minutes', 'ORD-2025-001', 33.00, 'preparing'),
-- Order 2: Takeout with Pasta
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440000', 'order', NOW() - INTERVAL '5 minutes', 'ORD-2025-002', 22.00, 'pending'),
-- Order 3: Delivery with multiple items
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440000', 'order', NOW() - INTERVAL '2 minutes', 'ORD-2025-003', 45.50, 'ready')
ON CONFLICT (id) DO NOTHING;

-- Create order line items
INSERT INTO universal_transaction_lines (
  id,
  transaction_id,
  organization_id,
  entity_id,
  quantity,
  unit_price,
  line_total
) VALUES
-- Order 1 items
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 1, 18.50, 18.50), -- Pizza
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', 1, 14.50, 14.50), -- Caesar Salad
-- Order 2 items  
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', 1, 22.00, 22.00), -- Pasta
-- Order 3 items
('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440013', 1, 28.00, 28.00), -- Salmon
('550e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440014', 1, 9.50, 9.50),   -- Tiramisu
('550e8400-e29b-41d4-a716-446655440065', '550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440015', 1, 8.00, 8.00)    -- Wine
ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines ENABLE ROW LEVEL SECURITY;

-- Confirmation
DO $$
BEGIN
    RAISE NOTICE '🎉 Sample orders created successfully!';
    RAISE NOTICE '📋 Created:';
    RAISE NOTICE '✅ 3 sample orders with different statuses';
    RAISE NOTICE '✅ 6 order line items';
    RAISE NOTICE '🚀 Orders should now appear in the restaurant interface';
END $$;