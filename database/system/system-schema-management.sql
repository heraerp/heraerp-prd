-- =====================================================
-- HERA DNA System Schema Management
-- Separates System Schema (Metadata) from User Data
-- Smart Code: HERA.DNA.SYSTEM.SCHEMA.MANAGEMENT.v1
-- =====================================================

-- This schema handles the metadata that defines how the app works
-- System data comes from Supabase, User data can be CRUD by admins

-- =====================================================
-- SYSTEM SCHEMA TABLES (Read-Only for Users, Admin CRUD)
-- =====================================================

-- DNA Component Library (System-Defined)
CREATE TABLE public.dna_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Component Identity
    component_name TEXT NOT NULL UNIQUE,
    component_type TEXT NOT NULL CHECK (component_type IN (
        'layout', 'form', 'table', 'chart', 'navigation', 'specialized'
    )),
    category TEXT NOT NULL, -- 'universal', 'industry_specific', 'custom'
    
    -- Component Definition
    component_code TEXT NOT NULL, -- React component code
    props_schema JSONB NOT NULL, -- JSON schema for component props
    dependencies TEXT[] DEFAULT '{}', -- Other components this depends on
    
    -- DNA Metadata
    dna_pattern TEXT, -- DNA pattern this component implements
    reusability_score REAL DEFAULT 1.0 CHECK (reusability_score >= 0.0 AND reusability_score <= 1.0),
    complexity_level TEXT DEFAULT 'medium' CHECK (complexity_level IN ('low', 'medium', 'high')),
    
    -- Usage & Performance
    usage_count INTEGER DEFAULT 0,
    performance_score REAL DEFAULT 1.0,
    last_optimized_at TIMESTAMPTZ,
    
    -- Version & Status
    version TEXT NOT NULL DEFAULT '1.0.0',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'experimental')),
    
    -- Documentation
    description TEXT,
    usage_examples JSONB,
    documentation_url TEXT,
    
    -- Admin Management
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID, -- System admin who created this
    updated_by UUID,
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', component_name || ' ' || COALESCE(description, ''))
    ) STORED
);

-- DNA Templates Library (System-Defined Industry Templates)
CREATE TABLE public.dna_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template Identity
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL, -- 'industry', 'business_type', 'use_case'
    industry TEXT NOT NULL, -- 'restaurant', 'healthcare', 'retail', etc.
    
    -- Template Definition
    template_schema JSONB NOT NULL, -- Complete template structure
    component_mapping JSONB NOT NULL, -- Maps business requirements to components
    demo_data_generator TEXT, -- Function name to generate demo data
    
    -- Business Logic
    smart_codes TEXT[] NOT NULL, -- Smart codes this template uses
    business_rules JSONB, -- Template-specific business rules
    workflow_definitions JSONB, -- Standard workflows for this template
    
    -- Configuration
    required_components TEXT[] NOT NULL, -- Components required for this template
    optional_components TEXT[] DEFAULT '{}', -- Optional enhancement components
    configuration_schema JSONB, -- Schema for template configuration
    
    -- Metrics & Analytics
    usage_count INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0.0, -- Based on user feedback
    completion_time_avg INTEGER, -- Average setup time in seconds
    
    -- Quality Assurance
    test_coverage REAL DEFAULT 0.0,
    validation_rules JSONB,
    quality_score REAL DEFAULT 0.0,
    
    -- Admin Management
    version TEXT NOT NULL DEFAULT '1.0.0',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'beta')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Smart Code Definitions (System-Defined Business Intelligence)
CREATE TABLE public.smart_code_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Smart Code Identity
    smart_code TEXT NOT NULL UNIQUE, -- HERA.{INDUSTRY}.{MODULE}.{FUNCTION}.{TYPE}.v{VERSION}
    smart_code_pattern TEXT NOT NULL, -- Pattern for validation
    
    -- Code Structure
    industry TEXT NOT NULL,
    module_name TEXT NOT NULL,
    function_name TEXT NOT NULL,
    code_type TEXT NOT NULL,
    version TEXT NOT NULL,
    
    -- Business Logic Definition
    business_rules JSONB NOT NULL, -- Rules this smart code triggers
    gl_posting_rules JSONB, -- General Ledger posting rules
    validation_rules JSONB, -- Data validation rules
    automation_rules JSONB, -- Automation triggers
    
    -- AI Enhancement
    ai_classification_rules JSONB, -- AI classification logic
    ai_insights_config JSONB, -- AI insights configuration
    prediction_models JSONB, -- Associated prediction models
    
    -- Usage Context
    applicable_entities TEXT[], -- Entity types this applies to
    applicable_transactions TEXT[], -- Transaction types this applies to
    required_fields TEXT[], -- Required fields for this smart code
    
    -- Documentation
    description TEXT NOT NULL,
    examples JSONB,
    implementation_guide TEXT,
    
    -- Admin Management
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'experimental')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Entity Type Definitions (System-Defined Universal Entity Types)
CREATE TABLE public.entity_type_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Entity Type Identity
    entity_type TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'universal', 'industry_specific'
    
    -- Schema Definition
    base_fields JSONB NOT NULL, -- Required base fields
    optional_fields JSONB DEFAULT '{}', -- Optional standard fields
    industry_fields JSONB DEFAULT '{}', -- Industry-specific fields
    
    -- Validation & Business Rules
    validation_schema JSONB NOT NULL, -- JSON schema for validation
    business_rules JSONB, -- Entity-specific business rules
    workflow_rules JSONB, -- Workflow definitions
    
    -- UI Configuration
    form_layout JSONB, -- How forms should be rendered
    table_columns JSONB, -- Default table column configuration
    search_fields TEXT[], -- Fields to include in search
    
    -- Smart Code Integration
    default_smart_codes TEXT[], -- Default smart codes for this entity type
    ai_classification_hints JSONB, -- Hints for AI classification
    
    -- Relationships
    typical_relationships JSONB, -- Common relationships for this entity type
    hierarchy_support BOOLEAN DEFAULT false, -- Supports parent/child hierarchy
    
    -- Documentation
    description TEXT,
    usage_examples JSONB,
    best_practices TEXT,
    
    -- Admin Management
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'experimental')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Field Type Definitions (System-Defined Dynamic Field Types)
CREATE TABLE public.field_type_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Field Type Identity
    field_type TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'basic', 'advanced', 'industry_specific'
    
    -- Type Configuration
    data_type TEXT NOT NULL, -- 'text', 'number', 'boolean', 'date', 'json'
    validation_schema JSONB, -- JSON schema for validation
    format_rules JSONB, -- Formatting and display rules
    
    -- UI Configuration
    input_component TEXT NOT NULL, -- React component for input
    display_component TEXT, -- React component for display
    default_props JSONB DEFAULT '{}', -- Default component props
    
    -- Validation & Business Rules
    built_in_validations JSONB, -- Built-in validation rules
    business_logic JSONB, -- Associated business logic
    
    -- AI Integration
    ai_enhancement_rules JSONB, -- AI enhancement configuration
    auto_suggestion_logic JSONB, -- Auto-suggestion rules
    
    -- Usage Guidelines
    description TEXT,
    usage_examples JSONB,
    best_practices TEXT,
    
    -- Admin Management
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'experimental')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Business Rule Definitions (System-Defined Universal Rules)
CREATE TABLE public.business_rule_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Rule Identity
    rule_name TEXT NOT NULL UNIQUE,
    rule_category TEXT NOT NULL, -- 'validation', 'automation', 'calculation', 'workflow'
    rule_type TEXT NOT NULL, -- 'pre_save', 'post_save', 'trigger', 'scheduled'
    
    -- Rule Definition
    rule_logic JSONB NOT NULL, -- The actual rule logic
    condition_schema JSONB, -- When this rule applies
    action_schema JSONB, -- What actions to take
    
    -- Scope & Applicability
    applicable_entities TEXT[], -- Which entity types this applies to
    applicable_transactions TEXT[], -- Which transaction types this applies to
    smart_code_triggers TEXT[], -- Smart codes that trigger this rule
    
    -- Execution Configuration
    execution_order INTEGER DEFAULT 100, -- Order of execution
    execution_timeout INTEGER DEFAULT 30, -- Timeout in seconds
    retry_attempts INTEGER DEFAULT 3, -- Number of retries on failure
    
    -- Error Handling
    error_handling_strategy TEXT DEFAULT 'fail' CHECK (error_handling_strategy IN ('fail', 'warn', 'ignore')),
    fallback_logic JSONB, -- Logic to execute on failure
    
    -- Performance & Monitoring
    performance_target_ms INTEGER DEFAULT 1000, -- Target execution time
    monitoring_enabled BOOLEAN DEFAULT true,
    logging_level TEXT DEFAULT 'info' CHECK (logging_level IN ('debug', 'info', 'warn', 'error')),
    
    -- Documentation
    description TEXT NOT NULL,
    examples JSONB,
    troubleshooting_guide TEXT,
    
    -- Admin Management
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- =====================================================
-- USER CONFIGURATION TABLES (Admin CRUD)
-- =====================================================

-- Organization System Configuration (Admin Configurable)
CREATE TABLE public.organization_system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
    
    -- DNA Component Selections
    enabled_components JSONB NOT NULL DEFAULT '{}', -- Which DNA components are enabled
    component_configurations JSONB DEFAULT '{}', -- Custom configurations for components
    custom_components JSONB DEFAULT '{}', -- Organization-specific custom components
    
    -- Template Customizations
    active_templates TEXT[] DEFAULT '{}', -- Which templates are active
    template_customizations JSONB DEFAULT '{}', -- Template-specific customizations
    custom_templates JSONB DEFAULT '{}', -- Organization-created templates
    
    -- Entity Type Customizations
    enabled_entity_types TEXT[] NOT NULL, -- Which entity types are enabled
    entity_type_customizations JSONB DEFAULT '{}', -- Custom entity type configurations
    custom_entity_types JSONB DEFAULT '{}', -- Organization-specific entity types
    
    -- Field Type Selections
    enabled_field_types TEXT[] NOT NULL, -- Which field types are available
    field_type_customizations JSONB DEFAULT '{}', -- Custom field type configurations
    custom_field_types JSONB DEFAULT '{}', -- Organization-specific field types
    
    -- Business Rule Selections
    enabled_business_rules TEXT[] NOT NULL, -- Which business rules are active
    business_rule_overrides JSONB DEFAULT '{}', -- Custom rule configurations
    custom_business_rules JSONB DEFAULT '{}', -- Organization-specific rules
    
    -- Smart Code Configuration
    smart_code_mappings JSONB DEFAULT '{}', -- Custom smart code mappings
    smart_code_overrides JSONB DEFAULT '{}', -- Override system smart codes
    
    -- UI/UX Customizations
    theme_configuration JSONB DEFAULT '{}', -- Custom theme settings
    layout_preferences JSONB DEFAULT '{}', -- Layout customizations
    navigation_configuration JSONB DEFAULT '{}', -- Navigation customizations
    
    -- Feature Flags
    feature_flags JSONB DEFAULT '{}', -- Enable/disable specific features
    experimental_features JSONB DEFAULT '{}', -- Opt-in experimental features
    
    -- Admin Management
    configured_by UUID NOT NULL, -- Admin who configured this
    approved_by UUID, -- Admin who approved configuration
    configuration_version INTEGER DEFAULT 1,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one config per organization
    UNIQUE(organization_id)
);

-- User Entity Field Selections (Admin Configurable per Entity Type)
CREATE TABLE public.user_entity_field_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
    
    -- Field Selection Context
    entity_type TEXT NOT NULL,
    field_selection_name TEXT NOT NULL, -- e.g., "Customer Form", "Product Catalog"
    selection_type TEXT NOT NULL CHECK (selection_type IN ('form', 'table', 'search', 'report')),
    
    -- Field Configuration
    selected_fields JSONB NOT NULL, -- Which fields to show/use
    field_order INTEGER[], -- Order of fields
    field_configurations JSONB DEFAULT '{}', -- Per-field configurations
    
    -- Display Configuration
    display_rules JSONB DEFAULT '{}', -- When/how to display fields
    validation_overrides JSONB DEFAULT '{}', -- Organization-specific validation
    
    -- User Experience
    required_fields TEXT[] DEFAULT '{}', -- Fields required for this organization
    hidden_fields TEXT[] DEFAULT '{}', -- Fields to hide
    readonly_fields TEXT[] DEFAULT '{}', -- Fields that are read-only
    
    -- Context & Permissions
    user_roles TEXT[] DEFAULT '{}', -- Which user roles can see this selection
    context_filters JSONB DEFAULT '{}', -- Context-based field visibility
    
    -- Admin Management
    is_default BOOLEAN DEFAULT false, -- Is this the default selection for this entity type
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID NOT NULL, -- Admin who created this selection
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint per organization/entity/selection
    UNIQUE(organization_id, entity_type, field_selection_name)
);

-- Dynamic Form Configurations (Admin Configurable)
CREATE TABLE public.dynamic_form_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
    
    -- Form Identity
    form_name TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    form_type TEXT NOT NULL CHECK (form_type IN ('create', 'edit', 'view', 'search', 'report')),
    
    -- Form Structure
    form_schema JSONB NOT NULL, -- Complete form structure
    field_layout JSONB NOT NULL, -- How fields are laid out
    section_definitions JSONB DEFAULT '{}', -- Form sections/tabs
    
    -- Form Behavior
    validation_rules JSONB DEFAULT '{}', -- Form-specific validation
    business_logic JSONB DEFAULT '{}', -- Form-specific business logic
    automation_rules JSONB DEFAULT '{}', -- Form automation
    
    -- User Experience
    conditional_logic JSONB DEFAULT '{}', -- Show/hide fields based on conditions
    calculated_fields JSONB DEFAULT '{}', -- Fields calculated from other fields
    default_values JSONB DEFAULT '{}', -- Default field values
    
    -- Integration
    data_sources JSONB DEFAULT '{}', -- External data sources for lookups
    submission_handlers JSONB DEFAULT '{}', -- Custom submission handling
    
    -- Permissions & Access
    user_roles TEXT[] DEFAULT '{}', -- Which roles can use this form
    permission_rules JSONB DEFAULT '{}', -- Field-level permissions
    
    -- Admin Management
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(organization_id, entity_type, form_name)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- DNA Components
CREATE INDEX idx_dna_components_type ON dna_components(component_type);
CREATE INDEX idx_dna_components_category ON dna_components(category);
CREATE INDEX idx_dna_components_status ON dna_components(status);
CREATE INDEX idx_dna_components_usage ON dna_components(usage_count DESC);
CREATE INDEX idx_dna_components_search ON dna_components USING GIN(search_vector);

-- DNA Templates
CREATE INDEX idx_dna_templates_industry ON dna_templates(industry);
CREATE INDEX idx_dna_templates_type ON dna_templates(template_type);
CREATE INDEX idx_dna_templates_status ON dna_templates(status);
CREATE INDEX idx_dna_templates_usage ON dna_templates(usage_count DESC);

-- Smart Code Definitions
CREATE INDEX idx_smart_codes_industry ON smart_code_definitions(industry);
CREATE INDEX idx_smart_codes_module ON smart_code_definitions(module_name);
CREATE INDEX idx_smart_codes_status ON smart_code_definitions(status);

-- Entity Type Definitions
CREATE INDEX idx_entity_types_category ON entity_type_definitions(category);
CREATE INDEX idx_entity_types_status ON entity_type_definitions(status);

-- Organization System Config
CREATE INDEX idx_org_system_config_org ON organization_system_config(organization_id);

-- User Entity Field Selections
CREATE INDEX idx_user_field_selections_org ON user_entity_field_selections(organization_id);
CREATE INDEX idx_user_field_selections_entity ON user_entity_field_selections(organization_id, entity_type);
CREATE INDEX idx_user_field_selections_type ON user_entity_field_selections(selection_type);

-- Dynamic Form Configurations
CREATE INDEX idx_dynamic_forms_org ON dynamic_form_configurations(organization_id);
CREATE INDEX idx_dynamic_forms_entity ON dynamic_form_configurations(organization_id, entity_type);
CREATE INDEX idx_dynamic_forms_type ON dynamic_form_configurations(form_type);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- System tables are read-only for organizations, admin-only for writes
ALTER TABLE dna_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_code_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_type_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_type_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_rule_definitions ENABLE ROW LEVEL SECURITY;

-- Everyone can read system definitions
CREATE POLICY "Allow read access to system definitions" 
ON dna_components FOR SELECT 
USING (true);

CREATE POLICY "Allow read access to templates" 
ON dna_templates FOR SELECT 
USING (true);

CREATE POLICY "Allow read access to smart codes" 
ON smart_code_definitions FOR SELECT 
USING (true);

CREATE POLICY "Allow read access to entity types" 
ON entity_type_definitions FOR SELECT 
USING (true);

CREATE POLICY "Allow read access to field types" 
ON field_type_definitions FOR SELECT 
USING (true);

CREATE POLICY "Allow read access to business rules" 
ON business_rule_definitions FOR SELECT 
USING (true);

-- Only system admins can write to system definitions
CREATE POLICY "System admins can modify components" 
ON dna_components FOR ALL 
USING (auth.jwt() ->> 'role' = 'system_admin');

CREATE POLICY "System admins can modify templates" 
ON dna_templates FOR ALL 
USING (auth.jwt() ->> 'role' = 'system_admin');

-- Organization configuration tables - org admins can CRUD their own data
ALTER TABLE organization_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_entity_field_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_form_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage system config" 
ON organization_system_config FOR ALL 
USING (
    organization_id = (auth.jwt() ->> 'organization_id')::UUID 
    AND auth.jwt() ->> 'role' IN ('owner', 'admin')
);

CREATE POLICY "Org admins can manage field selections" 
ON user_entity_field_selections FOR ALL 
USING (
    organization_id = (auth.jwt() ->> 'organization_id')::UUID 
    AND auth.jwt() ->> 'role' IN ('owner', 'admin')
);

CREATE POLICY "Org admins can manage form configurations" 
ON dynamic_form_configurations FOR ALL 
USING (
    organization_id = (auth.jwt() ->> 'organization_id')::UUID 
    AND auth.jwt() ->> 'role' IN ('owner', 'admin')
);

-- =====================================================
-- VIEWS FOR EASY ACCESS
-- =====================================================

-- Complete system configuration view for an organization
CREATE VIEW organization_complete_config AS
SELECT 
    o.id as organization_id,
    o.organization_name,
    osc.enabled_components,
    osc.enabled_entity_types,
    osc.enabled_field_types,
    osc.enabled_business_rules,
    osc.feature_flags,
    osc.theme_configuration,
    COUNT(uefs.id) as custom_field_selections,
    COUNT(dfc.id) as custom_form_configurations
FROM core_organizations o
LEFT JOIN organization_system_config osc ON o.id = osc.organization_id
LEFT JOIN user_entity_field_selections uefs ON o.id = uefs.organization_id
LEFT JOIN dynamic_form_configurations dfc ON o.id = dfc.organization_id
GROUP BY o.id, o.organization_name, osc.enabled_components, osc.enabled_entity_types, 
         osc.enabled_field_types, osc.enabled_business_rules, osc.feature_flags, osc.theme_configuration;

-- Entity configuration view
CREATE VIEW entity_complete_configuration AS
SELECT 
    etd.entity_type,
    etd.display_name,
    etd.base_fields,
    etd.validation_schema,
    etd.form_layout,
    uefs.organization_id,
    uefs.selected_fields,
    uefs.field_configurations,
    dfc.form_schema,
    dfc.form_name
FROM entity_type_definitions etd
LEFT JOIN user_entity_field_selections uefs ON etd.entity_type = uefs.entity_type
LEFT JOIN dynamic_form_configurations dfc ON etd.entity_type = dfc.entity_type AND uefs.organization_id = dfc.organization_id;

-- =====================================================
-- FUNCTIONS FOR SCHEMA MANAGEMENT
-- =====================================================

-- Function to get complete system configuration for an organization
CREATE OR REPLACE FUNCTION get_organization_system_schema(org_id UUID)
RETURNS JSONB AS $$
DECLARE
    config_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'components', (
            SELECT jsonb_object_agg(dc.component_name, dc.*)
            FROM dna_components dc
            JOIN organization_system_config osc ON osc.organization_id = org_id
            WHERE dc.component_name = ANY(SELECT jsonb_array_elements_text(osc.enabled_components))
        ),
        'templates', (
            SELECT jsonb_object_agg(dt.template_name, dt.*)
            FROM dna_templates dt
            JOIN organization_system_config osc ON osc.organization_id = org_id
            WHERE dt.template_name = ANY(osc.active_templates)
        ),
        'entity_types', (
            SELECT jsonb_object_agg(etd.entity_type, etd.*)
            FROM entity_type_definitions etd
            JOIN organization_system_config osc ON osc.organization_id = org_id
            WHERE etd.entity_type = ANY(osc.enabled_entity_types)
        ),
        'field_types', (
            SELECT jsonb_object_agg(ftd.field_type, ftd.*)
            FROM field_type_definitions ftd
            JOIN organization_system_config osc ON osc.organization_id = org_id
            WHERE ftd.field_type = ANY(osc.enabled_field_types)
        ),
        'business_rules', (
            SELECT jsonb_object_agg(brd.rule_name, brd.*)
            FROM business_rule_definitions brd
            JOIN organization_system_config osc ON osc.organization_id = org_id
            WHERE brd.rule_name = ANY(osc.enabled_business_rules)
        ),
        'smart_codes', (
            SELECT jsonb_object_agg(scd.smart_code, scd.*)
            FROM smart_code_definitions scd
            WHERE scd.status = 'active'
        ),
        'field_selections', (
            SELECT jsonb_object_agg(uefs.field_selection_name, uefs.*)
            FROM user_entity_field_selections uefs
            WHERE uefs.organization_id = org_id AND uefs.is_active = true
        ),
        'form_configurations', (
            SELECT jsonb_object_agg(dfc.form_name, dfc.*)
            FROM dynamic_form_configurations dfc
            WHERE dfc.organization_id = org_id AND dfc.is_active = true
        )
    ) INTO config_result;
    
    RETURN config_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate organization configuration
CREATE OR REPLACE FUNCTION validate_organization_config(org_id UUID)
RETURNS JSONB AS $$
DECLARE
    validation_result JSONB := '{}';
    missing_components TEXT[];
    invalid_config BOOLEAN := false;
BEGIN
    -- Check if required components are enabled
    -- Add validation logic here
    
    -- Return validation results
    RETURN jsonb_build_object(
        'valid', NOT invalid_config,
        'missing_components', missing_components,
        'validation_timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- IMPLEMENTATION NOTES
-- =====================================================

/*
Schema Management Architecture:

1. **System Schema** (Read-Only for Users):
   - DNA Components: React component definitions
   - DNA Templates: Industry-specific templates
   - Smart Code Definitions: Business intelligence rules
   - Entity Type Definitions: Universal entity types
   - Field Type Definitions: Available field types
   - Business Rule Definitions: Universal business rules

2. **User Configuration** (Admin CRUD):
   - Organization System Config: Which system features to enable
   - User Entity Field Selections: Custom field selections per entity
   - Dynamic Form Configurations: Custom form layouts and logic

3. **Access Control**:
   - System Admins: Full CRUD on system schema
   - Organization Admins: CRUD on their organization's configuration
   - Regular Users: Read-only access to their organization's effective schema

4. **DNA Component Integration**:
   - Components automatically adapt based on organization configuration
   - Field selections drive form and table rendering
   - Business rules are applied based on organization settings
   - Smart codes provide universal business intelligence

5. **Scalability**:
   - System schema cached globally
   - Organization configs cached per tenant
   - Materialized views for complex queries
   - Efficient indexing for fast lookups

This architecture ensures that:
- System knowledge is centrally managed
- Organizations can customize their experience
- Admins have full control over their organization's setup
- The app works properly with proper data separation
- Performance is optimized for both system and user data
*/