-- =====================================================
-- HERA Progressive Schema (Trial Mode - 30 Days)
-- IndexedDB Implementation for Offline-First Progressive Apps
-- Smart Code: HERA.PROGRESSIVE.SCHEMA.TRIAL.v1
-- =====================================================

-- This schema is implemented in IndexedDB for progressive apps
-- Automatically expires after 30 days with migration prompts

-- =====================================================
-- 1. CORE ORGANIZATIONS (Multi-Tenant Foundation)
-- =====================================================
CREATE TABLE IF NOT EXISTS progressive_organizations (
    id TEXT PRIMARY KEY,
    organization_name TEXT NOT NULL,
    organization_code TEXT UNIQUE NOT NULL,
    organization_type TEXT NOT NULL, -- 'restaurant', 'healthcare', 'retail', 'manufacturing', 'services'
    industry_classification TEXT NOT NULL,
    
    -- Trial System Fields
    trial_started_at INTEGER NOT NULL, -- Unix timestamp
    trial_expires_at INTEGER NOT NULL, -- Unix timestamp (30 days from start)
    trial_status TEXT DEFAULT 'active', -- 'active', 'expired', 'converted'
    conversion_offers_shown INTEGER DEFAULT 0,
    engagement_score REAL DEFAULT 0.0, -- 0.0 to 1.0
    
    -- AI Insights for Business Intelligence
    ai_insights TEXT, -- JSON: predictions, recommendations, growth_potential
    ai_confidence REAL DEFAULT 0.0,
    ai_last_updated INTEGER,
    
    -- Progressive Settings
    settings TEXT, -- JSON: operating_hours, preferences, configurations
    
    -- Progressive Metadata
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_activity_at INTEGER,
    data_size_mb REAL DEFAULT 0.0,
    sync_status TEXT DEFAULT 'offline', -- 'offline', 'syncing', 'synced'
    
    -- Expiry Management
    expires_at INTEGER NOT NULL, -- Auto-cleanup after 30 days
    cleanup_scheduled INTEGER DEFAULT 0 -- Boolean: cleanup job scheduled
);

-- Index for trial management
CREATE INDEX idx_progressive_orgs_trial ON progressive_organizations(trial_expires_at, trial_status);
CREATE INDEX idx_progressive_orgs_activity ON progressive_organizations(last_activity_at);

-- =====================================================
-- 2. CORE ENTITIES (Universal Business Objects)
-- =====================================================
CREATE TABLE IF NOT EXISTS progressive_entities (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    
    -- Universal Entity Fields
    entity_type TEXT NOT NULL, -- 'customer', 'product', 'employee', 'patient', etc.
    entity_name TEXT NOT NULL,
    entity_code TEXT, -- SKU, employee ID, patient MRN, etc.
    entity_description TEXT,
    
    -- Smart Code System
    smart_code TEXT NOT NULL, -- HERA.{INDUSTRY}.{MODULE}.{FUNCTION}.{TYPE}.v{VERSION}
    
    -- Progressive Metadata
    metadata TEXT, -- JSON: All industry-specific fields
    tags TEXT, -- JSON array for categorization
    
    -- AI Fields
    ai_classification TEXT, -- Auto-detected entity classification
    ai_confidence REAL DEFAULT 0.0,
    ai_insights TEXT, -- JSON: AI-generated insights
    
    -- Universal Status
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'archived'
    
    -- Audit Trail
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    created_by TEXT,
    updated_by TEXT,
    
    -- Progressive Trial Management
    expires_at INTEGER NOT NULL,
    
    FOREIGN KEY (organization_id) REFERENCES progressive_organizations(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_progressive_entities_org ON progressive_entities(organization_id);
CREATE INDEX idx_progressive_entities_type ON progressive_entities(organization_id, entity_type);
CREATE INDEX idx_progressive_entities_smart_code ON progressive_entities(smart_code);
CREATE INDEX idx_progressive_entities_status ON progressive_entities(organization_id, status);

-- =====================================================
-- 3. CORE DYNAMIC DATA (Unlimited Custom Fields)
-- =====================================================
CREATE TABLE IF NOT EXISTS progressive_dynamic_data (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    
    -- Dynamic Field Definition
    field_name TEXT NOT NULL,
    field_type TEXT NOT NULL, -- 'text', 'number', 'boolean', 'date', 'json'
    
    -- Flexible Value Storage
    field_value_text TEXT,
    field_value_number REAL,
    field_value_boolean INTEGER, -- 0 or 1
    field_value_date INTEGER, -- Unix timestamp
    field_value_json TEXT, -- JSON for complex data
    
    -- Smart Code for Field Intelligence
    smart_code TEXT, -- Business context for this field
    
    -- Field Metadata
    field_category TEXT, -- 'personal', 'business', 'financial', 'medical', etc.
    field_source TEXT DEFAULT 'user_input', -- 'user_input', 'calculated', 'imported', 'ai_generated'
    is_required INTEGER DEFAULT 0, -- Boolean
    is_encrypted INTEGER DEFAULT 0, -- Boolean for sensitive data
    
    -- AI Enhancement
    ai_suggested INTEGER DEFAULT 0, -- Boolean: AI suggested this field
    ai_confidence REAL DEFAULT 0.0,
    
    -- Audit Trail
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    -- Progressive Trial Management
    expires_at INTEGER NOT NULL,
    
    FOREIGN KEY (organization_id) REFERENCES progressive_organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (entity_id) REFERENCES progressive_entities(id) ON DELETE CASCADE
);

-- Indexes for dynamic queries
CREATE INDEX idx_progressive_dynamic_org ON progressive_dynamic_data(organization_id);
CREATE INDEX idx_progressive_dynamic_entity ON progressive_dynamic_data(entity_id);
CREATE INDEX idx_progressive_dynamic_field ON progressive_dynamic_data(organization_id, field_name);
CREATE INDEX idx_progressive_dynamic_smart_code ON progressive_dynamic_data(smart_code);

-- =====================================================
-- 4. CORE RELATIONSHIPS (Universal Connections)
-- =====================================================
CREATE TABLE IF NOT EXISTS progressive_relationships (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    
    -- Relationship Definition
    parent_entity_id TEXT NOT NULL,
    child_entity_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL, -- 'owns', 'manages', 'belongs_to', 'uses', etc.
    
    -- Relationship Context
    relationship_description TEXT,
    smart_code TEXT, -- Business intelligence for relationship
    
    -- Relationship Properties
    strength REAL DEFAULT 1.0, -- 0.0 to 1.0
    is_bidirectional INTEGER DEFAULT 0, -- Boolean
    
    -- Relationship Metadata
    properties TEXT, -- JSON: Additional relationship properties
    
    -- Lifecycle
    effective_from INTEGER, -- Unix timestamp
    effective_to INTEGER, -- Unix timestamp
    
    -- Audit Trail
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    -- Progressive Trial Management
    expires_at INTEGER NOT NULL,
    
    FOREIGN KEY (organization_id) REFERENCES progressive_organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_entity_id) REFERENCES progressive_entities(id) ON DELETE CASCADE,
    FOREIGN KEY (child_entity_id) REFERENCES progressive_entities(id) ON DELETE CASCADE
);

-- Indexes for relationship queries
CREATE INDEX idx_progressive_relationships_org ON progressive_relationships(organization_id);
CREATE INDEX idx_progressive_relationships_parent ON progressive_relationships(parent_entity_id);
CREATE INDEX idx_progressive_relationships_child ON progressive_relationships(child_entity_id);
CREATE INDEX idx_progressive_relationships_type ON progressive_relationships(organization_id, relationship_type);

-- =====================================================
-- 5. UNIVERSAL TRANSACTIONS (All Business Activities)
-- =====================================================
CREATE TABLE IF NOT EXISTS progressive_transactions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    
    -- Transaction Header
    transaction_type TEXT NOT NULL, -- 'sale', 'purchase', 'payment', 'appointment', etc.
    transaction_number TEXT NOT NULL, -- Auto-generated or manual
    transaction_date INTEGER NOT NULL, -- Unix timestamp
    
    -- Business Context
    smart_code TEXT NOT NULL, -- Automatic GL posting and business rules
    description TEXT,
    
    -- Financial Fields
    total_amount REAL DEFAULT 0.0,
    currency_code TEXT DEFAULT 'USD',
    exchange_rate REAL DEFAULT 1.0,
    
    -- References
    reference_entity_id TEXT, -- Links to customer, vendor, etc.
    reference_number TEXT, -- PO number, invoice number, etc.
    
    -- Transaction Metadata
    metadata TEXT, -- JSON: Transaction-specific data
    
    -- Status and Workflow
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'voided'
    workflow_stage TEXT,
    approval_required INTEGER DEFAULT 0, -- Boolean
    
    -- AI Enhancement
    ai_category TEXT, -- AI-detected transaction category
    ai_confidence REAL DEFAULT 0.0,
    ai_anomaly_score REAL DEFAULT 0.0, -- Fraud/anomaly detection
    
    -- Audit Trail
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    created_by TEXT,
    approved_by TEXT,
    approved_at INTEGER,
    
    -- Progressive Trial Management
    expires_at INTEGER NOT NULL,
    
    FOREIGN KEY (organization_id) REFERENCES progressive_organizations(id) ON DELETE CASCADE
);

-- Indexes for transaction queries
CREATE INDEX idx_progressive_transactions_org ON progressive_transactions(organization_id);
CREATE INDEX idx_progressive_transactions_type ON progressive_transactions(organization_id, transaction_type);
CREATE INDEX idx_progressive_transactions_date ON progressive_transactions(organization_id, transaction_date);
CREATE INDEX idx_progressive_transactions_smart_code ON progressive_transactions(smart_code);
CREATE INDEX idx_progressive_transactions_status ON progressive_transactions(organization_id, status);
CREATE INDEX idx_progressive_transactions_reference ON progressive_transactions(reference_entity_id);

-- =====================================================
-- 6. UNIVERSAL TRANSACTION LINES (Transaction Details)
-- =====================================================
CREATE TABLE IF NOT EXISTS progressive_transaction_lines (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    
    -- Line Details
    line_number INTEGER NOT NULL,
    line_entity_id TEXT, -- Links to product, service, etc.
    
    -- Quantities and Amounts
    quantity REAL DEFAULT 1.0,
    unit_price REAL DEFAULT 0.0,
    line_amount REAL NOT NULL,
    
    -- Line Context
    smart_code TEXT, -- Line-level business intelligence
    description TEXT,
    line_type TEXT, -- 'item', 'service', 'discount', 'tax', 'fee'
    
    -- Line Metadata
    metadata TEXT, -- JSON: Line-specific data
    
    -- References
    reference_data TEXT, -- JSON: Additional references
    
    -- AI Enhancement
    ai_suggestions TEXT, -- JSON: AI suggestions for this line
    ai_confidence REAL DEFAULT 0.0,
    
    -- Audit Trail
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    -- Progressive Trial Management
    expires_at INTEGER NOT NULL,
    
    FOREIGN KEY (organization_id) REFERENCES progressive_organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES progressive_transactions(id) ON DELETE CASCADE
);

-- Indexes for line queries
CREATE INDEX idx_progressive_lines_org ON progressive_transaction_lines(organization_id);
CREATE INDEX idx_progressive_lines_transaction ON progressive_transaction_lines(transaction_id);
CREATE INDEX idx_progressive_lines_entity ON progressive_transaction_lines(line_entity_id);
CREATE INDEX idx_progressive_lines_smart_code ON progressive_transaction_lines(smart_code);

-- =====================================================
-- PROGRESSIVE TRIAL MANAGEMENT TABLES
-- =====================================================

-- Progressive App Registry
CREATE TABLE IF NOT EXISTS progressive_apps (
    id TEXT PRIMARY KEY,
    app_name TEXT NOT NULL,
    app_type TEXT NOT NULL, -- 'restaurant', 'healthcare', etc.
    organization_id TEXT NOT NULL,
    
    -- App Configuration
    config TEXT, -- JSON: App-specific configuration
    theme TEXT, -- JSON: UI theme and branding
    features_enabled TEXT, -- JSON: Feature toggles
    
    -- Trial Management
    trial_started_at INTEGER NOT NULL,
    trial_expires_at INTEGER NOT NULL,
    trial_extensions INTEGER DEFAULT 0,
    max_extensions INTEGER DEFAULT 1,
    
    -- Usage Analytics
    sessions_count INTEGER DEFAULT 0,
    total_usage_minutes INTEGER DEFAULT 0,
    last_session_at INTEGER,
    feature_usage TEXT, -- JSON: Feature usage stats
    
    -- Conversion Tracking
    conversion_events TEXT, -- JSON: Conversion event tracking
    upgrade_prompts_shown INTEGER DEFAULT 0,
    upgrade_interest_level REAL DEFAULT 0.0, -- 0.0 to 1.0
    
    -- Migration Readiness
    migration_score REAL DEFAULT 0.0, -- 0.0 to 1.0
    migration_blockers TEXT, -- JSON: Issues preventing migration
    data_quality_score REAL DEFAULT 0.0,
    
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    
    FOREIGN KEY (organization_id) REFERENCES progressive_organizations(id) ON DELETE CASCADE
);

-- Progressive Session Tracking
CREATE TABLE IF NOT EXISTS progressive_sessions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    
    -- Session Details
    session_start INTEGER NOT NULL,
    session_end INTEGER,
    duration_minutes INTEGER,
    
    -- Activity Tracking
    pages_visited TEXT, -- JSON: Pages visited during session
    features_used TEXT, -- JSON: Features used during session
    actions_performed INTEGER DEFAULT 0,
    
    -- Engagement Metrics
    engagement_score REAL DEFAULT 0.0, -- 0.0 to 1.0
    conversion_events TEXT, -- JSON: Conversion events in session
    
    -- Technical Info
    user_agent TEXT,
    device_info TEXT, -- JSON: Device information
    connection_type TEXT, -- 'online', 'offline'
    
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    
    FOREIGN KEY (organization_id) REFERENCES progressive_organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (app_id) REFERENCES progressive_apps(id) ON DELETE CASCADE
);

-- Progressive Migration Queue
CREATE TABLE IF NOT EXISTS progressive_migration_queue (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    
    -- Migration Details
    migration_type TEXT NOT NULL, -- 'trial_to_production', 'data_export', 'upgrade'
    migration_status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
    
    -- Migration Data
    source_data TEXT, -- JSON: Data to migrate
    migration_plan TEXT, -- JSON: Migration execution plan
    validation_results TEXT, -- JSON: Pre-migration validation
    
    -- Progress Tracking
    progress_percentage REAL DEFAULT 0.0,
    steps_completed INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,
    
    -- Results
    migration_results TEXT, -- JSON: Migration results
    error_log TEXT, -- JSON: Any errors encountered
    rollback_data TEXT, -- JSON: Rollback information
    
    -- Timing
    scheduled_at INTEGER,
    started_at INTEGER,
    completed_at INTEGER,
    
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    
    FOREIGN KEY (organization_id) REFERENCES progressive_organizations(id) ON DELETE CASCADE
);

-- =====================================================
-- PROGRESSIVE VIEWS AND FUNCTIONS
-- =====================================================

-- View for Trial Status Summary
CREATE VIEW progressive_trial_summary AS
SELECT 
    o.id as organization_id,
    o.organization_name,
    o.organization_type,
    o.trial_started_at,
    o.trial_expires_at,
    o.trial_status,
    CASE 
        WHEN o.trial_expires_at > strftime('%s', 'now') 
        THEN CAST((o.trial_expires_at - strftime('%s', 'now')) / 86400 AS INTEGER)
        ELSE 0 
    END as days_remaining,
    o.engagement_score,
    COUNT(DISTINCT e.id) as total_entities,
    COUNT(DISTINCT t.id) as total_transactions,
    o.data_size_mb
FROM progressive_organizations o
LEFT JOIN progressive_entities e ON o.id = e.organization_id
LEFT JOIN progressive_transactions t ON o.id = t.organization_id
GROUP BY o.id;

-- View for Migration Readiness Assessment
CREATE VIEW progressive_migration_readiness AS
SELECT 
    o.id as organization_id,
    o.organization_name,
    ts.days_remaining,
    ts.engagement_score,
    ts.total_entities,
    ts.total_transactions,
    a.migration_score,
    a.data_quality_score,
    CASE 
        WHEN ts.engagement_score > 0.7 AND ts.total_entities > 10 AND ts.total_transactions > 5 
        THEN 'ready'
        WHEN ts.engagement_score > 0.5 AND ts.total_entities > 5 
        THEN 'partial'
        ELSE 'not_ready'
    END as readiness_status
FROM progressive_organizations o
JOIN progressive_trial_summary ts ON o.id = ts.organization_id
LEFT JOIN progressive_apps a ON o.id = a.organization_id;

-- =====================================================
-- PROGRESSIVE CLEANUP AND MAINTENANCE
-- =====================================================

-- Automatic cleanup of expired trial data
-- This would be implemented in JavaScript for IndexedDB
-- but shown here as SQL for reference

-- Mark expired trials
-- UPDATE progressive_organizations 
-- SET trial_status = 'expired', cleanup_scheduled = 1
-- WHERE trial_expires_at < strftime('%s', 'now') AND trial_status = 'active';

-- Cleanup expired data (30+ days old)
-- DELETE FROM progressive_organizations WHERE expires_at < strftime('%s', 'now');

-- =====================================================
-- PROGRESSIVE INDEXEDDB IMPLEMENTATION NOTES
-- =====================================================

/*
IndexedDB Implementation:
1. Each table becomes an IndexedDB object store
2. Indexes map directly to IndexedDB indexes
3. Foreign key relationships maintained via application logic
4. Automatic expiry handled by background sync service
5. Data compression for storage efficiency
6. Offline-first with eventual consistency
7. Service Worker handles background cleanup
8. WebCrypto API for sensitive data encryption

Key Features:
- 30-day automatic expiry with warnings at 7, 3, 1 days
- Offline-first operation with background sync
- Progressive enhancement with online features
- Seamless migration to production Supabase
- Real-time engagement tracking
- AI-powered insights and recommendations
- Universal business intelligence via Smart Codes
- Zero-configuration setup for any industry
*/