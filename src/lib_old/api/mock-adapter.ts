/**
 * Mock adapter for Factory Dashboard demo mode
 * Returns deterministic demo data
 */

import type {
  UniversalTransaction,
  UniversalTransactionLine,
  ModuleEntity,
  RelationshipRow,
  FiscalPeriod
} from '../types/factory'

const DEMO_MODULES: ModuleEntity[] = [
  {
    id: 'mod-001',
    organization_id: 'ORG-DEMO-001',
    entity_type: 'module',
    entity_name: 'Restaurant Loyalty',
    smart_code: 'HERA.RESTAURANT.MODULE.APP.LOYALTY.V1_0',
    version: 1,
    metadata: {
      release_channels: ['beta', 'stable'],
      latest_version: '1.0.0',
      released_at: '2024-01-15T10:30:00Z',
      industry: 'restaurant',
      description: 'Customer loyalty and rewards management'
    }
  },
  {
    id: 'mod-002',
    organization_id: 'ORG-DEMO-001',
    entity_type: 'module',
    entity_name: 'Ice Cream Inventory',
    smart_code: 'HERA.MANUFACTURING.MODULE.APP.INVENTORY-ICECREAM.v1_0',
    version: 1,
    metadata: {
      release_channels: ['beta'],
      latest_version: '1.0.0',
      industry: 'manufacturing',
      description: 'Temperature-controlled inventory management'
    }
  },
  {
    id: 'mod-003',
    organization_id: 'ORG-DEMO-001',
    entity_type: 'module',
    entity_name: 'Healthcare Portal',
    smart_code: 'HERA.HEALTHCARE.MODULE.APP.PATIENT-PORTAL.v2_0',
    version: 2,
    metadata: {
      release_channels: ['stable', 'LTS'],
      latest_version: '2.0.0',
      released_at: '2024-01-10T14:20:00Z',
      industry: 'healthcare',
      description: 'HIPAA-compliant patient portal'
    }
  }
]

const DEMO_TRANSACTIONS: UniversalTransaction[] = [
  // Restaurant Loyalty - Complete pipeline
  {
    id: 'txn-001',
    organization_id: 'ORG-DEMO-001',
    transaction_type: 'FACTORY.PLAN',
    smart_code: 'HERA.RESTAURANT.MODULE.APP.LOYALTY.V1_0',
    transaction_date: '2024-01-15T08:00:00Z',
    transaction_status: 'passed',
    ai_confidence: 0.95,
    metadata: {}
  },
  {
    id: 'txn-002',
    organization_id: 'ORG-DEMO-001',
    transaction_type: 'FACTORY.BUILD',
    smart_code: 'HERA.RESTAURANT.MODULE.APP.LOYALTY.V1_0',
    transaction_date: '2024-01-15T09:00:00Z',
    transaction_status: 'passed',
    ai_confidence: 0.98,
    metadata: {}
  },
  {
    id: 'txn-003',
    organization_id: 'ORG-DEMO-001',
    transaction_type: 'FACTORY.TEST',
    smart_code: 'HERA.RESTAURANT.MODULE.APP.LOYALTY.V1_0',
    transaction_date: '2024-01-15T09:30:00Z',
    transaction_status: 'passed',
    ai_confidence: 0.92,
    metadata: {}
  },
  {
    id: 'txn-004',
    organization_id: 'ORG-DEMO-001',
    transaction_type: 'FACTORY.RELEASE',
    smart_code: 'HERA.RESTAURANT.MODULE.APP.LOYALTY.V1_0',
    transaction_date: '2024-01-15T10:30:00Z',
    transaction_status: 'passed',
    ai_confidence: 0.99,
    metadata: { channel: 'beta' }
  },

  // Ice Cream - Blocked by compliance
  {
    id: 'txn-005',
    organization_id: 'ORG-DEMO-001',
    transaction_type: 'FACTORY.PLAN',
    smart_code: 'HERA.MANUFACTURING.MODULE.APP.INVENTORY-ICECREAM.v1_0',
    transaction_date: '2024-01-16T08:00:00Z',
    transaction_status: 'passed',
    ai_confidence: 0.94,
    metadata: {}
  },
  {
    id: 'txn-006',
    organization_id: 'ORG-DEMO-001',
    transaction_type: 'FACTORY.BUILD',
    smart_code: 'HERA.MANUFACTURING.MODULE.APP.INVENTORY-ICECREAM.v1_0',
    transaction_date: '2024-01-16T09:00:00Z',
    transaction_status: 'passed',
    ai_confidence: 0.96,
    metadata: {}
  },
  {
    id: 'txn-007',
    organization_id: 'ORG-DEMO-001',
    transaction_type: 'FACTORY.COMPLY',
    smart_code: 'HERA.MANUFACTURING.MODULE.APP.INVENTORY-ICECREAM.v1_0',
    transaction_date: '2024-01-16T10:00:00Z',
    transaction_status: 'blocked',
    ai_confidence: 0.88,
    metadata: { reason: 'HACCP temperature monitoring compliance failed' }
  },

  // Healthcare - Currently running
  {
    id: 'txn-008',
    organization_id: 'ORG-DEMO-001',
    transaction_type: 'FACTORY.TEST',
    smart_code: 'HERA.HEALTHCARE.MODULE.APP.PATIENT-PORTAL.v2_0',
    transaction_date: '2024-01-17T11:00:00Z',
    transaction_status: 'running',
    ai_confidence: 0.91,
    metadata: {}
  }
]

const DEMO_TRANSACTION_LINES: Record<string, UniversalTransactionLine[]> = {
  'txn-003': [
    {
      id: 'line-003-1',
      transaction_id: 'txn-003',
      organization_id: 'ORG-DEMO-001',
      line_number: 1,
      line_type: 'STEP.UNIT',
      smart_code: 'HERA.UNIVERSAL.FACTORY.TEST.UNIT.V1_0',
      line_data: {},
      metadata: {
        status: 'PASSED',
        coverage: 0.92,
        duration_ms: 3421,
        passed: 145,
        failed: 2,
        artifacts: {
          coverage: 's3://hera-artifacts/coverage/loyalty-unit.lcov',
          report: 's3://hera-artifacts/reports/loyalty-unit.html'
        }
      }
    },
    {
      id: 'line-003-2',
      transaction_id: 'txn-003',
      organization_id: 'ORG-DEMO-001',
      line_number: 2,
      line_type: 'STEP.E2E',
      smart_code: 'HERA.UNIVERSAL.FACTORY.TEST.E2E.V1_0',
      line_data: {},
      metadata: {
        status: 'PASSED',
        coverage: 0.86,
        duration_ms: 8765,
        passed: 38,
        failed: 1,
        artifacts: {
          coverage: 's3://hera-artifacts/coverage/loyalty-e2e.lcov',
          screenshots: 's3://hera-artifacts/screenshots/loyalty/',
          trace: 's3://hera-artifacts/traces/loyalty-e2e.trace'
        }
      }
    },
    {
      id: 'line-003-3',
      transaction_id: 'txn-003',
      organization_id: 'ORG-DEMO-001',
      line_number: 3,
      line_type: 'STEP.SECURITY',
      smart_code: 'HERA.UNIVERSAL.FACTORY.TEST.SECURITY.V1_0',
      line_data: {},
      metadata: {
        status: 'PASSED',
        vulnerabilities: { critical: 0, high: 0, medium: 2, low: 5 },
        artifacts: {
          sbom: 's3://hera-artifacts/sbom/loyalty-v1.0.0.json'
        }
      }
    }
  ],
  'txn-007': [
    {
      id: 'line-007-1',
      transaction_id: 'txn-007',
      organization_id: 'ORG-DEMO-001',
      line_number: 1,
      line_type: 'STEP.COMPLIANCE.HACCP',
      smart_code: 'HERA.MANUFACTURING.COMPLIANCE.HACCP.v1_0',
      line_data: {},
      metadata: {
        status: 'FAILED',
        violations: [
          {
            policy: 'HACCP_TEMPERATURE_MONITORING',
            message: 'Real-time temperature monitoring not implemented',
            severity: 'error',
            waivable: false
          },
          {
            policy: 'HACCP_COLD_CHAIN',
            message: 'Cold chain breach detection missing',
            severity: 'error',
            waivable: false
          }
        ]
      }
    }
  ],
  'txn-008': [
    {
      id: 'line-008-1',
      transaction_id: 'txn-008',
      organization_id: 'ORG-DEMO-001',
      line_number: 1,
      line_type: 'STEP.UNIT',
      smart_code: 'HERA.UNIVERSAL.FACTORY.TEST.UNIT.V1_0',
      line_data: {},
      metadata: {
        status: 'RUNNING',
        progress: 0.65,
        estimated_completion: '2024-01-17T11:30:00Z'
      }
    }
  ]
}

const DEMO_RELATIONSHIPS: RelationshipRow[] = [
  {
    id: 'rel-001',
    organization_id: 'ORG-DEMO-001',
    from_entity_id: 'mod-001',
    to_entity_id: 'mod-cap-001',
    relationship_type: 'DEPENDS_ON',
    metadata: { version_constraint: '>=1.0' }
  },
  {
    id: 'rel-002',
    organization_id: 'ORG-DEMO-001',
    from_entity_id: 'mod-002',
    to_entity_id: 'mod-cap-002',
    relationship_type: 'DEPENDS_ON',
    metadata: { version_constraint: '>=2.0' }
  },
  {
    id: 'rel-003',
    organization_id: 'ORG-DEMO-001',
    from_entity_id: 'mod-002',
    to_entity_id: 'mod-001',
    relationship_type: 'DEPENDS_ON',
    metadata: { version_constraint: '>=1.0' }
  }
]

const DEMO_FISCAL_PERIODS: FiscalPeriod[] = [
  {
    id: 'fiscal-001',
    organization_id: 'ORG-DEMO-001',
    entity_type: 'fiscal_period',
    entity_code: 'FY2024-Q1',
    metadata: {
      status: 'closed',
      period_start: '2024-01-01',
      period_end: '2024-03-31',
      fiscal_year: 2024
    }
  }
]

export const MockAdapter = {
  async getTransactions(orgId: string, from: string, to: string): Promise<UniversalTransaction[]> {
    return DEMO_TRANSACTIONS.filter(t => t.organization_id === orgId)
  },

  async getTransactionLines(orgId: string, txnId: string): Promise<UniversalTransactionLine[]> {
    return DEMO_TRANSACTION_LINES[txnId] || []
  },

  async getModules(orgId: string): Promise<ModuleEntity[]> {
    return DEMO_MODULES.filter(m => m.organization_id === orgId)
  },

  async getRelationships(orgId: string): Promise<RelationshipRow[]> {
    return DEMO_RELATIONSHIPS.filter(r => r.organization_id === orgId)
  },

  async getFiscalPeriods(orgId: string): Promise<FiscalPeriod[]> {
    return DEMO_FISCAL_PERIODS.filter(f => f.organization_id === orgId)
  },

  async postWaiver(orgId: string, payload: any): Promise<{ ok: boolean }> {
    console.log('Mock: Creating waiver', payload)
    return { ok: true }
  },

  async getAllTransactionLines(
    orgId: string,
    txnIds: string[]
  ): Promise<UniversalTransactionLine[]> {
    const allLines: UniversalTransactionLine[] = []
    txnIds.forEach(txnId => {
      const lines = DEMO_TRANSACTION_LINES[txnId] || []
      allLines.push(...lines)
    })
    return allLines
  }
}
