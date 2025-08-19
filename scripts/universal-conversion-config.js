/**
 * Universal Progressive to Production Conversion Configuration
 * Supports all HERA industries and page types
 */

const UNIVERSAL_PAGE_CONFIGS = {
  // ============= SALON SPECIFIC (Missing pages) =============
  
  services: {
    entityType: 'service',
    entityPrefix: 'SVC',
    dynamicFields: ['name', 'category', 'price', 'duration', 'description', 'requires_license'],
    relationships: [
      { type: 'requires_product', to: 'product' },
      { type: 'performed_by', to: 'employee' }
    ],
    industries: ['salon', 'healthcare']
  },
  
  staff: {
    entityType: 'employee',
    entityPrefix: 'STAFF',
    dynamicFields: ['email', 'phone', 'role', 'specialties', 'hourly_rate', 'commission_rate'],
    relationships: [
      { type: 'has_status', to: 'workflow_status' },
      { type: 'works_in_department', to: 'department' }
    ],
    industries: ['salon', 'restaurant', 'healthcare', 'all']
  },
  
  payments: {
    entityType: 'transaction',
    entityPrefix: 'PAY',
    dynamicFields: ['payment_method', 'amount', 'reference_number', 'status', 'notes'],
    relationships: [
      { type: 'from_customer', to: 'customer' },
      { type: 'for_appointment', to: 'appointment' },
      { type: 'processed_by', to: 'employee' }
    ],
    industries: ['salon', 'all']
  },
  
  loyalty: {
    entityType: 'loyalty_program',
    entityPrefix: 'LOYALTY',
    dynamicFields: ['points_ratio', 'tier_benefits', 'expiry_days', 'tier_name', 'minimum_spend'],
    relationships: [
      { type: 'has_members', to: 'customer' }
    ],
    industries: ['salon', 'restaurant', 'retail']
  },
  
  marketing: {
    entityType: 'campaign',
    entityPrefix: 'CAMP',
    dynamicFields: ['campaign_type', 'start_date', 'end_date', 'target_audience', 'budget', 'status', 'channel'],
    relationships: [
      { type: 'targets_customers', to: 'customer' },
      { type: 'created_by', to: 'employee' }
    ],
    industries: ['salon', 'all']
  },

  // ============= COMMON PAGES (Used across multiple industries) =============
  
  // Customer Management
  customers: {
    entityType: 'customer',
    entityPrefix: 'CUST',
    dynamicFields: ['email', 'phone', 'address', 'date_of_birth', 'preferences', 'notes'],
    relationships: [
      { type: 'has_status', to: 'workflow_status' },
      { type: 'belongs_to_segment', to: 'customer_segment' }
    ],
    industries: ['salon', 'jewelry', 'enterprise-retail', 'restaurant', 'healthcare']
  },
  
  // Appointments/Bookings
  appointments: {
    entityType: 'appointment',
    entityPrefix: 'APPT',
    dynamicFields: ['date', 'time', 'duration', 'notes', 'status', 'type'],
    relationships: [
      { type: 'has_customer', to: 'customer' },
      { type: 'has_staff', to: 'employee' },
      { type: 'has_service', to: 'service' }
    ],
    industries: ['salon', 'healthcare', 'jewelry']
  },
  
  // Inventory Management
  inventory: {
    entityType: 'product',
    entityPrefix: 'PROD',
    dynamicFields: ['sku', 'price', 'cost', 'stock_level', 'reorder_point', 'category', 'location'],
    relationships: [
      { type: 'from_supplier', to: 'vendor' },
      { type: 'in_category', to: 'product_category' },
      { type: 'stored_at', to: 'location' }
    ],
    industries: ['salon', 'restaurant', 'jewelry', 'enterprise-retail', 'manufacturing']
  },
  
  // Point of Sale
  pos: {
    entityType: 'transaction',
    entityPrefix: 'SALE',
    dynamicFields: ['transaction_date', 'total_amount', 'payment_method', 'status', 'notes'],
    relationships: [
      { type: 'from_customer', to: 'customer' },
      { type: 'processed_by', to: 'employee' },
      { type: 'at_location', to: 'location' }
    ],
    industries: ['salon', 'restaurant', 'jewelry', 'enterprise-retail']
  },
  
  // Reports & Analytics
  reports: {
    entityType: 'report',
    entityPrefix: 'RPT',
    dynamicFields: ['report_type', 'frequency', 'parameters', 'last_run', 'recipients', 'format'],
    relationships: [
      { type: 'created_by', to: 'user' },
      { type: 'scheduled_by', to: 'schedule' }
    ],
    industries: ['salon', 'healthcare', 'jewelry', 'enterprise-retail', 'manufacturing']
  },
  
  // Settings
  settings: {
    entityType: 'setting',
    entityPrefix: 'SET',
    dynamicFields: ['setting_key', 'setting_value', 'setting_type', 'description', 'updated_by'],
    relationships: [
      { type: 'belongs_to_module', to: 'module' }
    ],
    industries: ['salon', 'jewelry', 'crm', 'bpo', 'all']
  },

  // ============= HEALTHCARE SPECIFIC =============
  
  patients: {
    entityType: 'patient',
    entityPrefix: 'PAT',
    dynamicFields: ['medical_record_number', 'date_of_birth', 'blood_type', 'allergies', 'medications', 'insurance_info'],
    relationships: [
      { type: 'has_primary_doctor', to: 'employee' },
      { type: 'has_insurance', to: 'insurance_provider' }
    ],
    industries: ['healthcare']
  },
  
  prescriptions: {
    entityType: 'prescription',
    entityPrefix: 'RX',
    dynamicFields: ['medication_name', 'dosage', 'frequency', 'duration', 'refills', 'prescribing_doctor'],
    relationships: [
      { type: 'for_patient', to: 'patient' },
      { type: 'prescribed_by', to: 'employee' }
    ],
    industries: ['healthcare']
  },
  
  billing: {
    entityType: 'medical_bill',
    entityPrefix: 'BILL',
    dynamicFields: ['service_date', 'procedure_codes', 'diagnosis_codes', 'insurance_claim', 'patient_amount'],
    relationships: [
      { type: 'for_patient', to: 'patient' },
      { type: 'for_visit', to: 'appointment' }
    ],
    industries: ['healthcare']
  },

  // ============= RESTAURANT SPECIFIC =============
  
  menu: {
    entityType: 'menu_item',
    entityPrefix: 'MENU',
    dynamicFields: ['category', 'price', 'description', 'ingredients', 'allergens', 'preparation_time'],
    relationships: [
      { type: 'in_category', to: 'menu_category' },
      { type: 'has_ingredients', to: 'product' }
    ],
    industries: ['restaurant']
  },
  
  kitchen: {
    entityType: 'kitchen_order',
    entityPrefix: 'KIT',
    dynamicFields: ['order_time', 'table_number', 'items', 'status', 'preparation_notes'],
    relationships: [
      { type: 'from_order', to: 'transaction' },
      { type: 'assigned_to_chef', to: 'employee' }
    ],
    industries: ['restaurant']
  },
  
  delivery: {
    entityType: 'delivery_order',
    entityPrefix: 'DEL',
    dynamicFields: ['delivery_address', 'delivery_time', 'driver', 'status', 'delivery_notes'],
    relationships: [
      { type: 'for_order', to: 'transaction' },
      { type: 'assigned_to_driver', to: 'employee' }
    ],
    industries: ['restaurant']
  },

  // ============= JEWELRY SPECIFIC =============
  
  repair: {
    entityType: 'repair_order',
    entityPrefix: 'REP',
    dynamicFields: ['item_description', 'repair_type', 'estimated_cost', 'due_date', 'status'],
    relationships: [
      { type: 'for_customer', to: 'customer' },
      { type: 'assigned_to_craftsman', to: 'employee' }
    ],
    industries: ['jewelry']
  },

  // ============= AUDIT SPECIFIC =============
  
  clients: {
    entityType: 'audit_client',
    entityPrefix: 'ACLT',
    dynamicFields: ['company_name', 'industry', 'fiscal_year_end', 'audit_type', 'risk_level'],
    relationships: [
      { type: 'has_partner', to: 'employee' },
      { type: 'in_industry', to: 'industry' }
    ],
    industries: ['audit']
  },
  
  engagements: {
    entityType: 'audit_engagement',
    entityPrefix: 'ENG',
    dynamicFields: ['engagement_type', 'start_date', 'end_date', 'budget_hours', 'actual_hours'],
    relationships: [
      { type: 'for_client', to: 'audit_client' },
      { type: 'has_team', to: 'audit_team' }
    ],
    industries: ['audit']
  },
  
  'working-papers': {
    entityType: 'working_paper',
    entityPrefix: 'WP',
    dynamicFields: ['section', 'title', 'preparer', 'reviewer', 'status', 'findings'],
    relationships: [
      { type: 'for_engagement', to: 'audit_engagement' },
      { type: 'prepared_by', to: 'employee' }
    ],
    industries: ['audit']
  },

  // ============= AIRLINE SPECIFIC =============
  
  bookings: {
    entityType: 'booking',
    entityPrefix: 'BKG',
    dynamicFields: ['flight_number', 'departure_date', 'departure_time', 'seat_number', 'class', 'fare'],
    relationships: [
      { type: 'for_passenger', to: 'customer' },
      { type: 'on_flight', to: 'flight' }
    ],
    industries: ['airline']
  },
  
  'check-in': {
    entityType: 'checkin',
    entityPrefix: 'CHK',
    dynamicFields: ['checkin_time', 'boarding_pass', 'baggage_tags', 'seat_assigned', 'gate'],
    relationships: [
      { type: 'for_booking', to: 'booking' },
      { type: 'processed_by', to: 'employee' }
    ],
    industries: ['airline']
  },

  // ============= CRM SPECIFIC =============
  
  deals: {
    entityType: 'deal',
    entityPrefix: 'DEAL',
    dynamicFields: ['deal_value', 'stage', 'probability', 'close_date', 'next_action'],
    relationships: [
      { type: 'with_company', to: 'customer' },
      { type: 'owned_by', to: 'employee' }
    ],
    industries: ['crm']
  },
  
  calls: {
    entityType: 'call_log',
    entityPrefix: 'CALL',
    dynamicFields: ['call_date', 'duration', 'outcome', 'notes', 'follow_up_required'],
    relationships: [
      { type: 'with_contact', to: 'customer' },
      { type: 'made_by', to: 'employee' }
    ],
    industries: ['crm']
  },

  // ============= ENTERPRISE RETAIL SPECIFIC =============
  
  merchandising: {
    entityType: 'merchandise_plan',
    entityPrefix: 'MERCH',
    dynamicFields: ['season', 'category', 'budget', 'margin_target', 'inventory_turns'],
    relationships: [
      { type: 'for_category', to: 'product_category' },
      { type: 'approved_by', to: 'employee' }
    ],
    industries: ['enterprise-retail']
  },
  
  procurement: {
    entityType: 'purchase_order',
    entityPrefix: 'PO',
    dynamicFields: ['vendor', 'order_date', 'expected_delivery', 'total_amount', 'status'],
    relationships: [
      { type: 'from_vendor', to: 'vendor' },
      { type: 'approved_by', to: 'employee' }
    ],
    industries: ['enterprise-retail', 'manufacturing']
  },
  
  promotions: {
    entityType: 'promotion',
    entityPrefix: 'PROMO',
    dynamicFields: ['promo_type', 'discount_percent', 'start_date', 'end_date', 'conditions'],
    relationships: [
      { type: 'applies_to_products', to: 'product' },
      { type: 'for_customer_segment', to: 'customer_segment' }
    ],
    industries: ['enterprise-retail']
  },

  // ============= FINANCIAL/ACCOUNTING SPECIFIC =============
  
  budgets: {
    entityType: 'budget',
    entityPrefix: 'BUD',
    dynamicFields: ['fiscal_year', 'department', 'amount', 'budget_type', 'approval_status'],
    relationships: [
      { type: 'for_department', to: 'department' },
      { type: 'approved_by', to: 'employee' }
    ],
    industries: ['financial', 'all']
  },
  
  'fixed-assets': {
    entityType: 'fixed_asset',
    entityPrefix: 'FA',
    dynamicFields: ['asset_tag', 'description', 'purchase_date', 'cost', 'depreciation_method', 'useful_life'],
    relationships: [
      { type: 'in_location', to: 'location' },
      { type: 'assigned_to', to: 'employee' }
    ],
    industries: ['financial', 'manufacturing']
  },
  
  // ============= BPO SPECIFIC =============
  
  queue: {
    entityType: 'work_queue',
    entityPrefix: 'QUE',
    dynamicFields: ['queue_name', 'priority', 'sla_minutes', 'current_volume', 'average_handle_time'],
    relationships: [
      { type: 'assigned_to_team', to: 'team' },
      { type: 'managed_by', to: 'employee' }
    ],
    industries: ['bpo']
  },
  
  analytics: {
    entityType: 'analytics_dashboard',
    entityPrefix: 'DASH',
    dynamicFields: ['dashboard_type', 'metrics', 'refresh_rate', 'filters', 'visualization_type'],
    relationships: [
      { type: 'created_by', to: 'employee' },
      { type: 'for_department', to: 'department' }
    ],
    industries: ['bpo', 'crm', 'enterprise-retail', 'jewelry']
  }
}

// Industry-specific entity type mappings
const INDUSTRY_ENTITY_MAPPINGS = {
  salon: {
    staff: 'employee',
    services: 'service',
    loyalty: 'loyalty_program',
    marketing: 'campaign',
    payments: 'transaction'
  },
  healthcare: {
    doctors: 'employee',
    nurses: 'employee',
    staff: 'employee'
  },
  restaurant: {
    servers: 'employee',
    chefs: 'employee',
    tables: 'location'
  },
  jewelry: {
    craftsmen: 'employee',
    pieces: 'product',
    metals: 'raw_material',
    stones: 'raw_material'
  },
  audit: {
    auditors: 'employee',
    partners: 'employee',
    teams: 'team',
    documents: 'document'
  },
  airline: {
    pilots: 'employee',
    'cabin-crew': 'employee',
    flights: 'flight',
    aircraft: 'asset'
  },
  'enterprise-retail': {
    stores: 'location',
    planners: 'employee',
    buyers: 'employee'
  },
  manufacturing: {
    'production-lines': 'asset',
    operators: 'employee',
    'raw-materials': 'raw_material',
    'finished-goods': 'product'
  }
}

// Smart code patterns by industry
const SMART_CODE_PATTERNS = {
  salon: 'HERA.SALON',
  healthcare: 'HERA.HLTH',
  restaurant: 'HERA.REST',
  jewelry: 'HERA.JEW',
  audit: 'HERA.AUD',
  airline: 'HERA.AIR',
  crm: 'HERA.CRM',
  'enterprise-retail': 'HERA.RET',
  manufacturing: 'HERA.MFG',
  financial: 'HERA.FIN',
  bpo: 'HERA.BPO',
  legal: 'HERA.LEG',
  pwm: 'HERA.PWM'
}

module.exports = {
  UNIVERSAL_PAGE_CONFIGS,
  INDUSTRY_ENTITY_MAPPINGS,
  SMART_CODE_PATTERNS
}