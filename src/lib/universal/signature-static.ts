// src/lib/universal/signature-static.ts
// Static fallback signatures — same structure you used earlier.

export type FnSignature = {
  params: string[];
  mode?: 'header-lines';
  aliases?: Record<string, string>;
};

export const STATIC_FN_SIGNATURES: Record<string, FnSignature[] | FnSignature> = {
  hera_txn_create_v1: {
    mode: 'header-lines',
    params: ['p_header', 'p_lines', 'p_actor_user_id'],
  },

  hera_txn_emit_v1: {
    params: [
      'p_organization_id',
      'p_transaction_type',
      'p_smart_code',
      'p_transaction_code',
      'p_transaction_date',
      'p_source_entity_id',
      'p_target_entity_id',
      'p_total_amount',
      'p_transaction_status',
      'p_reference_number',
      'p_external_reference',
      'p_business_context',
      'p_metadata',
      'p_approval_required',
      'p_approved_by',
      'p_approved_at',
      'p_transaction_currency_code',
      'p_base_currency_code',
      'p_exchange_rate',
      'p_exchange_rate_date',
      'p_exchange_rate_type',
      'p_fiscal_period_entity_id',
      'p_fiscal_year',
      'p_fiscal_period',
      'p_posting_period_code',
      'p_lines',
      'p_actor_user_id',
    ],
  },

  hera_txn_delete_v1: { params: ['p_organization_id', 'p_transaction_id'] },

  hera_txn_query_v1: {
    params: ['p_org_id', 'p_filters'],
    aliases: { p_organization_id: 'p_org_id' },
  },

  hera_txn_read_v1: {
    params: ['p_org_id', 'p_transaction_id', 'p_include_lines'],
    aliases: { p_organization_id: 'p_org_id' },
  },

  hera_txn_reverse_v1: [
    {
      params: ['p_org_id', 'p_original_txn_id', 'p_reason', 'p_reversal_smart_code'],
      aliases: { p_organization_id: 'p_org_id' },
    },
    {
      params: ['p_organization_id', 'p_transaction_id', 'p_reversal_date', 'p_reason', 'p_actor_user_id'],
    },
  ],

  hera_txn_update_v1: {
    params: ['p_organization_id', 'p_transaction_id', 'p_patch', 'p_actor_user_id'],
  },

  hera_txn_validate_v1: {
    params: ['p_org_id', 'p_transaction_id'],
    aliases: { p_organization_id: 'p_org_id' },
  },

  hera_txn_void_v1: {
    params: ['p_organization_id', 'p_transaction_id', 'p_reason', 'p_actor_user_id'],
  },

  // Entity signatures
  hera_entity_upsert_v1: {
    params: [
      'p_organization_id',
      'p_entity_type',
      'p_entity_name',
      'p_smart_code',
      'p_entity_id',
      'p_entity_code',
      'p_entity_description',
      'p_parent_entity_id'
    ]
  },

  hera_entity_get_v1: {
    params: ['p_entity_id', 'p_organization_id']
  },

  hera_entity_delete_v1: {
    params: ['p_entity_id', 'p_organization_id']
  },

  hera_entities_query_v1: {
    params: [
      'p_organization_id',
      'p_entity_type',
      'p_smart_code',
      'p_parent_entity_id',
      'p_status'
    ]
  },

  // Dynamic data signatures
  hera_dynamic_data_set_v1: {
    params: [
      'p_organization_id',
      'p_entity_id',
      'p_field_name',
      'p_field_type',
      'p_field_value',
      'p_field_value_number',
      'p_field_value_boolean',
      'p_field_value_date',
      'p_field_value_json',
      'p_field_value_file_url',
      'p_calculated_value',
      'p_smart_code'
    ]
  },

  hera_dynamic_data_get_v1: {
    params: [
      'p_entity_id',
      'p_organization_id',
      'p_field_name'
    ]
  },

  hera_dynamic_data_batch_v1: {
    params: [
      'p_organization_id',
      'p_entity_id',
      'p_items',
      'p_smart_code'
    ]
  },

  // Relationship signatures
  hera_relationship_upsert_v1: {
    params: [
      'p_organization_id',
      'p_from_entity_id',
      'p_to_entity_id',
      'p_relationship_type',
      'p_smart_code',
      'p_relationship_id',
      'p_relationship_strength',
      'p_relationship_data',
      'p_is_bidirectional',
      'p_hierarchy_level'
    ]
  },

  // Transaction line signatures
  hera_transaction_line_append_v1: {
    params: [
      'p_transaction_id',
      'p_organization_id',
      'p_line_number',
      'p_line_type',
      'p_smart_code',
      'p_entity_id',
      'p_description',
      'p_quantity',
      'p_unit_amount',
      'p_line_amount',
      'p_discount_amount',
      'p_tax_amount',
      'p_account_id',
      'p_tax_code',
      'p_metadata'
    ]
  }
};