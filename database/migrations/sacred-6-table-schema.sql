-- HERA Sacred 6-Table Schema
-- This is the ONLY valid schema for HERA - no additional tables allowed
-- Version: 2.0.0 (Strict 6-Table Architecture)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CORE_ORGANIZATIONS - Multi-tenant isolation
CREATE TABLE IF NOT EXISTS public.core_organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_name character varying NOT NULL,
  organization_code character varying NOT NULL,
  organization_type character varying NOT NULL,
  industry_classification character varying,
  parent_organization_id uuid,
  ai_insights jsonb DEFAULT '{}'::jsonb,
  ai_classification character varying,
  ai_confidence numeric DEFAULT 0.0000,
  settings jsonb DEFAULT '{}'::jsonb,
  status character varying DEFAULT 'active'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT core_organizations_pkey PRIMARY KEY (id),
  CONSTRAINT core_organizations_organization_code_key UNIQUE (organization_code),
  CONSTRAINT core_organizations_parent_organization_id_fkey FOREIGN KEY (parent_organization_id) REFERENCES public.core_organizations(id)
);

-- 2. CORE_ENTITIES - All business objects (customers, products, accounts, etc.)
CREATE TABLE IF NOT EXISTS public.core_entities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  entity_type character varying NOT NULL,
  entity_name character varying NOT NULL,
  entity_code character varying,
  entity_description text,
  parent_entity_id uuid,
  smart_code character varying NOT NULL,
  smart_code_status character varying DEFAULT 'active'::character varying,
  ai_confidence numeric DEFAULT 0.0000,
  ai_classification character varying,
  ai_insights jsonb DEFAULT '{}'::jsonb,
  business_rules jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  tags text[],
  status character varying DEFAULT 'active'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  version integer DEFAULT 1,
  CONSTRAINT core_entities_pkey PRIMARY KEY (id),
  CONSTRAINT core_entities_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.core_organizations(id),
  CONSTRAINT core_entities_parent_entity_id_fkey FOREIGN KEY (parent_entity_id) REFERENCES public.core_entities(id),
  CONSTRAINT core_entities_smart_code_check CHECK ((smart_code ~* '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'::text))
);

-- 3. CORE_DYNAMIC_DATA - Unlimited custom fields without schema changes
CREATE TABLE IF NOT EXISTS public.core_dynamic_data (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  entity_id uuid NOT NULL,
  field_name character varying NOT NULL,
  field_type character varying NOT NULL CHECK (field_type IN ('text', 'number', 'boolean', 'date', 'datetime', 'json', 'file')),
  field_value_text text,
  field_value_number numeric,
  field_value_boolean boolean,
  field_value_date date,
  field_value_json jsonb,
  field_value_file_url text,
  calculated_value jsonb,
  smart_code character varying,
  smart_code_status character varying DEFAULT 'active'::character varying,
  ai_confidence numeric DEFAULT 0.0000,
  ai_enhanced_value jsonb,
  ai_insights jsonb DEFAULT '{}'::jsonb,
  validation_rules jsonb DEFAULT '{}'::jsonb,
  validation_status character varying DEFAULT 'valid'::character varying,
  field_order integer DEFAULT 0,
  is_searchable boolean DEFAULT true,
  is_required boolean DEFAULT false,
  is_system_field boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  version integer DEFAULT 1,
  CONSTRAINT core_dynamic_data_pkey PRIMARY KEY (id),
  CONSTRAINT core_dynamic_data_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.core_organizations(id),
  CONSTRAINT core_dynamic_data_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(id) ON DELETE CASCADE,
  CONSTRAINT core_dynamic_data_unique_field UNIQUE (organization_id, entity_id, field_name)
);

-- 4. CORE_RELATIONSHIPS - Entity connections and workflows
CREATE TABLE IF NOT EXISTS public.core_relationships (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  from_entity_id uuid NOT NULL,
  to_entity_id uuid NOT NULL,
  relationship_type character varying NOT NULL,
  relationship_direction character varying DEFAULT 'directed'::character varying,
  relationship_strength numeric DEFAULT 1.0,
  relationship_data jsonb DEFAULT '{}'::jsonb,
  smart_code character varying NOT NULL,
  smart_code_status character varying DEFAULT 'active'::character varying,
  ai_confidence numeric DEFAULT 0.0000,
  ai_classification character varying,
  ai_insights jsonb DEFAULT '{}'::jsonb,
  business_logic jsonb DEFAULT '{}'::jsonb,
  validation_rules jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  effective_date timestamp with time zone DEFAULT now(),
  expiration_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  version integer DEFAULT 1,
  CONSTRAINT core_relationships_pkey PRIMARY KEY (id),
  CONSTRAINT core_relationships_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.core_organizations(id),
  CONSTRAINT core_relationships_from_entity_id_fkey FOREIGN KEY (from_entity_id) REFERENCES public.core_entities(id) ON DELETE CASCADE,
  CONSTRAINT core_relationships_to_entity_id_fkey FOREIGN KEY (to_entity_id) REFERENCES public.core_entities(id) ON DELETE CASCADE,
  CONSTRAINT core_relationships_unique_relationship UNIQUE (organization_id, from_entity_id, to_entity_id, relationship_type)
);

-- 5. UNIVERSAL_TRANSACTIONS - All business transactions
CREATE TABLE IF NOT EXISTS public.universal_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  transaction_type character varying NOT NULL,
  transaction_code character varying NOT NULL,
  transaction_date timestamp with time zone DEFAULT now(),
  source_entity_id uuid,
  target_entity_id uuid,
  total_amount numeric DEFAULT 0.00,
  transaction_status character varying DEFAULT 'draft'::character varying,
  reference_number character varying,
  external_reference character varying,
  smart_code character varying NOT NULL,
  smart_code_status character varying DEFAULT 'active'::character varying,
  ai_confidence numeric DEFAULT 0.0000,
  ai_classification character varying,
  ai_insights jsonb DEFAULT '{}'::jsonb,
  business_context jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  approval_required boolean DEFAULT false,
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  version integer DEFAULT 1,
  -- Multi-currency fields
  transaction_currency_code character varying(3) DEFAULT 'USD'::character varying,
  base_currency_code character varying(3) DEFAULT 'USD'::character varying,
  exchange_rate numeric DEFAULT 1.0000,
  exchange_rate_date date,
  exchange_rate_type character varying DEFAULT 'spot'::character varying,
  -- Fiscal period fields
  fiscal_period_entity_id uuid,
  fiscal_year integer,
  fiscal_period integer,
  posting_period_code character varying,
  CONSTRAINT universal_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT universal_transactions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.core_organizations(id),
  CONSTRAINT universal_transactions_source_entity_id_fkey FOREIGN KEY (source_entity_id) REFERENCES public.core_entities(id),
  CONSTRAINT universal_transactions_target_entity_id_fkey FOREIGN KEY (target_entity_id) REFERENCES public.core_entities(id),
  CONSTRAINT universal_transactions_unique_code UNIQUE (organization_id, transaction_code)
);

-- 6. UNIVERSAL_TRANSACTION_LINES - Transaction details
CREATE TABLE IF NOT EXISTS public.universal_transaction_lines (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  transaction_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  line_number integer NOT NULL,
  line_type character varying NOT NULL,
  line_entity_id uuid,
  line_description text NOT NULL,
  quantity numeric DEFAULT 1.0000,
  unit_of_measure character varying,
  unit_price numeric DEFAULT 0.0000,
  line_amount numeric DEFAULT 0.0000,
  -- Financial fields
  debit_amount numeric DEFAULT 0.0000,
  credit_amount numeric DEFAULT 0.0000,
  gl_account_entity_id uuid, -- Points to account entity with entity_type='account'
  cost_center_entity_id uuid,
  project_entity_id uuid,
  -- Tax fields
  tax_code character varying,
  tax_percentage numeric DEFAULT 0.0000,
  tax_amount numeric DEFAULT 0.0000,
  -- Smart code and AI
  smart_code character varying NOT NULL,
  smart_code_status character varying DEFAULT 'active'::character varying,
  ai_confidence numeric DEFAULT 0.0000,
  ai_classification character varying,
  ai_insights jsonb DEFAULT '{}'::jsonb,
  -- Metadata
  line_metadata jsonb DEFAULT '{}'::jsonb,
  validation_status character varying DEFAULT 'valid'::character varying,
  -- Audit fields
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  version integer DEFAULT 1,
  CONSTRAINT universal_transaction_lines_pkey PRIMARY KEY (id),
  CONSTRAINT universal_transaction_lines_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.universal_transactions(id) ON DELETE CASCADE,
  CONSTRAINT universal_transaction_lines_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.core_organizations(id),
  CONSTRAINT universal_transaction_lines_line_entity_id_fkey FOREIGN KEY (line_entity_id) REFERENCES public.core_entities(id),
  CONSTRAINT universal_transaction_lines_gl_account_entity_id_fkey FOREIGN KEY (gl_account_entity_id) REFERENCES public.core_entities(id),
  CONSTRAINT universal_transaction_lines_unique_line UNIQUE (transaction_id, line_number)
);

-- Indexes for performance
CREATE INDEX idx_core_entities_org_type ON public.core_entities(organization_id, entity_type);
CREATE INDEX idx_core_entities_smart_code ON public.core_entities(smart_code);
CREATE INDEX idx_core_entities_parent ON public.core_entities(parent_entity_id);
CREATE INDEX idx_core_entities_business_rules ON public.core_entities USING gin(business_rules);

CREATE INDEX idx_core_dynamic_org_entity ON public.core_dynamic_data(organization_id, entity_id);
CREATE INDEX idx_core_dynamic_field_name ON public.core_dynamic_data(field_name);
CREATE INDEX idx_core_dynamic_searchable ON public.core_dynamic_data(is_searchable, field_value_text);

CREATE INDEX idx_core_relationships_from ON public.core_relationships(from_entity_id);
CREATE INDEX idx_core_relationships_to ON public.core_relationships(to_entity_id);
CREATE INDEX idx_core_relationships_type ON public.core_relationships(relationship_type);

CREATE INDEX idx_universal_transactions_org ON public.universal_transactions(organization_id);
CREATE INDEX idx_universal_transactions_type ON public.universal_transactions(transaction_type);
CREATE INDEX idx_universal_transactions_date ON public.universal_transactions(transaction_date);
CREATE INDEX idx_universal_transactions_status ON public.universal_transactions(transaction_status);

CREATE INDEX idx_universal_lines_transaction ON public.universal_transaction_lines(transaction_id);
CREATE INDEX idx_universal_lines_gl_account ON public.universal_transaction_lines(gl_account_entity_id);

-- Row Level Security (RLS) Policies
ALTER TABLE core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (expand based on your auth system)
CREATE POLICY "Organizations are viewable by authenticated users" ON core_organizations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Entities are viewable by organization members" ON core_entities
  FOR ALL USING (organization_id IN (
    SELECT id FROM core_organizations WHERE auth.uid() IS NOT NULL
  ));

-- Comments documenting the sacred architecture
COMMENT ON SCHEMA public IS 'HERA Sacred 6-Table Architecture - NO additional tables allowed';
COMMENT ON TABLE core_entities IS 'Universal entity table. Use entity_type=''account'' with business_rules.ledger_type=''GL'' for GL accounts. Never create separate tables.';
COMMENT ON COLUMN core_entities.entity_type IS 'Free-text entity type. Common values: customer, vendor, product, account, employee, project, etc.';
COMMENT ON COLUMN core_entities.business_rules IS 'JSON rules including ledger_type for accounts, posting rules, workflow rules, etc.';
COMMENT ON COLUMN universal_transaction_lines.gl_account_entity_id IS 'References account entity in core_entities where entity_type=''account'' and business_rules.ledger_type=''GL''';