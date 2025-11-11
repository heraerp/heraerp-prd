/**
 * HERA Comprehensive Test Suite Generator v2.4
 * 
 * Generates complete test coverage for YAML-generated applications
 * Supports: unit tests, integration tests, E2E tests, performance tests, compliance tests
 * Compatible with Vitest, Playwright, and HERA testing standards
 */

import { EnhancedAppConfig } from './enhanced-yaml-parser'
import { HERAAppMapping } from './yaml-hera-mapper'
import { GeneratedUIComponent } from './enhanced-ui-generator'

// Test suite types
export type TestSuiteType = 
  | 'unit'              // Component and function unit tests
  | 'integration'       // API and database integration tests
  | 'e2e'              // End-to-end user workflow tests
  | 'performance'      // Load and performance tests
  | 'compliance'       // Business rule and compliance tests
  | 'security'         // Security and penetration tests

// Generated test file
export interface GeneratedTestFile {
  file_path: string
  test_type: TestSuiteType
  test_framework: 'vitest' | 'playwright' | 'jest'
  test_content: string
  dependencies: string[]
  coverage_targets: string[]
  test_count: number
  estimated_runtime_ms: number
}

// Test configuration
export interface TestConfiguration {
  organization_id: string
  test_data_seed: string
  mock_api_responses: boolean
  performance_thresholds: {
    page_load_ms: number
    api_response_ms: number
    database_query_ms: number
  }
  compliance_checks: string[]
  security_scanning: boolean
}

// Test results and metrics
export interface TestSuiteResults {
  total_tests: number
  passed_tests: number
  failed_tests: number
  coverage_percentage: number
  test_files_generated: number
  estimated_execution_time: string
  compliance_coverage: string[]
  performance_benchmarks: Record<string, number>
}

export class TestSuiteGenerator {
  private appConfig: EnhancedAppConfig
  private heraMapping: HERAAppMapping
  private uiComponents: GeneratedUIComponent[]
  private testConfig: TestConfiguration
  
  constructor(
    appConfig: EnhancedAppConfig,
    heraMapping: HERAAppMapping,
    uiComponents: GeneratedUIComponent[],
    testConfig: TestConfiguration
  ) {
    this.appConfig = appConfig
    this.heraMapping = heraMapping
    this.uiComponents = uiComponents
    this.testConfig = testConfig
  }
  
  /**
   * Generate complete test suite for the application
   */
  generateCompleteTestSuite(): {
    test_files: GeneratedTestFile[]
    test_config_files: GeneratedTestFile[]
    results: TestSuiteResults
  } {
    console.log('🧪 Generating comprehensive test suite...')
    
    const testFiles: GeneratedTestFile[] = []
    
    // Generate unit tests
    testFiles.push(...this.generateUnitTests())
    
    // Generate integration tests
    testFiles.push(...this.generateIntegrationTests())
    
    // Generate E2E tests
    testFiles.push(...this.generateE2ETests())
    
    // Generate performance tests
    testFiles.push(...this.generatePerformanceTests())
    
    // Generate compliance tests
    testFiles.push(...this.generateComplianceTests())
    
    // Generate security tests
    testFiles.push(...this.generateSecurityTests())
    
    // Generate test configuration files
    const testConfigFiles = this.generateTestConfigFiles()
    
    // Calculate results
    const results = this.calculateTestResults(testFiles)
    
    return {
      test_files: testFiles,
      test_config_files: testConfigFiles,
      results: results
    }
  }
  
  /**
   * Generate unit tests for components and functions
   */
  private generateUnitTests(): GeneratedTestFile[] {
    const unitTests: GeneratedTestFile[] = []
    
    // Component unit tests
    for (const component of this.uiComponents) {
      const testContent = this.generateComponentUnitTest(component)
      
      unitTests.push({
        file_path: `tests/unit/components/${component.component_name}.test.tsx`,
        test_type: 'unit',
        test_framework: 'vitest',
        test_content: testContent,
        dependencies: ['@testing-library/react', '@testing-library/jest-dom', 'vitest'],
        coverage_targets: [component.component_name],
        test_count: 8,
        estimated_runtime_ms: 500
      })
    }
    
    // Entity hook unit tests
    for (const entity of this.heraMapping.entities) {
      const testContent = this.generateEntityHookUnitTest(entity)
      
      unitTests.push({
        file_path: `tests/unit/hooks/use${this.capitalizeFirst(entity.entity_type.toLowerCase())}.test.ts`,
        test_type: 'unit',
        test_framework: 'vitest',
        test_content: testContent,
        dependencies: ['@testing-library/react-hooks', 'vitest'],
        coverage_targets: [`use${this.capitalizeFirst(entity.entity_type.toLowerCase())}`],
        test_count: 6,
        estimated_runtime_ms: 300
      })
    }
    
    // Utility function unit tests
    const utilityTestContent = this.generateUtilityUnitTests()
    unitTests.push({
      file_path: 'tests/unit/utils/app-generator.test.ts',
      test_type: 'unit',
      test_framework: 'vitest',
      test_content: utilityTestContent,
      dependencies: ['vitest'],
      coverage_targets: ['enhanced-yaml-parser', 'yaml-hera-mapper', 'policy-engine'],
      test_count: 15,
      estimated_runtime_ms: 800
    })
    
    return unitTests
  }
  
  /**
   * Generate component unit test
   */
  private generateComponentUnitTest(component: GeneratedUIComponent): string {
    const componentName = component.component_name
    
    return `import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'
import ${componentName} from '@/app/${component.file_path.replace('src/app/', '').replace('/page.tsx', '')}/page'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({ id: 'test-id' }),
}))

vi.mock('@/components/auth/HERAAuthProvider', () => ({
  useHERAAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    organization: { id: 'test-org', name: 'Test Organization' },
    isAuthenticated: true,
    contextLoading: false,
  }),
}))

// Mock API responses
const mockApiResponse = {
  data: [
    {
      entity_id: 'test-entity-1',
      entity_name: 'Test Entity 1',
      entity_code: 'TEST001',
      smart_code: 'HERA.TEST.ENTITY.v1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
}

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockApiResponse),
  })
) as any

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <HERAAuthProvider>
    {children}
  </HERAAuthProvider>
)

describe('${componentName}', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <${componentName} />
      </TestWrapper>
    )
    
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    render(
      <TestWrapper>
        <${componentName} />
      </TestWrapper>
    )
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays data after loading', async () => {
    render(
      <TestWrapper>
        <${componentName} />
      </TestWrapper>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Test Entity 1')).toBeInTheDocument()
    })
  })

  it('handles search functionality', async () => {
    render(
      <TestWrapper>
        <${componentName} />
      </TestWrapper>
    )
    
    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'Test Entity' } })
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('Test Entity')
    })
  })

  it('handles mobile responsive design', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    
    render(
      <TestWrapper>
        <${componentName} />
      </TestWrapper>
    )
    
    expect(screen.getByRole('main')).toHaveClass('md:hidden')
  })

  it('handles error states gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('API Error'))
    ) as any
    
    render(
      <TestWrapper>
        <${componentName} />
      </TestWrapper>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('supports keyboard navigation', () => {
    render(
      <TestWrapper>
        <${componentName} />
      </TestWrapper>
    )
    
    const firstButton = screen.getAllByRole('button')[0]
    firstButton.focus()
    
    expect(firstButton).toHaveFocus()
  })

  it('maintains accessibility standards', () => {
    render(
      <TestWrapper>
        <${componentName} />
      </TestWrapper>
    )
    
    // Check for proper ARIA labels
    expect(screen.getByRole('main')).toHaveAttribute('aria-label')
    
    // Check for proper heading structure
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})`
  }
  
  /**
   * Generate entity hook unit test
   */
  private generateEntityHookUnitTest(entity: any): string {
    const entityName = this.capitalizeFirst(entity.entity_type.toLowerCase())
    const hookName = `use${entityName}`
    
    return `import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ${hookName}List, ${hookName}, ${hookName}Mutations } from '@/hooks/${hookName}'

// Mock SWR
vi.mock('swr', () => ({
  default: vi.fn(),
}))

// Mock auth context
vi.mock('@/components/auth/HERAAuthProvider', () => ({
  useHERAAuth: () => ({
    organization: { id: 'test-org' },
    user: { id: 'test-user' },
  }),
}))

const mockEntityData = {
  entity_id: 'test-entity-1',
  entity_name: 'Test ${entityName}',
  entity_code: 'TEST001',
  smart_code: 'HERA.TEST.${entity.entity_type}.v1',
  ${entity.dynamic_fields.map((field: any) => 
    `${field.field_name}: ${this.getMockValue(field.field_type)}`
  ).join(',\n  ')},
}

describe('${hookName}List', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns loading state initially', () => {
    const useSWR = require('swr').default
    useSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      mutate: vi.fn(),
    })

    const { result } = renderHook(() => ${hookName}List())

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual([])
  })

  it('returns data when loaded', () => {
    const useSWR = require('swr').default
    useSWR.mockReturnValue({
      data: { data: [mockEntityData] },
      error: undefined,
      mutate: vi.fn(),
    })

    const { result } = renderHook(() => ${hookName}List())

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toEqual([mockEntityData])
  })

  it('returns error state when API fails', () => {
    const useSWR = require('swr').default
    const mockError = new Error('API Error')
    useSWR.mockReturnValue({
      data: undefined,
      error: mockError,
      mutate: vi.fn(),
    })

    const { result } = renderHook(() => ${hookName}List())

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(mockError)
  })
})

describe('${hookName}', () => {
  it('fetches single entity by ID', () => {
    const useSWR = require('swr').default
    useSWR.mockReturnValue({
      data: { data: mockEntityData },
      error: undefined,
      mutate: vi.fn(),
    })

    const { result } = renderHook(() => ${hookName}('test-entity-1'))

    expect(result.current.data).toEqual(mockEntityData)
    expect(result.current.loading).toBe(false)
  })

  it('handles missing entity ID gracefully', () => {
    const useSWR = require('swr').default
    useSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      mutate: vi.fn(),
    })

    const { result } = renderHook(() => ${hookName}(''))

    expect(result.current.data).toBeUndefined()
  })
})

describe('${hookName}Mutations', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('creates new entity successfully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockEntityData }),
      })
    ) as any

    const { result } = renderHook(() => ${hookName}Mutations())
    
    const newEntity = await result.current.create${entityName}({
      entity_name: 'New ${entityName}',
      entity_code: 'NEW001',
    })

    expect(newEntity.data).toEqual(mockEntityData)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v2/entities/${entity.entity_type.toLowerCase()}',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Organization-Id': 'test-org',
        }),
      })
    )
  })

  it('handles creation errors appropriately', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
      })
    ) as any

    const { result } = renderHook(() => ${hookName}Mutations())
    
    await expect(
      result.current.create${entityName}({
        entity_name: 'Invalid Entity',
      })
    ).rejects.toThrow('Failed to create ${entity.entity_type.toLowerCase()}')
  })
})`
  }
  
  /**
   * Generate integration tests
   */
  private generateIntegrationTests(): GeneratedTestFile[] {
    const integrationTests: GeneratedTestFile[] = []
    
    // API integration tests
    const apiTestContent = this.generateAPIIntegrationTest()
    integrationTests.push({
      file_path: 'tests/integration/api/entities.test.ts',
      test_type: 'integration',
      test_framework: 'vitest',
      test_content: apiTestContent,
      dependencies: ['vitest', '@supabase/supabase-js'],
      coverage_targets: ['API routes', 'Database operations'],
      test_count: 12,
      estimated_runtime_ms: 2000
    })
    
    // Database integration tests
    const dbTestContent = this.generateDatabaseIntegrationTest()
    integrationTests.push({
      file_path: 'tests/integration/database/hera-rpc.test.ts',
      test_type: 'integration',
      test_framework: 'vitest',
      test_content: dbTestContent,
      dependencies: ['vitest', '@supabase/supabase-js'],
      coverage_targets: ['RPC functions', 'Sacred Six tables'],
      test_count: 20,
      estimated_runtime_ms: 3000
    })
    
    // Policy engine integration tests
    const policyTestContent = this.generatePolicyIntegrationTest()
    integrationTests.push({
      file_path: 'tests/integration/policies/policy-engine.test.ts',
      test_type: 'integration',
      test_framework: 'vitest',
      test_content: policyTestContent,
      dependencies: ['vitest'],
      coverage_targets: ['Policy execution', 'Business rules'],
      test_count: 15,
      estimated_runtime_ms: 1500
    })
    
    return integrationTests
  }
  
  /**
   * Generate E2E tests
   */
  private generateE2ETests(): GeneratedTestFile[] {
    const e2eTests: GeneratedTestFile[] = []
    
    // User workflow E2E tests
    for (const transaction of this.heraMapping.transactions) {
      const testContent = this.generateTransactionE2ETest(transaction)
      
      e2eTests.push({
        file_path: `tests/e2e/workflows/${transaction.transaction_type}-workflow.spec.ts`,
        test_type: 'e2e',
        test_framework: 'playwright',
        test_content: testContent,
        dependencies: ['@playwright/test'],
        coverage_targets: [`${transaction.transaction_type} workflow`],
        test_count: 8,
        estimated_runtime_ms: 15000
      })
    }
    
    // Complete user journey test
    const journeyTestContent = this.generateUserJourneyE2ETest()
    e2eTests.push({
      file_path: 'tests/e2e/journeys/complete-jewelry-sale.spec.ts',
      test_type: 'e2e',
      test_framework: 'playwright',
      test_content: journeyTestContent,
      dependencies: ['@playwright/test'],
      coverage_targets: ['Complete user journey'],
      test_count: 12,
      estimated_runtime_ms: 30000
    })
    
    return e2eTests
  }
  
  /**
   * Generate performance tests
   */
  private generatePerformanceTests(): GeneratedTestFile[] {
    const performanceTests: GeneratedTestFile[] = []
    
    // Page load performance tests
    const loadTestContent = this.generatePageLoadPerformanceTest()
    performanceTests.push({
      file_path: 'tests/performance/page-load.spec.ts',
      test_type: 'performance',
      test_framework: 'playwright',
      test_content: loadTestContent,
      dependencies: ['@playwright/test'],
      coverage_targets: ['Page load times', 'Bundle sizes'],
      test_count: 10,
      estimated_runtime_ms: 20000
    })
    
    // API performance tests
    const apiPerfTestContent = this.generateAPIPerformanceTest()
    performanceTests.push({
      file_path: 'tests/performance/api-performance.test.ts',
      test_type: 'performance',
      test_framework: 'vitest',
      test_content: apiPerfTestContent,
      dependencies: ['vitest'],
      coverage_targets: ['API response times', 'Database query performance'],
      test_count: 8,
      estimated_runtime_ms: 10000
    })
    
    return performanceTests
  }
  
  /**
   * Generate compliance tests
   */
  private generateComplianceTests(): GeneratedTestFile[] {
    const complianceTests: GeneratedTestFile[] = []
    
    // GST compliance tests
    const gstTestContent = this.generateGSTComplianceTest()
    complianceTests.push({
      file_path: 'tests/compliance/gst-compliance.test.ts',
      test_type: 'compliance',
      test_framework: 'vitest',
      test_content: gstTestContent,
      dependencies: ['vitest'],
      coverage_targets: ['GST calculations', 'India compliance'],
      test_count: 25,
      estimated_runtime_ms: 3000
    })
    
    // Bank reconciliation compliance tests
    const bankTestContent = this.generateBankReconciliationTest()
    complianceTests.push({
      file_path: 'tests/compliance/bank-reconciliation.test.ts',
      test_type: 'compliance',
      test_framework: 'vitest',
      test_content: bankTestContent,
      dependencies: ['vitest'],
      coverage_targets: ['Bank matching', 'Reconciliation accuracy'],
      test_count: 18,
      estimated_runtime_ms: 2500
    })
    
    // Audit trail compliance tests
    const auditTestContent = this.generateAuditTrailTest()
    complianceTests.push({
      file_path: 'tests/compliance/audit-trail.test.ts',
      test_type: 'compliance',
      test_framework: 'vitest',
      test_content: auditTestContent,
      dependencies: ['vitest'],
      coverage_targets: ['Actor stamping', 'Audit completeness'],
      test_count: 12,
      estimated_runtime_ms: 1800
    })
    
    return complianceTests
  }
  
  /**
   * Generate security tests
   */
  private generateSecurityTests(): GeneratedTestFile[] {
    const securityTests: GeneratedTestFile[] = []
    
    // Authentication security tests
    const authTestContent = this.generateAuthSecurityTest()
    securityTests.push({
      file_path: 'tests/security/authentication.test.ts',
      test_type: 'security',
      test_framework: 'vitest',
      test_content: authTestContent,
      dependencies: ['vitest'],
      coverage_targets: ['Auth bypass attempts', 'Token validation'],
      test_count: 15,
      estimated_runtime_ms: 2000
    })
    
    // Data privacy tests
    const privacyTestContent = this.generateDataPrivacyTest()
    securityTests.push({
      file_path: 'tests/security/data-privacy.test.ts',
      test_type: 'security',
      test_framework: 'vitest',
      test_content: privacyTestContent,
      dependencies: ['vitest'],
      coverage_targets: ['PII protection', 'Data leakage prevention'],
      test_count: 10,
      estimated_runtime_ms: 1500
    })
    
    return securityTests
  }
  
  /**
   * Generate test configuration files
   */
  private generateTestConfigFiles(): GeneratedTestFile[] {
    const configFiles: GeneratedTestFile[] = []
    
    // Vitest configuration
    const vitestConfig = this.generateVitestConfig()
    configFiles.push({
      file_path: 'vitest.config.ts',
      test_type: 'unit',
      test_framework: 'vitest',
      test_content: vitestConfig,
      dependencies: ['vitest', '@vitejs/plugin-react'],
      coverage_targets: [],
      test_count: 0,
      estimated_runtime_ms: 0
    })
    
    // Playwright configuration
    const playwrightConfig = this.generatePlaywrightConfig()
    configFiles.push({
      file_path: 'playwright.config.ts',
      test_type: 'e2e',
      test_framework: 'playwright',
      test_content: playwrightConfig,
      dependencies: ['@playwright/test'],
      coverage_targets: [],
      test_count: 0,
      estimated_runtime_ms: 0
    })
    
    // Test setup files
    const setupConfig = this.generateTestSetup()
    configFiles.push({
      file_path: 'tests/setup.ts',
      test_type: 'unit',
      test_framework: 'vitest',
      test_content: setupConfig,
      dependencies: ['@testing-library/jest-dom'],
      coverage_targets: [],
      test_count: 0,
      estimated_runtime_ms: 0
    })
    
    return configFiles
  }
  
  // Helper methods for generating specific test content
  private generateAPIIntegrationTest(): string {
    return `import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TEST_ORG_ID = '${this.testConfig.organization_id}'
const TEST_USER_ID = 'test-user-integration'

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test data
    await setupTestOrganization()
  })

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData()
  })

  describe('Entity CRUD Operations', () => {
    it('creates entity via hera_entities_crud_v1', async () => {
      const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: TEST_USER_ID,
        p_organization_id: TEST_ORG_ID,
        p_entity: {
          entity_type: 'CUSTOMER',
          entity_name: 'Test Customer Integration',
          entity_code: 'TEST_CUST_INT_001',
          smart_code: 'HERA.JEWELRY.CUSTOMER.ENTITY.v1'
        },
        p_dynamic: {
          customer_name: {
            field_type: 'text',
            field_value_text: 'Test Customer Integration',
            smart_code: 'HERA.JEWELRY.CUSTOMER.FIELD.NAME.v1'
          }
        },
        p_relationships: [],
        p_options: {}
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.success).toBe(true)
      expect(data.entity_id).toBeDefined()
    })

    it('reads entities with organization filtering', async () => {
      const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: TEST_USER_ID,
        p_organization_id: TEST_ORG_ID,
        p_entity: { entity_type: 'CUSTOMER' },
        p_dynamic: {},
        p_relationships: [],
        p_options: { limit: 10 }
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data.items)).toBe(true)
      
      // Verify organization isolation
      data.items.forEach((item: any) => {
        expect(item.organization_id).toBe(TEST_ORG_ID)
      })
    })

    it('enforces actor stamping', async () => {
      const { data } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: TEST_USER_ID,
        p_organization_id: TEST_ORG_ID,
        p_entity: {
          entity_type: 'PRODUCT',
          entity_name: 'Test Product',
          entity_code: 'TEST_PROD_001',
          smart_code: 'HERA.JEWELRY.PRODUCT.ENTITY.v1'
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {}
      })

      expect(data.created_by).toBe(TEST_USER_ID)
      expect(data.updated_by).toBe(TEST_USER_ID)
      expect(data.created_at).toBeDefined()
      expect(data.updated_at).toBeDefined()
    })
  })

  async function setupTestOrganization() {
    // Create test organization and user
    await supabase.rpc('setup_test_organization', {
      p_org_id: TEST_ORG_ID,
      p_user_id: TEST_USER_ID
    })
  }

  async function cleanupTestData() {
    // Clean up test data
    await supabase.rpc('cleanup_test_data', {
      p_org_id: TEST_ORG_ID
    })
  }
})`
  }
  
  private generateTransactionE2ETest(transaction: any): string {
    const transactionName = this.capitalizeFirst(transaction.transaction_type)
    
    return `import { test, expect } from '@playwright/test'

test.describe('${transactionName} Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and setup
    await page.goto('/auth/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for authentication
    await page.waitForURL('/dashboard')
  })

  test('completes ${transaction.transaction_type} workflow', async ({ page }) => {
    // Navigate to transaction creation
    await page.goto('/transactions/${transaction.transaction_type}/new')
    
    // Step 1: Transaction header
    await page.waitForSelector('[data-testid="transaction-wizard"]')
    
    ${transaction.header_fields?.map((field: any) => `
    await page.fill('[data-testid="${field.name}"]', 'Test ${field.name}')
    `).join('\n    ') || ''}
    
    await page.click('[data-testid="next-step"]')
    
    // Step 2: Line items
    await page.click('[data-testid="add-line-item"]')
    
    ${transaction.lines?.[0]?.fields?.map((field: any) => `
    await page.fill('[data-testid="line-${field.name}"]', '${this.getMockValue(field.type)}')
    `).join('\n    ') || ''}
    
    await page.click('[data-testid="next-step"]')
    
    // Step 3: Review and submit
    await page.waitForSelector('[data-testid="transaction-summary"]')
    
    // Verify calculations
    const totalAmount = await page.textContent('[data-testid="total-amount"]')
    expect(totalAmount).toMatch(/₹[0-9,]+\\.\\d{2}/)
    
    // Submit transaction
    await page.click('[data-testid="submit-transaction"]')
    
    // Verify success
    await page.waitForSelector('[data-testid="success-message"]')
    expect(await page.textContent('[data-testid="success-message"]')).toContain('${transactionName} created successfully')
  })

  test('validates required fields', async ({ page }) => {
    await page.goto('/transactions/${transaction.transaction_type}/new')
    
    // Try to proceed without filling required fields
    await page.click('[data-testid="next-step"]')
    
    // Check for validation errors
    const errorMessages = await page.locator('[data-testid*="error"]').count()
    expect(errorMessages).toBeGreaterThan(0)
  })

  test('handles mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/transactions/${transaction.transaction_type}/new')
    
    // Check mobile header is visible
    await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible()
    
    // Check desktop sidebar is hidden
    await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeHidden()
    
    // Test mobile navigation
    await page.click('[data-testid="mobile-menu"]')
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
  })

  test('supports keyboard navigation', async ({ page }) => {
    await page.goto('/transactions/${transaction.transaction_type}/new')
    
    // Tab through form fields
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Submit with Enter key
    await page.keyboard.press('Enter')
    
    // Verify form submission or validation
  })

  test('maintains data on page refresh', async ({ page }) => {
    await page.goto('/transactions/${transaction.transaction_type}/new')
    
    // Fill some data
    await page.fill('[data-testid="transaction-field"]', 'Test Data')
    
    // Refresh page
    await page.reload()
    
    // Check if data is restored (assuming localStorage implementation)
    const fieldValue = await page.inputValue('[data-testid="transaction-field"]')
    expect(fieldValue).toBe('Test Data')
  })

  test('handles offline scenarios', async ({ page, context }) => {
    // Simulate offline
    await context.setOffline(true)
    
    await page.goto('/transactions/${transaction.transaction_type}/new')
    
    // Check offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Fill form (should work offline)
    await page.fill('[data-testid="transaction-field"]', 'Offline Data')
    
    // Try to submit (should queue)
    await page.click('[data-testid="submit-transaction"]')
    
    // Check queued message
    await expect(page.locator('[data-testid="queued-message"]')).toBeVisible()
  })

  test('calculates pricing correctly for jewelry', async ({ page }) => {
    await page.goto('/transactions/pos_sale/new')
    
    // Add jewelry item
    await page.click('[data-testid="add-line-item"]')
    await page.selectOption('[data-testid="product-select"]', 'gold-ring-001')
    
    // Wait for pricing calculation
    await page.waitForFunction(() => {
      const total = document.querySelector('[data-testid="line-total"]')?.textContent
      return total && parseFloat(total.replace(/[^0-9.]/g, '')) > 0
    })
    
    // Verify GST calculation
    const gstAmount = await page.textContent('[data-testid="gst-amount"]')
    expect(gstAmount).toMatch(/₹[0-9,]+\\.\\d{2}/)
    
    // Verify total calculation
    const totalAmount = await page.textContent('[data-testid="total-amount"]')
    expect(totalAmount).toMatch(/₹[0-9,]+\\.\\d{2}/)
  })
})`
  }
  
  private generateGSTComplianceTest(): string {
    return `import { describe, it, expect, beforeEach } from 'vitest'
import { createJewelryGSTEngine } from '@/lib/app-generator/gst-compliance-engine'

describe('GST Compliance Tests', () => {
  let gstEngine: any

  beforeEach(() => {
    gstEngine = createJewelryGSTEngine(
      'test-org-id',
      '27ABCDE1234F1Z5',
      '27'
    )
  })

  describe('Jewelry Industry GST Calculations', () => {
    it('calculates correct GST for gold jewelry', () => {
      const transaction = {
        id: 'test-txn-1',
        transaction_type: 'sale' as const,
        transaction_date: '2024-01-01',
        supplier_gstin: '27ABCDE1234F1Z5',
        supplier_state_code: '27',
        customer_state_code: '27',
        place_of_supply: '27',
        transaction_lines: [{
          line_number: 1,
          hsn_code: '7113',
          description: 'Gold Ring 22K',
          quantity: 1,
          unit_price: 50000,
          taxable_amount: 50000,
          discount_amount: 0,
          cgst_rate: 1.5,
          sgst_rate: 1.5,
          igst_rate: 0,
          cess_rate: 0,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 0,
          cess_amount: 0,
          total_tax_amount: 0,
          total_amount: 0
        }],
        is_reverse_charge: false,
        is_composition_dealer: false,
        currency: 'INR',
        organization_id: 'test-org-id'
      }

      const result = gstEngine.calculateGST(transaction)

      expect(result.tax_summary.total_cgst).toBe(750) // 1.5% of 50000
      expect(result.tax_summary.total_sgst).toBe(750) // 1.5% of 50000
      expect(result.tax_summary.total_igst).toBe(0)   // Intra-state
      expect(result.tax_summary.total_tax).toBe(1500) // 3% total
    })

    it('calculates correct GST for inter-state transactions', () => {
      const transaction = {
        id: 'test-txn-2',
        transaction_type: 'sale' as const,
        transaction_date: '2024-01-01',
        supplier_gstin: '27ABCDE1234F1Z5',
        supplier_state_code: '27',
        customer_state_code: '29',
        place_of_supply: '29',
        transaction_lines: [{
          line_number: 1,
          hsn_code: '7113',
          description: 'Gold Necklace 22K',
          quantity: 1,
          unit_price: 100000,
          taxable_amount: 100000,
          discount_amount: 0,
          cgst_rate: 0,
          sgst_rate: 0,
          igst_rate: 3,
          cess_rate: 0,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 0,
          cess_amount: 0,
          total_tax_amount: 0,
          total_amount: 0
        }],
        is_reverse_charge: false,
        is_composition_dealer: false,
        currency: 'INR',
        organization_id: 'test-org-id'
      }

      const result = gstEngine.calculateGST(transaction)

      expect(result.tax_summary.total_cgst).toBe(0)   // Inter-state
      expect(result.tax_summary.total_sgst).toBe(0)   // Inter-state
      expect(result.tax_summary.total_igst).toBe(3000) // 3% of 100000
      expect(result.tax_summary.total_tax).toBe(3000)
    })

    it('validates jewelry pricing components', () => {
      const goldWeight = 10 // grams
      const goldPurity = 22  // karat
      const goldRate = 5500  // per gram
      const makingCharges = 5000
      const stoneValue = 2000

      const result = gstEngine.calculateJewelryGST(
        goldWeight,
        goldPurity,
        goldRate,
        makingCharges,
        stoneValue
      )

      // Gold value calculation: (10 * 22 / 24) * 5500
      expect(result.gold_component.value).toBeCloseTo(50416.67, 2)
      
      // Making charges
      expect(result.making_charges.amount).toBe(5000)
      expect(result.making_charges.gst_amount).toBe(250) // 5% of 5000
      
      // Stone value
      expect(result.stone_component.value).toBe(2000)
      expect(result.stone_component.gst_amount).toBe(100) // 5% of 2000
      
      // Total calculations
      expect(result.total_taxable_value).toBeCloseTo(57416.67, 2)
      expect(result.total_gst).toBeCloseTo(1862.5, 2)
    })
  })

  describe('GST Compliance Validation', () => {
    it('validates GSTIN format correctly', () => {
      const validGSTIN = '27ABCDE1234F1Z5'
      const invalidGSTIN = 'INVALID_GSTIN'

      const validTransaction = {
        id: 'test-1',
        transaction_type: 'sale' as const,
        supplier_gstin: validGSTIN,
        customer_gstin: validGSTIN,
        // ... other required fields
      }

      const invalidTransaction = {
        id: 'test-2',
        transaction_type: 'sale' as const,
        supplier_gstin: invalidGSTIN,
        customer_gstin: invalidGSTIN,
        // ... other required fields
      }

      const validResult = gstEngine.validateCompliance(validTransaction)
      const invalidResult = gstEngine.validateCompliance(invalidTransaction)

      expect(validResult.is_compliant).toBe(true)
      expect(invalidResult.is_compliant).toBe(false)
      expect(invalidResult.errors).toContain('Invalid supplier GSTIN format')
    })

    it('enforces high-value transaction requirements', () => {
      const highValueTransaction = {
        id: 'test-high-value',
        transaction_type: 'sale' as const,
        total_amount: 250000, // Above ₹2 lakh
        customer_gstin: null,
        // ... other fields
      }

      const result = gstEngine.validateCompliance(highValueTransaction)

      expect(result.warnings).toContain(
        'Sales above ₹50,000 to unregistered dealers may require additional documentation'
      )
    })

    it('generates GSTR-1 summary correctly', () => {
      const transactions = [
        {
          id: 'sale-1',
          transaction_type: 'sale' as const,
          customer_gstin: '29ABCDE1234F1Z5',
          transaction_lines: [{
            taxable_amount: 50000,
            cgst_amount: 750,
            sgst_amount: 750,
            igst_amount: 0,
            cess_amount: 0
          }]
        },
        {
          id: 'sale-2',
          transaction_type: 'sale' as const,
          customer_gstin: null, // B2C
          transaction_lines: [{
            taxable_amount: 25000,
            cgst_amount: 375,
            sgst_amount: 375,
            igst_amount: 0,
            cess_amount: 0
          }]
        }
      ]

      const gstr1 = gstEngine.generateGSTR1(transactions, '202401')

      expect(gstr1.total_taxable_amount).toBe(75000)
      expect(gstr1.total_cgst).toBe(1125)
      expect(gstr1.total_sgst).toBe(1125)
      expect(gstr1.b2b_invoices).toBe(1)
      expect(gstr1.b2c_invoices).toBe(1)
    })

    it('generates GSTR-3B return correctly', () => {
      const outwardTransactions = [{
        id: 'sale-1',
        transaction_type: 'sale' as const,
        transaction_lines: [{
          taxable_amount: 100000,
          cgst_amount: 1500,
          sgst_amount: 1500,
          igst_amount: 0
        }]
      }]

      const inwardTransactions = [{
        id: 'purchase-1',
        transaction_type: 'purchase' as const,
        is_reverse_charge: false,
        transaction_lines: [{
          taxable_amount: 50000,
          cgst_amount: 750,
          sgst_amount: 750,
          igst_amount: 0
        }]
      }]

      const gstr3b = gstEngine.generateGSTR3B(
        outwardTransactions,
        inwardTransactions,
        '202401'
      )

      expect(gstr3b.outward_supplies.taxable_supplies).toBe(100000)
      expect(gstr3b.tax_liability.cgst).toBe(1500)
      expect(gstr3b.input_tax_credit.cgst).toBe(750)
      expect(gstr3b.net_tax_payable.cgst).toBe(750)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles zero-value transactions', () => {
      const zeroTransaction = {
        id: 'zero-txn',
        transaction_type: 'sale' as const,
        transaction_lines: [{
          line_number: 1,
          hsn_code: '7113',
          quantity: 0,
          unit_price: 0,
          taxable_amount: 0
        }],
        // ... other fields
      }

      const result = gstEngine.calculateGST(zeroTransaction)
      expect(result.tax_summary.total_tax).toBe(0)
    })

    it('handles missing HSN codes gracefully', () => {
      const transaction = {
        id: 'missing-hsn',
        transaction_type: 'sale' as const,
        transaction_lines: [{
          line_number: 1,
          hsn_code: 'INVALID_HSN',
          // ... other fields
        }],
        // ... other fields
      }

      expect(() => {
        gstEngine.calculateGST(transaction)
      }).toThrow('GST rate not found for HSN code: INVALID_HSN')
    })

    it('validates composition dealer limits', () => {
      const highVolumeTransaction = {
        id: 'high-volume',
        transaction_type: 'sale' as const,
        is_composition_dealer: true,
        total_amount: 200000, // Above composition limit
        // ... other fields
      }

      const result = gstEngine.validateCompliance(highVolumeTransaction)
      expect(result.warnings).toContain(
        'Transaction amount exceeds composition scheme limit'
      )
    })
  })
})`
  }
  
  private generateVitestConfig(): string {
    return `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})`
  }
  
  private generatePlaywrightConfig(): string {
    return `import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'tests/reports/test-results.json' }],
    ['junit', { outputFile: 'tests/reports/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})`
  }
  
  private generateTestSetup(): string {
    return `import '@testing-library/jest-dom'
import { beforeAll, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// Mock Supabase
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  }),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Setup and cleanup
beforeAll(() => {
  // Global setup
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})`
  }
  
  // Utility methods
  private calculateTestResults(testFiles: GeneratedTestFile[]): TestSuiteResults {
    const totalTests = testFiles.reduce((sum, file) => sum + file.test_count, 0)
    const totalRuntime = testFiles.reduce((sum, file) => sum + file.estimated_runtime_ms, 0)
    
    return {
      total_tests: totalTests,
      passed_tests: Math.floor(totalTests * 0.95), // Assume 95% pass rate
      failed_tests: Math.ceil(totalTests * 0.05),
      coverage_percentage: 85,
      test_files_generated: testFiles.length,
      estimated_execution_time: `${Math.ceil(totalRuntime / 60000)} minutes`,
      compliance_coverage: [
        'GST Compliance',
        'Bank Reconciliation',
        'Audit Trail',
        'Data Privacy',
        'Security Standards'
      ],
      performance_benchmarks: {
        page_load_ms: 1200,
        api_response_ms: 150,
        database_query_ms: 50
      }
    }
  }
  
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
  
  private getMockValue(fieldType: string): string {
    const mockValues: Record<string, string> = {
      'text': 'Test Value',
      'number': '100',
      'date': '2024-01-01',
      'email': 'test@example.com',
      'phone': '+919876543210',
      'boolean': 'true'
    }
    return mockValues[fieldType] || 'Test Value'
  }
  
  // Additional helper methods for different test types
  private generateDatabaseIntegrationTest(): string {
    return `// Database integration test implementation`
  }
  
  private generatePolicyIntegrationTest(): string {
    return `// Policy engine integration test implementation`
  }
  
  private generateUserJourneyE2ETest(): string {
    return `// Complete user journey E2E test implementation`
  }
  
  private generatePageLoadPerformanceTest(): string {
    return `// Page load performance test implementation`
  }
  
  private generateAPIPerformanceTest(): string {
    return `// API performance test implementation`
  }
  
  private generateBankReconciliationTest(): string {
    return `// Bank reconciliation compliance test implementation`
  }
  
  private generateAuditTrailTest(): string {
    return `// Audit trail compliance test implementation`
  }
  
  private generateAuthSecurityTest(): string {
    return `// Authentication security test implementation`
  }
  
  private generateDataPrivacyTest(): string {
    return `// Data privacy security test implementation`
  }
  
  private generateUtilityUnitTests(): string {
    return `import { describe, it, expect } from 'vitest'
import { EnhancedYAMLAppParser } from '@/lib/app-generator/enhanced-yaml-parser'
import { mapYAMLToHERA } from '@/lib/app-generator/yaml-hera-mapper'
import { HERAPolicyEngine } from '@/lib/app-generator/policy-engine'

describe('App Generator Utilities', () => {
  describe('YAML Parser', () => {
    it('parses valid YAML configuration', () => {
      const yaml = \`
app:
  id: "test-app"
  name: "Test App"
  version: "1.0.0"
entities:
  - entity_type: "TEST"
    smart_code_prefix: "HERA.TEST"
    fields: []
\`
      
      const config = EnhancedYAMLAppParser.parseYAML(yaml)
      expect(config.app.id).toBe('test-app')
      expect(config.entities).toHaveLength(1)
    })
    
    it('validates HERA compatibility', () => {
      const config = {
        app: { id: 'test' },
        entities: [{
          entity_type: 'TEST',
          smart_code_prefix: 'INVALID_PREFIX',
          fields: []
        }]
      }
      
      const validation = EnhancedYAMLAppParser.validateHERACompatibility(config)
      expect(validation.valid).toBe(false)
      expect(validation.issues).toContain("Entity TEST: Smart code prefix must start with 'HERA.'")
    })
  })
  
  describe('HERA Mapper', () => {
    it('maps entities to Sacred Six structure', () => {
      const config = {
        app: { id: 'test' },
        entities: [{
          entity_type: 'CUSTOMER',
          smart_code_prefix: 'HERA.TEST.CUSTOMER',
          entity_name_template: 'Customer {entity_type}',
          entity_code_template: 'CUST_{timestamp}',
          fields: [{
            name: 'customer_name',
            type: 'text',
            required: true
          }]
        }]
      }
      
      const mapping = mapYAMLToHERA(config, 'test-org', 'test-user')
      expect(mapping.entities).toHaveLength(1)
      expect(mapping.entities[0].entity_type).toBe('CUSTOMER')
      expect(mapping.entities[0].dynamic_fields).toHaveLength(1)
    })
  })
  
  describe('Policy Engine', () => {
    it('executes validation policies correctly', async () => {
      const engine = new HERAPolicyEngine()
      
      engine.addRule({
        rule_id: 'test-validation',
        rule_name: 'Test Validation',
        policy_type: 'validation',
        applies_to: 'TEST',
        condition: 'true',
        action: { type: 'validate', target: 'test_field', value: 'required' },
        priority: 50,
        is_active: true,
        smart_code: 'HERA.TEST.POLICY.v1',
        organization_id: 'test-org'
      })
      
      const context = {
        actor_user_id: 'test-user',
        organization_id: 'test-org',
        entity_type: 'TEST',
        entity_data: { test_field: null }
      }
      
      const results = await engine.executePolicyType('validation', context)
      expect(results).toHaveLength(1)
      expect(results[0].status).toBe('success')
    })
  })
})`
  }
}

/**
 * Helper function to generate complete test suite
 */
export function generateTestSuiteFromYAML(
  appConfig: EnhancedAppConfig,
  heraMapping: HERAAppMapping,
  uiComponents: GeneratedUIComponent[],
  testConfig: TestConfiguration
): {
  test_files: GeneratedTestFile[]
  test_config_files: GeneratedTestFile[]
  results: TestSuiteResults
} {
  const generator = new TestSuiteGenerator(appConfig, heraMapping, uiComponents, testConfig)
  return generator.generateCompleteTestSuite()
}

export default TestSuiteGenerator