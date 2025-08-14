-- HERA Supabase Schema Recreation Script
-- Generated: 2025-08-04T13:07:27.936Z
-- Original Project: hsumtzuqzoqccpjiaikh
--
-- This script recreates the HERA Universal 6-Table Architecture
-- Run this in your new Supabase project's SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- HERA Universal 6-Table Architecture
-- ===================================

-- 1. Core Organizations (Multi-tenant isolation)
CREATE TABLE IF NOT EXISTS public.core_organizations (
  organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  organization_code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active'
);

-- 2. Core Entities (All business objects)
CREATE TABLE IF NOT EXISTS public.core_entities (
  entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.core_organizations(organization_id),
  entity_type VARCHAR(50) NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  entity_code VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  smart_code VARCHAR(100),
  confidence_score DECIMAL(3,2),
  classification JSONB
);

-- 3. Core Dynamic Data (Unlimited custom fields)
CREATE TABLE IF NOT EXISTS public.core_dynamic_data (
  dynamic_data_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.core_entities(entity_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.core_organizations(organization_id),
  field_name VARCHAR(100) NOT NULL,
  field_value TEXT,
  field_type VARCHAR(50) DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Core Relationships (Entity connections)
CREATE TABLE IF NOT EXISTS public.core_relationships (
  relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.core_organizations(organization_id),
  parent_entity_id UUID NOT NULL REFERENCES public.core_entities(entity_id),
  child_entity_id UUID NOT NULL REFERENCES public.core_entities(entity_id),
  relationship_type VARCHAR(50) NOT NULL,
  relationship_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active'
);

-- 5. Universal Transactions (All business transactions)
CREATE TABLE IF NOT EXISTS public.universal_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.core_organizations(organization_id),
  transaction_type VARCHAR(50) NOT NULL,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  reference_number VARCHAR(100),
  total_amount DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  smart_code VARCHAR(100),
  metadata JSONB
);

-- 6. Universal Transaction Lines (Transaction details)
CREATE TABLE IF NOT EXISTS public.universal_transaction_lines (
  line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.universal_transactions(transaction_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.core_organizations(organization_id),
  line_type VARCHAR(50) NOT NULL,
  entity_id UUID REFERENCES public.core_entities(entity_id),
  quantity DECIMAL(15,4),
  unit_price DECIMAL(15,2),
  line_total DECIMAL(15,2),
  line_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universal_transaction_lines ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_core_entities_org_type ON public.core_entities(organization_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_core_entities_code ON public.core_entities(entity_code);
CREATE INDEX IF NOT EXISTS idx_dynamic_data_entity ON public.core_dynamic_data(entity_id, field_name);
CREATE INDEX IF NOT EXISTS idx_transactions_org_type ON public.universal_transactions(organization_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_lines_txn ON public.universal_transaction_lines(transaction_id);

-- RLS Policies (Basic - customize as needed)
-- Organizations: Users can only see their own organization
CREATE POLICY "org_isolation" ON public.core_organizations
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Entities: Multi-tenant isolation
CREATE POLICY "entity_org_isolation" ON public.core_entities
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Dynamic Data: Multi-tenant isolation
CREATE POLICY "dynamic_data_org_isolation" ON public.core_dynamic_data
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Relationships: Multi-tenant isolation
CREATE POLICY "relationships_org_isolation" ON public.core_relationships
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Transactions: Multi-tenant isolation
CREATE POLICY "transactions_org_isolation" ON public.universal_transactions
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Transaction Lines: Multi-tenant isolation
CREATE POLICY "transaction_lines_org_isolation" ON public.universal_transaction_lines
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);


-- Sample Data (Optional - uncomment to insert)
/*

-- Sample data for core_entities
INSERT INTO public.core_entities (id, organization_id, entity_type, entity_name, entity_code, entity_category, entity_subcategory, description, tags, status, effective_date, expiry_date, metadata, ai_confidence, ai_classification, ai_tags, parent_entity_id, hierarchy_level, sort_order, created_at, updated_at, created_by, updated_by, version, auth_user_id, is_system_user, last_login_at, login_count, smart_code, smart_code_version, smart_code_status) VALUES ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'menu_item', 'Margherita Pizza', 'PIZZA_MARG', NULL, NULL, NULL, NULL, 'active', '2025-07-29', NULL, '{}', 0, NULL, NULL, NULL, 0, 0, '2025-07-29T08:16:22.388167+00:00', '2025-07-29T08:16:22.388167+00:00', NULL, NULL, 1, NULL, false, NULL, 0, NULL, 'v1', 'DRAFT');
INSERT INTO public.core_entities (id, organization_id, entity_type, entity_name, entity_code, entity_category, entity_subcategory, description, tags, status, effective_date, expiry_date, metadata, ai_confidence, ai_classification, ai_tags, parent_entity_id, hierarchy_level, sort_order, created_at, updated_at, created_by, updated_by, version, auth_user_id, is_system_user, last_login_at, login_count, smart_code, smart_code_version, smart_code_status) VALUES ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'menu_item', 'Spaghetti Carbonara', 'PASTA_CARB', NULL, NULL, NULL, NULL, 'active', '2025-07-29', NULL, '{}', 0, NULL, NULL, NULL, 0, 0, '2025-07-29T08:16:22.388167+00:00', '2025-07-29T08:16:22.388167+00:00', NULL, NULL, 1, NULL, false, NULL, 0, NULL, 'v1', 'DRAFT');
INSERT INTO public.core_entities (id, organization_id, entity_type, entity_name, entity_code, entity_category, entity_subcategory, description, tags, status, effective_date, expiry_date, metadata, ai_confidence, ai_classification, ai_tags, parent_entity_id, hierarchy_level, sort_order, created_at, updated_at, created_by, updated_by, version, auth_user_id, is_system_user, last_login_at, login_count, smart_code, smart_code_version, smart_code_status) VALUES ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', 'menu_item', 'Caesar Salad', 'SALAD_CAES', NULL, NULL, NULL, NULL, 'active', '2025-07-29', NULL, '{}', 0, NULL, NULL, NULL, 0, 0, '2025-07-29T08:16:22.388167+00:00', '2025-07-29T08:16:22.388167+00:00', NULL, NULL, 1, NULL, false, NULL, 0, NULL, 'v1', 'DRAFT');
INSERT INTO public.core_entities (id, organization_id, entity_type, entity_name, entity_code, entity_category, entity_subcategory, description, tags, status, effective_date, expiry_date, metadata, ai_confidence, ai_classification, ai_tags, parent_entity_id, hierarchy_level, sort_order, created_at, updated_at, created_by, updated_by, version, auth_user_id, is_system_user, last_login_at, login_count, smart_code, smart_code_version, smart_code_status) VALUES ('3bbf81db-3ea9-40c9-99a7-456b2fa4ea17', '550e8400-e29b-41d4-a716-446655440000', 'menu_item', 'Margherita Pizza', 'MARGHERITA_PIZZA', NULL, NULL, NULL, NULL, 'active', '2025-07-29', NULL, '{}', 0, NULL, NULL, NULL, 0, 0, '2025-07-29T08:49:19.335733+00:00', '2025-07-29T08:49:19.335733+00:00', NULL, NULL, 1, NULL, false, NULL, 0, NULL, 'v1', 'DRAFT');
INSERT INTO public.core_entities (id, organization_id, entity_type, entity_name, entity_code, entity_category, entity_subcategory, description, tags, status, effective_date, expiry_date, metadata, ai_confidence, ai_classification, ai_tags, parent_entity_id, hierarchy_level, sort_order, created_at, updated_at, created_by, updated_by, version, auth_user_id, is_system_user, last_login_at, login_count, smart_code, smart_code_version, smart_code_status) VALUES ('0f48f15d-8da0-4040-a031-36a1a9aad781', '550e8400-e29b-41d4-a716-446655440000', 'menu_item', 'Margarita Pizza', 'M', NULL, NULL, NULL, NULL, 'active', '2025-07-29', NULL, '{}', 0, NULL, NULL, NULL, 0, 0, '2025-07-29T08:56:55.548781+00:00', '2025-07-29T08:56:55.548781+00:00', NULL, NULL, 1, NULL, false, NULL, 0, NULL, 'v1', 'DRAFT');

-- Sample data for core_dynamic_data
INSERT INTO public.core_dynamic_data (id, organization_id, entity_id, field_name, field_label, field_description, field_type, field_category, field_value, field_value_number, field_value_boolean, field_value_date, field_value_datetime, field_value_json, display_order, is_required, is_searchable, validation_rules, ai_enhanced_value, ai_confidence, validation_status, created_at, updated_at, created_by, updated_by, smart_code, smart_code_context) VALUES ('d3726eb4-30a3-4af4-80a2-786d9abea4c6', '550e8400-e29b-41d4-a716-446655440000', '08e24d75-7209-4e3a-a62e-f1c7956f06ea', 'price', NULL, NULL, 'decimal', NULL, '4', NULL, NULL, NULL, NULL, NULL, 0, false, false, '{}', NULL, 0, 'pending', '2025-07-29T09:35:53.677212+00:00', '2025-07-29T09:35:53.677212+00:00', NULL, NULL, NULL, NULL);
INSERT INTO public.core_dynamic_data (id, organization_id, entity_id, field_name, field_label, field_description, field_type, field_category, field_value, field_value_number, field_value_boolean, field_value_date, field_value_datetime, field_value_json, display_order, is_required, is_searchable, validation_rules, ai_enhanced_value, ai_confidence, validation_status, created_at, updated_at, created_by, updated_by, smart_code, smart_code_context) VALUES ('24622125-082b-49cf-8e8c-94daa7051e6b', '550e8400-e29b-41d4-a716-446655440000', '08e24d75-7209-4e3a-a62e-f1c7956f06ea', 'description', NULL, NULL, 'text', NULL, 'Delicious Dosa', NULL, NULL, NULL, NULL, NULL, 0, false, false, '{}', NULL, 0, 'pending', '2025-07-29T09:35:53.677212+00:00', '2025-07-29T09:35:53.677212+00:00', NULL, NULL, NULL, NULL);
INSERT INTO public.core_dynamic_data (id, organization_id, entity_id, field_name, field_label, field_description, field_type, field_category, field_value, field_value_number, field_value_boolean, field_value_date, field_value_datetime, field_value_json, display_order, is_required, is_searchable, validation_rules, ai_enhanced_value, ai_confidence, validation_status, created_at, updated_at, created_by, updated_by, smart_code, smart_code_context) VALUES ('0a61c273-655f-4a27-9d72-87efe07ecf73', '550e8400-e29b-41d4-a716-446655440000', '08e24d75-7209-4e3a-a62e-f1c7956f06ea', 'category', NULL, NULL, 'text', NULL, 'Appetizers', NULL, NULL, NULL, NULL, NULL, 0, false, false, '{}', NULL, 0, 'pending', '2025-07-29T09:35:53.677212+00:00', '2025-07-29T09:35:53.677212+00:00', NULL, NULL, NULL, NULL);
INSERT INTO public.core_dynamic_data (id, organization_id, entity_id, field_name, field_label, field_description, field_type, field_category, field_value, field_value_number, field_value_boolean, field_value_date, field_value_datetime, field_value_json, display_order, is_required, is_searchable, validation_rules, ai_enhanced_value, ai_confidence, validation_status, created_at, updated_at, created_by, updated_by, smart_code, smart_code_context) VALUES ('6cb00d47-f56f-4a81-85ee-1a4bb21b3b1f', '550e8400-e29b-41d4-a716-446655440000', '08e24d75-7209-4e3a-a62e-f1c7956f06ea', 'prep_time', NULL, NULL, 'integer', NULL, '10', NULL, NULL, NULL, NULL, NULL, 0, false, false, '{}', NULL, 0, 'pending', '2025-07-29T09:35:53.677212+00:00', '2025-07-29T09:35:53.677212+00:00', NULL, NULL, NULL, NULL);
INSERT INTO public.core_dynamic_data (id, organization_id, entity_id, field_name, field_label, field_description, field_type, field_category, field_value, field_value_number, field_value_boolean, field_value_date, field_value_datetime, field_value_json, display_order, is_required, is_searchable, validation_rules, ai_enhanced_value, ai_confidence, validation_status, created_at, updated_at, created_by, updated_by, smart_code, smart_code_context) VALUES ('080da782-8080-4cf0-aeb7-5cc40768847a', '550e8400-e29b-41d4-a716-446655440000', '08e24d75-7209-4e3a-a62e-f1c7956f06ea', 'dietary_tags', NULL, NULL, 'json', NULL, '["vegetarian"]', NULL, NULL, NULL, NULL, NULL, 0, false, false, '{}', NULL, 0, 'pending', '2025-07-29T09:35:53.677212+00:00', '2025-07-29T09:35:53.677212+00:00', NULL, NULL, NULL, NULL);

-- Sample data for core_organizations
INSERT INTO public.core_organizations (id, organization_name, organization_code, organization_type, industry, business_size, tax_id, registration_number, email, phone, website, address, status, subscription_tier, settings, ai_insights, ai_classification, ai_confidence, created_at, updated_at, created_by, updated_by, version, client_id, legal_entity_name, subsidiary_type, country_code, region, regulatory_requirements, intercompany_code, consolidation_method, functional_currency, reporting_currency, auth_provider, subscription_plan, max_users, auth_settings) VALUES ('719dfed1-09b4-4ca8-bfda-f682460de945', 'HERA System Organization', 'HERA-SYS-1753709453.408411', 'system', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 'starter', '{"system":true,"doc_type":"system","client_id":"94bff0ab-f605-449a-9e86-2514d5f39428","client_name":"HERA System Client","created_for":"auto_documentation","access_level":"internal","auto_generated":true}', '{"purpose":"system_documentation","confidence":1,"classification":"system_organization"}', 'system_organization', 1, '2025-07-28T13:30:53.408411+00:00', '2025-07-28T13:30:53.408411+00:00', NULL, NULL, 1, '94bff0ab-f605-449a-9e86-2514d5f39428', NULL, NULL, NULL, NULL, '{}', 'HERA-SYS-1753709453.408411_IC', 'full', 'USD', 'USD', 'supabase', 'starter', 5, '{}');
INSERT INTO public.core_organizations (id, organization_name, organization_code, organization_type, industry, business_size, tax_id, registration_number, email, phone, website, address, status, subscription_tier, settings, ai_insights, ai_classification, ai_confidence, created_at, updated_at, created_by, updated_by, version, client_id, legal_entity_name, subsidiary_type, country_code, region, regulatory_requirements, intercompany_code, consolidation_method, functional_currency, reporting_currency, auth_provider, subscription_plan, max_users, auth_settings) VALUES ('7aad4cfa-c207-4af6-9564-6da8e9299d42', 'Mario''s Italian Restaurant', 'MARIO-ITALIAN-001', 'restaurant', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 'starter', '{"cuisine":"italian","seating":120}', '{}', NULL, 0, '2025-07-28T15:17:34.039574+00:00', '2025-07-28T15:17:34.039574+00:00', NULL, NULL, 1, '7d2be253-dbef-497e-a3b8-424e89c5cb30', NULL, NULL, NULL, NULL, '{}', 'MARIO-ITALIAN-001_IC', 'full', 'USD', 'USD', 'supabase', 'starter', 5, '{}');
INSERT INTO public.core_organizations (id, organization_name, organization_code, organization_type, industry, business_size, tax_id, registration_number, email, phone, website, address, status, subscription_tier, settings, ai_insights, ai_classification, ai_confidence, created_at, updated_at, created_by, updated_by, version, client_id, legal_entity_name, subsidiary_type, country_code, region, regulatory_requirements, intercompany_code, consolidation_method, functional_currency, reporting_currency, auth_provider, subscription_plan, max_users, auth_settings) VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Mario''s Italian Bistro', 'MARIO_BISTRO', 'restaurant', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 'starter', '{}', '{}', NULL, 0, '2025-07-29T06:56:17.026598+00:00', '2025-07-29T09:01:21.530241+00:00', NULL, NULL, 2, '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, NULL, NULL, '{}', 'MARIO_BISTRO_IC', 'full', 'USD', 'USD', 'supabase', 'professional', 5, '{}');

-- Sample data for universal_transactions
INSERT INTO public.universal_transactions (id, organization_id, transaction_type, transaction_number, transaction_date, reference_number, external_reference, source_entity_id, target_entity_id, total_amount, tax_amount, discount_amount, net_amount, currency, status, workflow_state, priority, department, project_code, cost_center, due_date, completed_date, description, notes, metadata, attachments, ai_insights, ai_risk_score, ai_anomaly_score, created_at, updated_at, created_by, updated_by, version, is_intercompany, intercompany_source_org, intercompany_target_org, intercompany_reference, elimination_required, session_id, user_agent, ip_address, smart_code, hera_task_id, business_context) VALUES ('2b9c1bb1-c635-4a9c-b1a7-f90cf9140722', '550e8400-e29b-41d4-a716-446655440000', 'order', 'TXN-891260', '2025-07-29', 'ORD-2025-891260', NULL, NULL, NULL, 18.5, 0, 0, 18.5, 'USD', 'pending', NULL, 'normal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '[]', '{}', 0, 0, '2025-07-29T08:14:51.723778+00:00', '2025-07-29T08:14:51.723778+00:00', NULL, NULL, 1, false, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.universal_transactions (id, organization_id, transaction_type, transaction_number, transaction_date, reference_number, external_reference, source_entity_id, target_entity_id, total_amount, tax_amount, discount_amount, net_amount, currency, status, workflow_state, priority, department, project_code, cost_center, due_date, completed_date, description, notes, metadata, attachments, ai_insights, ai_risk_score, ai_anomaly_score, created_at, updated_at, created_by, updated_by, version, is_intercompany, intercompany_source_org, intercompany_target_org, intercompany_reference, elimination_required, session_id, user_agent, ip_address, smart_code, hera_task_id, business_context) VALUES ('b3199a88-d7ea-4c1d-b39a-4160c5a5daa0', '550e8400-e29b-41d4-a716-446655440000', 'order', 'TXN-910058', '2025-07-29', 'ORD-2025-910058', NULL, NULL, NULL, 18.5, 0, 0, 18.5, 'USD', 'pending', NULL, 'normal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '[]', '{}', 0, 0, '2025-07-29T08:15:10.325973+00:00', '2025-07-29T08:15:10.325973+00:00', NULL, NULL, 1, false, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.universal_transactions (id, organization_id, transaction_type, transaction_number, transaction_date, reference_number, external_reference, source_entity_id, target_entity_id, total_amount, tax_amount, discount_amount, net_amount, currency, status, workflow_state, priority, department, project_code, cost_center, due_date, completed_date, description, notes, metadata, attachments, ai_insights, ai_risk_score, ai_anomaly_score, created_at, updated_at, created_by, updated_by, version, is_intercompany, intercompany_source_org, intercompany_target_org, intercompany_reference, elimination_required, session_id, user_agent, ip_address, smart_code, hera_task_id, business_context) VALUES ('2f051211-f80d-4ea9-94b0-0b81d565cd7c', '550e8400-e29b-41d4-a716-446655440000', 'order', 'TXN-044683', '2025-07-29', 'ORD-2025-044683', NULL, NULL, NULL, 0, 0, 0, 0, 'USD', 'pending', NULL, 'normal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '[]', '{}', 0, 0, '2025-07-29T09:24:05.017023+00:00', '2025-07-29T09:24:05.017023+00:00', NULL, NULL, 1, false, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.universal_transactions (id, organization_id, transaction_type, transaction_number, transaction_date, reference_number, external_reference, source_entity_id, target_entity_id, total_amount, tax_amount, discount_amount, net_amount, currency, status, workflow_state, priority, department, project_code, cost_center, due_date, completed_date, description, notes, metadata, attachments, ai_insights, ai_risk_score, ai_anomaly_score, created_at, updated_at, created_by, updated_by, version, is_intercompany, intercompany_source_org, intercompany_target_org, intercompany_reference, elimination_required, session_id, user_agent, ip_address, smart_code, hera_task_id, business_context) VALUES ('371baca0-1a52-4623-b8a8-ed5fa3c20f2b', '550e8400-e29b-41d4-a716-446655440000', 'order', 'TXN-875833', '2025-07-29', 'ORD-2025-875833', NULL, NULL, NULL, 18.5, 0, 0, 18.5, 'USD', 'approved', NULL, 'normal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '[]', '{}', 0, 0, '2025-07-29T08:14:36.047948+00:00', '2025-07-29T16:04:27.991761+00:00', NULL, NULL, 3, false, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.universal_transactions (id, organization_id, transaction_type, transaction_number, transaction_date, reference_number, external_reference, source_entity_id, target_entity_id, total_amount, tax_amount, discount_amount, net_amount, currency, status, workflow_state, priority, department, project_code, cost_center, due_date, completed_date, description, notes, metadata, attachments, ai_insights, ai_risk_score, ai_anomaly_score, created_at, updated_at, created_by, updated_by, version, is_intercompany, intercompany_source_org, intercompany_target_org, intercompany_reference, elimination_required, session_id, user_agent, ip_address, smart_code, hera_task_id, business_context) VALUES ('0cf40b48-4cd1-4311-95b3-f472462e54bb', '550e8400-e29b-41d4-a716-446655440000', 'purchase_order', 'PO-2025-322784', '2025-07-29', NULL, NULL, '64da19af-b8ed-4a66-900a-749cac4adf91', NULL, 1250, 0, 0, 1250, 'USD', 'draft', NULL, 'normal', NULL, NULL, NULL, NULL, NULL, 'Urgent order for production line maintenance', NULL, '{"created_by":"current_user_id","payment_terms":"NET30","expected_delivery":"2025-08-15"}', '[]', '{}', 0, 0, '2025-07-29T16:58:42.991369+00:00', '2025-07-29T16:58:42.991369+00:00', NULL, NULL, 1, false, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL);

-- Sample data for universal_transaction_lines
INSERT INTO public.universal_transaction_lines (id, transaction_id, organization_id, entity_id, line_description, line_order, quantity, unit_of_measure, unit_price, line_amount, discount_percentage, discount_amount, tax_code, tax_percentage, tax_amount, net_line_amount, gl_account_code, cost_center, department, project_code, delivery_date, service_period_start, service_period_end, notes, metadata, ai_gl_suggestion, ai_confidence, ai_cost_prediction, ai_margin_analysis, created_at, updated_at, created_by, updated_by, smart_code, line_context) VALUES ('c4f7df77-e6b3-43a9-a063-f2d11a89375b', '2f051211-f80d-4ea9-94b0-0b81d565cd7c', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', 'Caesar Salad', 1, 1, NULL, 0, 0, 0, 0, NULL, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, 0, NULL, '{}', '2025-07-29T09:24:05.268171+00:00', '2025-07-29T09:24:05.268171+00:00', NULL, NULL, NULL, NULL);
INSERT INTO public.universal_transaction_lines (id, transaction_id, organization_id, entity_id, line_description, line_order, quantity, unit_of_measure, unit_price, line_amount, discount_percentage, discount_amount, tax_code, tax_percentage, tax_amount, net_line_amount, gl_account_code, cost_center, department, project_code, delivery_date, service_period_start, service_period_end, notes, metadata, ai_gl_suggestion, ai_confidence, ai_cost_prediction, ai_margin_analysis, created_at, updated_at, created_by, updated_by, smart_code, line_context) VALUES ('6b5658da-ce91-4f6a-810a-ff9307e5e37b', '0cf40b48-4cd1-4311-95b3-f472462e54bb', '550e8400-e29b-41d4-a716-446655440000', 'eee6e00f-6d92-4f7d-9c87-f926e1f892e4', 'Industrial Ball Bearings', 1, 100, 'each', 12.5, 1250, 0, 0, NULL, 0, 0, 1250, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"notes":"Need premium grade","product_code":"BEAR_6205","product_name":"Industrial Ball Bearings","unit_of_measure":"each","expected_delivery":"2025-08-15"}', NULL, 0, NULL, '{}', '2025-07-29T16:58:43.138522+00:00', '2025-07-29T16:58:43.138522+00:00', NULL, NULL, NULL, NULL);
INSERT INTO public.universal_transaction_lines (id, transaction_id, organization_id, entity_id, line_description, line_order, quantity, unit_of_measure, unit_price, line_amount, discount_percentage, discount_amount, tax_code, tax_percentage, tax_amount, net_line_amount, gl_account_code, cost_center, department, project_code, delivery_date, service_period_start, service_period_end, notes, metadata, ai_gl_suggestion, ai_confidence, ai_cost_prediction, ai_margin_analysis, created_at, updated_at, created_by, updated_by, smart_code, line_context) VALUES ('c9eda5da-2bcc-4c87-8ad6-b57b7e8ed218', '70621a6b-99d2-4278-baf4-52dac53d0207', '550e8400-e29b-41d4-a716-446655440000', 'd80a302e-bd6f-421f-9609-ce0cf1ab037b', 'Electronic Resistor Pack', 1, 50, 'pack', 8.75, 437.5, 0, 0, NULL, 0, 0, 437.5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"notes":"","product_code":"PROD_ELECTRONIC_RESISTOR__3022","product_name":"Electronic Resistor Pack","unit_of_measure":"pack","expected_delivery":"2025-08-10"}', NULL, 0, NULL, '{}', '2025-07-29T17:02:35.729918+00:00', '2025-07-29T17:02:35.729918+00:00', NULL, NULL, NULL, NULL);
INSERT INTO public.universal_transaction_lines (id, transaction_id, organization_id, entity_id, line_description, line_order, quantity, unit_of_measure, unit_price, line_amount, discount_percentage, discount_amount, tax_code, tax_percentage, tax_amount, net_line_amount, gl_account_code, cost_center, department, project_code, delivery_date, service_period_start, service_period_end, notes, metadata, ai_gl_suggestion, ai_confidence, ai_cost_prediction, ai_margin_analysis, created_at, updated_at, created_by, updated_by, smart_code, line_context) VALUES ('a3899e1d-eb20-401b-a2fe-e9ab535073d1', '2981adec-9177-4c65-93e2-7bca1a85a2ab', '550e8400-e29b-41d4-a716-446655440000', '08e24d75-7209-4e3a-a62e-f1c7956f06ea', 'Dosa', 1, 2, NULL, 4, 0, 0, 0, NULL, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, 0, NULL, '{}', '2025-08-01T06:58:37.424344+00:00', '2025-08-01T06:58:37.424344+00:00', NULL, NULL, NULL, NULL);
INSERT INTO public.universal_transaction_lines (id, transaction_id, organization_id, entity_id, line_description, line_order, quantity, unit_of_measure, unit_price, line_amount, discount_percentage, discount_amount, tax_code, tax_percentage, tax_amount, net_line_amount, gl_account_code, cost_center, department, project_code, delivery_date, service_period_start, service_period_end, notes, metadata, ai_gl_suggestion, ai_confidence, ai_cost_prediction, ai_margin_analysis, created_at, updated_at, created_by, updated_by, smart_code, line_context) VALUES ('54ccb5b1-ac18-4976-9fea-5f3e46e13e07', '2981adec-9177-4c65-93e2-7bca1a85a2ab', '550e8400-e29b-41d4-a716-446655440000', 'fc0b5a28-4ec6-4d86-aa06-138a2a028987', 'Pathiri', 1, 1, NULL, 30, 0, 0, 0, NULL, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, 0, NULL, '{}', '2025-08-01T06:58:37.424344+00:00', '2025-08-01T06:58:37.424344+00:00', NULL, NULL, NULL, NULL);
*/

-- Post-Migration Steps:
-- 1. Update your .env.local with new Supabase credentials
-- 2. Test the HERA API endpoints
-- 3. Verify RLS policies are working
-- 4. Import any additional custom data

-- Your HERA Universal Architecture is now ready!
