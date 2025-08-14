-- =====================================================
-- Mario's Italian Bistro - Complete Seed Script
-- Temporarily disables RLS, creates data, re-enables RLS
-- =====================================================

-- STEP 1: Disable RLS on required tables
ALTER TABLE core_entities DISABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data DISABLE ROW LEVEL SECURITY;

-- STEP 2: Create Mario's user profile
INSERT INTO core_entities (
  id, 
  organization_id, 
  entity_type, 
  entity_name, 
  entity_code, 
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440000',
  'user_profile',
  'Mario Rossi',
  'USR_MARIO',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Add user properties
INSERT INTO core_dynamic_data (entity_id, field_name, field_value, field_type) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'email', 'mario@restaurant.com', 'text'),
('550e8400-e29b-41d4-a716-446655440020', 'role', 'owner', 'text'),
('550e8400-e29b-41d4-a716-446655440020', 'phone', '+1-555-MARIO-01', 'text'),
('550e8400-e29b-41d4-a716-446655440020', 'permissions', '["entities", "transactions", "reports", "settings", "admin"]', 'json')
ON CONFLICT (entity_id, field_name) DO NOTHING;

-- STEP 3: Create menu items
INSERT INTO core_entities (id, organization_id, entity_type, entity_name, entity_code, status) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'menu_item', 'Margherita Pizza', 'PIZZA_MARG', 'active'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'menu_item', 'Spaghetti Carbonara', 'PASTA_CARB', 'active'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', 'menu_item', 'Caesar Salad', 'SALAD_CAES', 'active'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', 'menu_item', 'Grilled Salmon', 'SEAFOOD_SALMON', 'active'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440000', 'menu_item', 'Chocolate Tiramisu', 'DESSERT_TIRAMISU', 'active'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440000', 'menu_item', 'House Wine (Glass)', 'WINE_HOUSE_GLASS', 'active'),
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440000', 'menu_item', 'Garlic Bread', 'APPETIZER_GARLIC_BREAD', 'active'),
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440000', 'menu_item', 'Soft Drink', 'BEVERAGE_SOFT_DRINK', 'active')
ON CONFLICT (id) DO NOTHING;

-- STEP 4: Add menu properties
INSERT INTO core_dynamic_data (entity_id, field_name, field_value, field_type) VALUES
-- Margherita Pizza
('550e8400-e29b-41d4-a716-446655440010', 'price', '18.50', 'decimal'),
('550e8400-e29b-41d4-a716-446655440010', 'description', 'Classic pizza with fresh mozzarella, tomatoes, and basil', 'text'),
('550e8400-e29b-41d4-a716-446655440010', 'category', 'Pizza', 'text'),
('550e8400-e29b-41d4-a716-446655440010', 'prep_time', '12', 'integer'),
('550e8400-e29b-41d4-a716-446655440010', 'dietary_tags', '["vegetarian", "gluten_free_option"]', 'json'),
('550e8400-e29b-41d4-a716-446655440010', 'ingredients', 'Tomato sauce, fresh mozzarella, basil, olive oil', 'text'),
('550e8400-e29b-41d4-a716-446655440010', 'popularity', '95', 'integer'),

-- Spaghetti Carbonara
('550e8400-e29b-41d4-a716-446655440011', 'price', '22.00', 'decimal'),
('550e8400-e29b-41d4-a716-446655440011', 'description', 'Traditional Roman pasta with eggs, cheese, and pancetta', 'text'),
('550e8400-e29b-41d4-a716-446655440011', 'category', 'Pasta', 'text'),
('550e8400-e29b-41d4-a716-446655440011', 'prep_time', '15', 'integer'),
('550e8400-e29b-41d4-a716-446655440011', 'dietary_tags', '[]', 'json'),
('550e8400-e29b-41d4-a716-446655440011', 'ingredients', 'Spaghetti, eggs, pecorino cheese, pancetta, black pepper', 'text'),
('550e8400-e29b-41d4-a716-446655440011', 'popularity', '88', 'integer'),

-- Caesar Salad
('550e8400-e29b-41d4-a716-446655440012', 'price', '14.50', 'decimal'),
('550e8400-e29b-41d4-a716-446655440012', 'description', 'Crisp romaine lettuce with parmesan and homemade croutons', 'text'),
('550e8400-e29b-41d4-a716-446655440012', 'category', 'Salads', 'text'),
('550e8400-e29b-41d4-a716-446655440012', 'prep_time', '8', 'integer'),
('550e8400-e29b-41d4-a716-446655440012', 'dietary_tags', '["vegetarian", "keto_friendly"]', 'json'),
('550e8400-e29b-41d4-a716-446655440012', 'ingredients', 'Romaine lettuce, parmesan, croutons, caesar dressing', 'text'),
('550e8400-e29b-41d4-a716-446655440012', 'popularity', '72', 'integer'),

-- Grilled Salmon
('550e8400-e29b-41d4-a716-446655440013', 'price', '28.00', 'decimal'),
('550e8400-e29b-41d4-a716-446655440013', 'description', 'Fresh Atlantic salmon grilled to perfection with herbs', 'text'),
('550e8400-e29b-41d4-a716-446655440013', 'category', 'Seafood', 'text'),
('550e8400-e29b-41d4-a716-446655440013', 'prep_time', '18', 'integer'),
('550e8400-e29b-41d4-a716-446655440013', 'dietary_tags', '["healthy", "keto_friendly"]', 'json'),
('550e8400-e29b-41d4-a716-446655440013', 'ingredients', 'Atlantic salmon, herbs, olive oil, lemon', 'text'),
('550e8400-e29b-41d4-a716-446655440013', 'popularity', '85', 'integer'),

-- Chocolate Tiramisu
('550e8400-e29b-41d4-a716-446655440014', 'price', '9.50', 'decimal'),
('550e8400-e29b-41d4-a716-446655440014', 'description', 'Classic Italian dessert with coffee-soaked ladyfingers', 'text'),
('550e8400-e29b-41d4-a716-446655440014', 'category', 'Desserts', 'text'),
('550e8400-e29b-41d4-a716-446655440014', 'prep_time', '5', 'integer'),
('550e8400-e29b-41d4-a716-446655440014', 'dietary_tags', '["vegetarian"]', 'json'),
('550e8400-e29b-41d4-a716-446655440014', 'ingredients', 'Mascarpone, ladyfingers, coffee, cocoa powder', 'text'),
('550e8400-e29b-41d4-a716-446655440014', 'popularity', '92', 'integer'),

-- House Wine (Glass)
('550e8400-e29b-41d4-a716-446655440015', 'price', '6.25', 'decimal'),
('550e8400-e29b-41d4-a716-446655440015', 'description', 'Selection of house red or white wine by the glass', 'text'),
('550e8400-e29b-41d4-a716-446655440015', 'category', 'Beverages', 'text'),
('550e8400-e29b-41d4-a716-446655440015', 'prep_time', '2', 'integer'),
('550e8400-e29b-41d4-a716-446655440015', 'dietary_tags', '["vegan"]', 'json'),
('550e8400-e29b-41d4-a716-446655440015', 'ingredients', 'Italian red or white wine', 'text'),
('550e8400-e29b-41d4-a716-446655440015', 'popularity', '78', 'integer'),

-- Garlic Bread
('550e8400-e29b-41d4-a716-446655440016', 'price', '6.50', 'decimal'),
('550e8400-e29b-41d4-a716-446655440016', 'description', 'Fresh baked bread with garlic butter and herbs', 'text'),
('550e8400-e29b-41d4-a716-446655440016', 'category', 'Appetizers', 'text'),
('550e8400-e29b-41d4-a716-446655440016', 'prep_time', '8', 'integer'),
('550e8400-e29b-41d4-a716-446655440016', 'dietary_tags', '["vegetarian"]', 'json'),
('550e8400-e29b-41d4-a716-446655440016', 'ingredients', 'Bread, garlic, butter, parsley', 'text'),
('550e8400-e29b-41d4-a716-446655440016', 'popularity', '89', 'integer'),

-- Soft Drink
('550e8400-e29b-41d4-a716-446655440017', 'price', '3.50', 'decimal'),
('550e8400-e29b-41d4-a716-446655440017', 'description', 'Coca-Cola, Sprite, Orange, or other soft drinks', 'text'),
('550e8400-e29b-41d4-a716-446655440017', 'category', 'Beverages', 'text'),
('550e8400-e29b-41d4-a716-446655440017', 'prep_time', '1', 'integer'),
('550e8400-e29b-41d4-a716-446655440017', 'dietary_tags', '["vegan"]', 'json'),
('550e8400-e29b-41d4-a716-446655440017', 'ingredients', 'Carbonated soft drink', 'text'),
('550e8400-e29b-41d4-a716-446655440017', 'popularity', '65', 'integer')

ON CONFLICT (entity_id, field_name) DO NOTHING;

-- STEP 5: Create some sample customers
INSERT INTO core_entities (id, organization_id, entity_type, entity_name, entity_code, status) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', 'customer', 'Sarah Johnson', 'CUST_SARAH', 'active'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440000', 'customer', 'Mike Chen', 'CUST_MIKE', 'active'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440000', 'customer', 'Emma Wilson', 'CUST_EMMA', 'active'),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440000', 'customer', 'Robert Davis', 'CUST_ROBERT', 'active')
ON CONFLICT (id) DO NOTHING;

-- Add customer properties
INSERT INTO core_dynamic_data (entity_id, field_name, field_value, field_type) VALUES
-- Sarah Johnson
('550e8400-e29b-41d4-a716-446655440030', 'phone', '+1-555-123-4567', 'text'),
('550e8400-e29b-41d4-a716-446655440030', 'email', 'sarah.johnson@email.com', 'text'),
('550e8400-e29b-41d4-a716-446655440030', 'customer_type', 'regular', 'text'),
-- Mike Chen
('550e8400-e29b-41d4-a716-446655440031', 'phone', '+1-555-987-6543', 'text'),
('550e8400-e29b-41d4-a716-446655440031', 'email', 'mike.chen@email.com', 'text'),
('550e8400-e29b-41d4-a716-446655440031', 'customer_type', 'regular', 'text'),
-- Emma Wilson
('550e8400-e29b-41d4-a716-446655440032', 'phone', '+1-555-456-7890', 'text'),
('550e8400-e29b-41d4-a716-446655440032', 'email', 'emma.wilson@email.com', 'text'),
('550e8400-e29b-41d4-a716-446655440032', 'address', '123 Oak Street, Apt 4B', 'text'),
('550e8400-e29b-41d4-a716-446655440032', 'customer_type', 'delivery', 'text'),
-- Robert Davis
('550e8400-e29b-41d4-a716-446655440033', 'phone', '+1-555-789-0123', 'text'),
('550e8400-e29b-41d4-a716-446655440033', 'email', 'robert.davis@email.com', 'text'),
('550e8400-e29b-41d4-a716-446655440033', 'customer_type', 'vip', 'text')
ON CONFLICT (entity_id, field_name) DO NOTHING;

-- STEP 6: Re-enable RLS on all tables
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;

-- STEP 7: Confirmation message
DO $$
BEGIN
    RAISE NOTICE '🎉 Mario''s Italian Bistro seed data created successfully!';
    RAISE NOTICE '📋 Created:';
    RAISE NOTICE '✅ 1 user profile (Mario Rossi)';
    RAISE NOTICE '✅ 8 menu items (Pizza, Pasta, Salad, Seafood, Desserts, Beverages)';
    RAISE NOTICE '✅ 4 sample customers';
    RAISE NOTICE '✅ All properties and dynamic data';
    RAISE NOTICE '🚀 Ready to test at: http://localhost:3001/restaurant';
END $$;