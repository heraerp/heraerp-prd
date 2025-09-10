/**
 * HERA CLI Test Fixtures
 * Smart Code: HERA.CLI.TEST.FIXTURES.v1
 */

export const TEST_ORGANIZATIONS = {
  valid: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Test Organization',
    code: 'TEST_ORG',
    status: 'active'
  },
  furniture: {
    id: 'f0af4ced-9d12-4a55-a649-b484368db249',
    name: 'Kerala Furniture Works',
    code: 'FURNITURE_ORG',
    status: 'active'
  },
  invalid: {
    id: 'invalid-uuid-format',
    name: 'Invalid Org',
    code: 'INVALID'
  }
}

export const TEST_ENTITIES = {
  customer: {
    id: '22222222-2222-2222-2222-222222222222',
    entity_type: 'customer',
    entity_name: 'Test Customer Inc',
    entity_code: 'CUST001',
    smart_code: 'HERA.CRM.CUSTOMER.ENT.CORPORATE.v1',
    organization_id: TEST_ORGANIZATIONS.valid.id
  },
  product: {
    id: '33333333-3333-3333-3333-333333333333',
    entity_type: 'product',
    entity_name: 'Test Product',
    entity_code: 'PROD001',
    smart_code: 'HERA.INVENTORY.PRODUCT.ENT.PHYSICAL.v1',
    organization_id: TEST_ORGANIZATIONS.valid.id
  },
  gl_account_cash: {
    id: '44444444-4444-4444-4444-444444444444',
    entity_type: 'account',
    entity_name: 'Cash and Bank',
    entity_code: '1100000',
    smart_code: 'HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.v1',
    organization_id: TEST_ORGANIZATIONS.valid.id,
    business_rules: {
      ledger_type: 'GL',
      account_classification: 'ASSET',
      normal_balance: 'DEBIT'
    }
  },
  gl_account_revenue: {
    id: '55555555-5555-5555-5555-555555555555',
    entity_type: 'account',
    entity_name: 'Sales Revenue',
    entity_code: '4100000',
    smart_code: 'HERA.ACCOUNTING.COA.ACCOUNT.GL.REVENUE.v1',
    organization_id: TEST_ORGANIZATIONS.valid.id,
    business_rules: {
      ledger_type: 'GL',
      account_classification: 'REVENUE',
      normal_balance: 'CREDIT'
    }
  }
}

export const TEST_SMART_CODES = {
  valid: [
    'HERA.RESTAURANT.POS.TXN.SALE.v1',
    'HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.v1',
    'HERA.CRM.CUSTOMER.ENT.CORPORATE.v1',
    'HERA.INVENTORY.PRODUCT.ENT.PHYSICAL.v1',
    'HERA.HR.EMPLOYEE.ENT.FULL_TIME.v2',
    'HERA.FIN.GL.TXN.JOURNAL_ENTRY.v1'
  ],
  invalid: [
    'hera.restaurant.pos.txn.sale.v1',  // lowercase
    'HERA.REST.SALE',                   // missing version
    'INVALID.CODE.FORMAT.v1',           // wrong prefix
    'HERA..EMPTY.SEGMENT.v1',           // empty segment
    'HERA.A.B.C.v1',                    // too short segments
    'HERA.RESTAURANT.POS.TXN.SALE.vX'   // invalid version format
  ]
}

export const TEST_TRANSACTIONS = {
  simple_sale: {
    transaction_type: 'SALE',
    smart_code: 'HERA.RETAIL.ORDERS.SALE.ONLINE.v1',
    total_amount: 19.99,
    currency: 'USD',
    organization_id: TEST_ORGANIZATIONS.valid.id,
    lines: [
      {
        line_number: 1,
        line_type: 'ITEM',
        entity_id: TEST_ENTITIES.product.id,
        quantity: 1,
        unit_amount: 19.99,
        line_amount: 19.99,
        smart_code: 'HERA.RETAIL.ORDERS.LINE.ITEM.v1'
      }
    ]
  },
  
  balanced_journal: {
    transaction_type: 'GL_JE',
    smart_code: 'HERA.ACCOUNTING.GL.JOURNAL.ENTRY.v1',
    total_amount: 0,
    currency: 'USD',
    organization_id: TEST_ORGANIZATIONS.valid.id,
    lines: [
      {
        line_number: 1,
        line_type: 'GL',
        line_amount: 100.00,
        smart_code: 'HERA.ACCOUNTING.GL.LINE.DEBIT.v1',
        line_data: {
          account: '1100000',
          currency: 'USD',
          description: 'Cash increase'
        }
      },
      {
        line_number: 2,
        line_type: 'GL',
        line_amount: -100.00,
        smart_code: 'HERA.ACCOUNTING.GL.LINE.CREDIT.v1',
        line_data: {
          account: '4100000',
          currency: 'USD',
          description: 'Revenue recognition'
        }
      }
    ]
  },
  
  unbalanced_journal: {
    transaction_type: 'GL_JE',
    smart_code: 'HERA.ACCOUNTING.GL.JOURNAL.ENTRY.v1',
    total_amount: 0,
    currency: 'USD',
    organization_id: TEST_ORGANIZATIONS.valid.id,
    lines: [
      {
        line_number: 1,
        line_type: 'GL',
        line_amount: 100.00,
        smart_code: 'HERA.ACCOUNTING.GL.LINE.DEBIT.v1',
        line_data: { account: '1100000', currency: 'USD' }
      },
      {
        line_number: 2,
        line_type: 'GL',
        line_amount: -50.00,  // Unbalanced!
        smart_code: 'HERA.ACCOUNTING.GL.LINE.CREDIT.v1',
        line_data: { account: '4100000', currency: 'USD' }
      }
    ]
  },
  
  multi_currency_journal: {
    transaction_type: 'GL_JE',
    smart_code: 'HERA.ACCOUNTING.GL.JOURNAL.MULTICURRENCY.v1',
    total_amount: 0,
    currency: 'USD',
    organization_id: TEST_ORGANIZATIONS.valid.id,
    lines: [
      {
        line_number: 1,
        line_type: 'GL',
        line_amount: 100.00,
        smart_code: 'HERA.ACCOUNTING.GL.LINE.DEBIT.v1',
        line_data: { account: '1100000', currency: 'USD' }
      },
      {
        line_number: 2,
        line_type: 'GL',
        line_amount: -100.00,
        smart_code: 'HERA.ACCOUNTING.GL.LINE.CREDIT.v1',
        line_data: { account: '4100000', currency: 'USD' }
      },
      {
        line_number: 3,
        line_type: 'GL',
        line_amount: 75.00,  // EUR line
        smart_code: 'HERA.ACCOUNTING.GL.LINE.DEBIT.v1',
        line_data: { account: '1110000', currency: 'EUR' }
      },
      {
        line_number: 4,
        line_type: 'GL',
        line_amount: -75.00,  // EUR line
        smart_code: 'HERA.ACCOUNTING.GL.LINE.CREDIT.v1',
        line_data: { account: '4110000', currency: 'EUR' }
      }
    ]
  },
  
  missing_org_id: {
    transaction_type: 'SALE',
    smart_code: 'HERA.RETAIL.ORDERS.SALE.ONLINE.v1',
    total_amount: 19.99,
    // Missing organization_id!
    lines: [
      {
        line_number: 1,
        line_type: 'ITEM',
        line_amount: 19.99,
        smart_code: 'HERA.RETAIL.ORDERS.LINE.ITEM.v1'
      }
    ]
  },
  
  invalid_smart_code: {
    transaction_type: 'SALE',
    smart_code: 'invalid.smart.code.format',  // Invalid!
    total_amount: 19.99,
    organization_id: TEST_ORGANIZATIONS.valid.id,
    lines: [
      {
        line_number: 1,
        line_type: 'ITEM',
        line_amount: 19.99,
        smart_code: 'also.invalid.format'  // Invalid!
      }
    ]
  }
}

export const TEST_DYNAMIC_DATA = {
  customer_email: {
    entity_id: TEST_ENTITIES.customer.id,
    field_name: 'email',
    field_value: 'customer@test.com',
    field_type: 'text',
    smart_code: 'HERA.CRM.CUSTOMER.DYN.EMAIL.v1',
    organization_id: TEST_ORGANIZATIONS.valid.id
  },
  
  product_price: {
    entity_id: TEST_ENTITIES.product.id,
    field_name: 'unit_price',
    field_value_number: 19.99,
    field_type: 'number',
    smart_code: 'HERA.INVENTORY.PRODUCT.DYN.PRICE.v1',
    organization_id: TEST_ORGANIZATIONS.valid.id
  },
  
  customer_vip_status: {
    entity_id: TEST_ENTITIES.customer.id,
    field_name: 'vip_status',
    field_value_boolean: true,
    field_type: 'boolean',
    smart_code: 'HERA.CRM.CUSTOMER.DYN.VIP.v1',
    organization_id: TEST_ORGANIZATIONS.valid.id
  }
}

export const TEST_CLI_COMMANDS = {
  init: {
    valid: [
      'hera init --org 11111111-1111-1111-1111-111111111111 --write-config',
      'hera init --url https://api.example.com --write-config',
      'hera init'  // Interactive mode
    ],
    invalid: [
      'hera init --org invalid-uuid',
      'hera init --url invalid-url'
    ]
  },
  
  smart_code: {
    valid: [
      'hera smart-code validate "HERA.RESTAURANT.POS.TXN.SALE.v1"',
      'hera smart-code validate "HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.v1" --json',
      'hera smart-code validate "HERA.CRM.CUSTOMER.ENT.CORPORATE.v1" --semantic'
    ],
    invalid: [
      'hera smart-code validate "invalid.format"',
      'hera smart-code validate "HERA.REST.SALE"',  // missing version
      'hera smart-code validate ""'  // empty
    ]
  },
  
  tx: {
    valid: [
      `hera tx create --org 11111111-1111-1111-1111-111111111111 --type SALE --code "HERA.RETAIL.ORDERS.SALE.ONLINE.v1" --lines '[{"line_number":1,"line_type":"ITEM","line_amount":19.99,"smart_code":"HERA.RETAIL.ORDERS.LINE.ITEM.v1"}]'`,
      `hera tx list --org 11111111-1111-1111-1111-111111111111 --since 2025-01-01 --json`,
      `hera tx create --type GL_JE --code "HERA.ACCOUNTING.GL.JOURNAL.ENTRY.v1" --lines '[{"line_number":1,"line_type":"GL","line_amount":100,"smart_code":"HERA.ACCOUNTING.GL.LINE.DEBIT.v1"},{"line_number":2,"line_type":"GL","line_amount":-100,"smart_code":"HERA.ACCOUNTING.GL.LINE.CREDIT.v1"}]'`
    ],
    invalid: [
      'hera tx create --type SALE',  // missing required fields
      'hera tx create --type SALE --code "invalid.code" --lines "[]"',
      'hera tx list --since invalid-date'
    ]
  }
}

export const TEST_ERRORS = {
  connection_failure: {
    code: 'CONNECTION_FAILURE',
    message: 'Failed to connect to HERA database',
    exit_code: 10
  },
  
  sacred_tables_missing: {
    code: 'SACRED_TABLES_MISSING', 
    message: 'One or more Sacred Six tables are not accessible',
    exit_code: 11
  },
  
  org_not_found: {
    code: 'ORG_NOT_FOUND',
    message: 'Organization not found or unauthorized',
    exit_code: 12
  },
  
  smart_code_invalid: {
    code: 'SMART_CODE_INVALID',
    message: 'Smart code does not match required pattern',
    exit_code: 20
  },
  
  org_id_missing: {
    code: 'ORG_ID_MISSING',
    message: 'organization_id is required for multi-tenant isolation',
    exit_code: 30
  },
  
  gl_unbalanced: {
    code: 'GL_UNBALANCED',
    message: 'GL journal entries must be balanced per currency',
    exit_code: 32
  }
}

export const MOCK_API_RESPONSES = {
  init_success: {
    organization_id: TEST_ORGANIZATIONS.valid.id,
    sacred_tables_ok: true,
    guardrails_version: '2.0.0',
    capabilities: ['finance_dna', 'auto_journal', 'universal_cashflow'],
    connection_status: 'connected'
  },
  
  smart_code_valid: {
    smart_code: 'HERA.RESTAURANT.POS.TXN.SALE.v1',
    valid: true,
    pattern: '^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$',
    hints: [],
    semantic_checks: {
      industry_valid: true,
      module_recognized: true,
      version_current: true
    }
  },
  
  transaction_created: {
    transaction_id: '66666666-6666-6666-6666-666666666666',
    organization_id: TEST_ORGANIZATIONS.valid.id,
    transaction_type: 'SALE',
    smart_code: 'HERA.RETAIL.ORDERS.SALE.ONLINE.v1',
    transaction_date: '2025-09-10T12:00:00Z',
    total_amount: 19.99,
    currency: 'USD',
    lines: [
      {
        id: '77777777-7777-7777-7777-777777777777',
        line_number: 1,
        line_type: 'ITEM',
        line_amount: 19.99,
        smart_code: 'HERA.RETAIL.ORDERS.LINE.ITEM.v1'
      }
    ],
    ai_confidence: 0,
    ai_insights: {},
    guardrails_passed: {
      multi_tenant: true,
      smart_codes_valid: true,
      gl_balanced: true,
      schema_valid: true
    }
  }
}

// Seed data for testing
export const SEED_DATA = {
  organizations: Object.values(TEST_ORGANIZATIONS).filter(org => org.id.includes('-')),
  entities: Object.values(TEST_ENTITIES),
  dynamic_data: Object.values(TEST_DYNAMIC_DATA),
  transactions: [TEST_TRANSACTIONS.simple_sale, TEST_TRANSACTIONS.balanced_journal]
}