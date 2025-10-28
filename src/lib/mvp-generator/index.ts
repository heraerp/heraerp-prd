/**
 * HERA MVP Generator - Production Ready
 * Smart Code: HERA.LIB.MVP_GENERATOR.ENGINE.v1
 * 
 * Transforms App Pack YAML configurations into production-ready applications
 * with bulletproof security, validation, and performance.
 */

import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'

// ============================================================================
// CORE TYPES
// ============================================================================

export interface AppPack {
  app: {
    id: string
    name: string
    version: string
    description: string
    smart_code: string
  }
  entities: EntityDefinition[]
  transactions: TransactionDefinition[]
  ui: UIConfiguration
  deployment: DeploymentConfiguration
}

export interface EntityDefinition {
  entity_type: string
  entity_name: string
  description: string
  smart_code: string
  icon: string
  fields: FieldDefinition[]
  relationships: RelationshipDefinition[]
}

export interface FieldDefinition {
  name: string
  type: 'text' | 'number' | 'boolean' | 'date' | 'json' | 'entity_ref'
  required: boolean
  smart_code: string
  options?: string[]
  default?: any
  min?: number
  max?: number
  ref?: {
    entity_type: string
  }
}

export interface RelationshipDefinition {
  type: string
  target_entity: string
  cardinality: 'one' | 'many'
  smart_code: string
  required?: boolean
}

export interface TransactionDefinition {
  transaction_type: string
  transaction_name: string
  description: string
  smart_code: string
  category: string
  lines: TransactionLineDefinition[]
  validation_rules?: ValidationRule[]
}

export interface TransactionLineDefinition {
  name: string
  description: string
  required: boolean
  smart_code: string
  line_type: 'SERVICE' | 'PRODUCT' | 'GL' | 'FEE'
  account_type?: string
  side?: 'DR' | 'CR'
}

export interface ValidationRule {
  rule: string
  description: string
  condition?: string
  pattern?: string
}

export interface UIConfiguration {
  dashboard: {
    title: string
    widgets: WidgetConfig[]
  }
  navigation: NavigationSection[]
}

export interface WidgetConfig {
  type: 'metric' | 'chart'
  title: string
  entity?: string
  calculation: 'count' | 'sum' | 'avg'
  field?: string
  color?: string
}

export interface NavigationSection {
  section: string
  items: NavigationItem[]
}

export interface NavigationItem {
  label: string
  entity?: string
  view: 'list' | 'create' | 'custom'
  icon: string
}

export interface DeploymentConfiguration {
  api: {
    base_path: string
    version: string
  }
  permissions: {
    roles: RoleDefinition[]
  }
}

export interface RoleDefinition {
  role: string
  permissions: string[]
  entities: string[]
}

export interface GeneratorOutput {
  pages: GeneratedFile[]
  apis: GeneratedFile[]
  seeds: GeneratedFile[]
  tests: GeneratedFile[]
  lib: GeneratedFile[]
  middleware: GeneratedFile[]
}

export interface GeneratedFile {
  path: string
  content: string
  type: 'typescript' | 'javascript' | 'json' | 'yaml'
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SmartCodeSchema = z.string().regex(
  /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/,
  'Invalid Smart Code format'
)

const FieldSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'number', 'boolean', 'date', 'json', 'entity_ref']),
  required: z.boolean(),
  smart_code: SmartCodeSchema,
  options: z.array(z.string()).optional(),
  default: z.any().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  ref: z.object({
    entity_type: z.string()
  }).optional()
})

const EntitySchema = z.object({
  entity_type: z.string(),
  entity_name: z.string(),
  description: z.string(),
  smart_code: SmartCodeSchema,
  icon: z.string(),
  fields: z.array(FieldSchema),
  relationships: z.array(z.any())
})

const TransactionLineSchema = z.object({
  name: z.string(),
  description: z.string(),
  required: z.boolean(),
  smart_code: SmartCodeSchema,
  line_type: z.enum(['SERVICE', 'PRODUCT', 'GL', 'FEE']),
  account_type: z.string().optional(),
  side: z.enum(['DR', 'CR']).optional()
})

const TransactionSchema = z.object({
  transaction_type: z.string(),
  transaction_name: z.string(),
  description: z.string(),
  smart_code: SmartCodeSchema,
  category: z.string(),
  lines: z.array(TransactionLineSchema),
  validation_rules: z.array(z.any()).optional()
})

const AppPackSchema = z.object({
  app: z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    description: z.string(),
    smart_code: SmartCodeSchema
  }),
  entities: z.array(EntitySchema),
  transactions: z.array(TransactionSchema),
  ui: z.any(),
  deployment: z.any()
})

// ============================================================================
// MVP GENERATOR ENGINE
// ============================================================================

export class MVPGenerator {
  private appPack: AppPack | null = null
  private overlay: Partial<AppPack> = {}
  private mergedConfig: AppPack | null = null

  /**
   * Load and validate App Pack configuration
   */
  async loadAppPack(appPackPath: string): Promise<void> {
    try {
      const content = await fs.readFile(appPackPath, 'utf-8')
      const rawConfig = JSON.parse(content) // For JSON, use YAML parser for .yaml files
      
      // Validate with Zod schema
      this.appPack = AppPackSchema.parse(rawConfig)
    } catch (error) {
      throw new Error(`Failed to load App Pack: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Apply customer overlay configuration
   */
  applyOverlay(overlay: Partial<AppPack>): void {
    this.overlay = overlay
  }

  /**
   * Merge App Pack with overlay
   */
  mergeConfig(): AppPack {
    if (!this.appPack) {
      throw new Error('No App Pack loaded')
    }

    // Deep merge logic - simplified for MVP
    this.mergedConfig = {
      ...this.appPack,
      ...this.overlay,
      entities: [
        ...this.appPack.entities,
        ...(this.overlay.entities || [])
      ],
      transactions: [
        ...this.appPack.transactions,
        ...(this.overlay.transactions || [])
      ]
    }

    return this.mergedConfig
  }

  /**
   * Validate smart codes in merged configuration
   */
  validateSmartCodes(): string[] {
    if (!this.mergedConfig) {
      throw new Error('No merged configuration available')
    }

    const errors: string[] = []
    
    // Validate app smart code
    if (!SmartCodeSchema.safeParse(this.mergedConfig.app.smart_code).success) {
      errors.push(`Invalid app smart code: ${this.mergedConfig.app.smart_code}`)
    }

    // Validate entity smart codes
    this.mergedConfig.entities.forEach(entity => {
      if (!SmartCodeSchema.safeParse(entity.smart_code).success) {
        errors.push(`Invalid entity smart code: ${entity.smart_code}`)
      }
      
      entity.fields.forEach(field => {
        if (!SmartCodeSchema.safeParse(field.smart_code).success) {
          errors.push(`Invalid field smart code: ${field.smart_code}`)
        }
      })
    })

    // Validate transaction smart codes
    this.mergedConfig.transactions.forEach(transaction => {
      if (!SmartCodeSchema.safeParse(transaction.smart_code).success) {
        errors.push(`Invalid transaction smart code: ${transaction.smart_code}`)
      }
      
      transaction.lines.forEach(line => {
        if (!SmartCodeSchema.safeParse(line.smart_code).success) {
          errors.push(`Invalid line smart code: ${line.smart_code}`)
        }
      })
    })

    return errors
  }

  /**
   * Generate complete application
   */
  async generate(outputDir: string): Promise<GeneratorOutput> {
    if (!this.mergedConfig) {
      throw new Error('No merged configuration available. Call mergeConfig() first.')
    }

    // Validate before generation
    const smartCodeErrors = this.validateSmartCodes()
    if (smartCodeErrors.length > 0) {
      throw new Error(`Smart code validation failed: ${smartCodeErrors.join(', ')}`)
    }

    const output: GeneratorOutput = {
      pages: await this.generatePages(),
      apis: await this.generateAPIs(),
      seeds: await this.generateSeeds(),
      tests: await this.generateTests(),
      lib: await this.generateLib(),
      middleware: await this.generateMiddleware()
    }

    // Write all files to output directory
    await this.writeOutput(outputDir, output)

    return output
  }

  /**
   * Generate pages with shadcn/ui components
   */
  private async generatePages(): Promise<GeneratedFile[]> {
    if (!this.mergedConfig) throw new Error('No configuration')

    const pages: GeneratedFile[] = []

    // Generate application overview page
    pages.push({
      path: `pages/index.tsx`,
      content: this.generateApplicationOverviewPage(),
      type: 'typescript'
    })

    // Generate entity pages
    for (const entity of this.mergedConfig.entities) {
      pages.push({
        path: `pages/${entity.entity_type.toLowerCase()}/index.tsx`,
        content: this.generateEntityListPage(entity),
        type: 'typescript'
      })

      pages.push({
        path: `pages/${entity.entity_type.toLowerCase()}/new.tsx`,
        content: this.generateEntityCreatePage(entity),
        type: 'typescript'
      })
    }

    // Generate transaction pages
    for (const transaction of this.mergedConfig.transactions) {
      pages.push({
        path: `pages/tx/${transaction.transaction_type.toLowerCase()}.tsx`,
        content: this.generateTransactionPage(transaction),
        type: 'typescript'
      })
    }

    return pages
  }

  /**
   * Generate production-ready API handlers
   */
  private async generateAPIs(): Promise<GeneratedFile[]> {
    return [{
      path: 'pages/api/v2/command.ts',
      content: this.generateProductionAPIHandler(),
      type: 'typescript'
    }]
  }

  /**
   * Generate executable seeds
   */
  private async generateSeeds(): Promise<GeneratedFile[]> {
    if (!this.mergedConfig) throw new Error('No configuration')

    return [
      {
        path: 'seeds/seed.plan.json',
        content: JSON.stringify(this.generateSeedPlan(), null, 2),
        type: 'json'
      },
      {
        path: 'seeds/run.ts',
        content: this.generateExecutableSeeder(),
        type: 'typescript'
      }
    ]
  }

  /**
   * Generate real Vitest tests
   */
  private async generateTests(): Promise<GeneratedFile[]> {
    return [
      {
        path: 'tests/smart-codes.test.ts',
        content: this.generateSmartCodeTests(),
        type: 'typescript'
      },
      {
        path: 'tests/gl-balance.test.ts',
        content: this.generateGLBalanceTests(),
        type: 'typescript'
      },
      {
        path: 'tests/actor-stamps.test.ts',
        content: this.generateActorStampTests(),
        type: 'typescript'
      }
    ]
  }

  /**
   * Generate utility libraries
   */
  private async generateLib(): Promise<GeneratedFile[]> {
    return [
      {
        path: 'lib/hera/use-hera.ts',
        content: this.generateUseHeraHook(),
        type: 'typescript'
      },
      {
        path: 'lib/hera/identity.ts',
        content: this.generateIdentityResolver(),
        type: 'typescript'
      },
      {
        path: 'lib/hera/org-resolver.ts',
        content: this.generateOrgResolver(),
        type: 'typescript'
      },
      {
        path: 'lib/hera/guardrails.ts',
        content: this.generateGuardrails(),
        type: 'typescript'
      }
    ]
  }

  /**
   * Generate middleware
   */
  private async generateMiddleware(): Promise<GeneratedFile[]> {
    return [{
      path: 'middleware.ts',
      content: this.generateOrgResolverMiddleware(),
      type: 'typescript'
    }]
  }

  /**
   * Write all generated files to output directory
   */
  private async writeOutput(outputDir: string, output: GeneratorOutput): Promise<void> {
    const allFiles = [
      ...output.pages,
      ...output.apis,
      ...output.seeds,
      ...output.tests,
      ...output.lib,
      ...output.middleware
    ]

    // Write merged config for audit trail
    await this.ensureDir(path.join(outputDir, 'merged.config.json'))
    await fs.writeFile(
      path.join(outputDir, 'merged.config.json'),
      JSON.stringify(this.mergedConfig, null, 2)
    )

    // Write all generated files
    for (const file of allFiles) {
      const filePath = path.join(outputDir, file.path)
      await this.ensureDir(filePath)
      await fs.writeFile(filePath, file.content)
    }
  }

  /**
   * Ensure directory exists for file path
   */
  private async ensureDir(filePath: string): Promise<void> {
    const dir = path.dirname(filePath)
    try {
      await fs.access(dir)
    } catch {
      await fs.mkdir(dir, { recursive: true })
    }
  }

  // ============================================================================
  // GENERATION METHODS - Will implement these next
  // ============================================================================

  private generateEntityListPage(entity: EntityDefinition): string {
    if (!this.mergedConfig) throw new Error('No configuration')
    const { generateEntityListPage } = require('./generators/pages')
    return generateEntityListPage(entity, this.mergedConfig)
  }

  private generateEntityCreatePage(entity: EntityDefinition): string {
    if (!this.mergedConfig) throw new Error('No configuration')
    const { generateEntityCreatePage } = require('./generators/pages')
    return generateEntityCreatePage(entity, this.mergedConfig)
  }

  private generateTransactionPage(transaction: TransactionDefinition): string {
    if (!this.mergedConfig) throw new Error('No configuration')
    const { generateTransactionPage } = require('./generators/pages')
    return generateTransactionPage(transaction, this.mergedConfig)
  }

  private generateApplicationOverviewPage(): string {
    if (!this.mergedConfig) throw new Error('No configuration')
    const { generateApplicationOverviewPage } = require('./generators/pages')
    return generateApplicationOverviewPage(this.mergedConfig)
  }

  private generateProductionAPIHandler(): string {
    if (!this.mergedConfig) throw new Error('No configuration')
    const { generateProductionAPIHandler } = require('./generators/api-handler')
    return generateProductionAPIHandler(this.mergedConfig)
  }

  private generateSeedPlan(): any {
    if (!this.mergedConfig) throw new Error('No configuration')
    const { generateSeedPlan } = require('./generators/seeds')
    return generateSeedPlan(this.mergedConfig)
  }

  private generateExecutableSeeder(): string {
    if (!this.mergedConfig) throw new Error('No configuration')
    const { generateExecutableSeeder } = require('./generators/seeds')
    return generateExecutableSeeder(this.mergedConfig)
  }

  private generateSmartCodeTests(): string {
    if (!this.mergedConfig) throw new Error('No configuration')
    const { generateSmartCodeTests } = require('./generators/tests')
    return generateSmartCodeTests(this.mergedConfig)
  }

  private generateGLBalanceTests(): string {
    if (!this.mergedConfig) throw new Error('No configuration')
    const { generateGLBalanceTests } = require('./generators/tests')
    return generateGLBalanceTests(this.mergedConfig)
  }

  private generateActorStampTests(): string {
    if (!this.mergedConfig) throw new Error('No configuration')
    const { generateActorStampTests } = require('./generators/tests')
    return generateActorStampTests(this.mergedConfig)
  }

  private generateUseHeraHook(): string {
    return `/**
 * useHera Hook - React Client SDK
 * Smart Code: HERA.LIB.HOOKS.USE_HERA.v1
 * 
 * Provides convenient React interface for HERA API v2 commands
 */

import { useState, useCallback } from 'react'

export interface UseHeraOptions {
  baseUrl?: string
  timeout?: number
}

export interface CommandResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  actor_user_id?: string
  organization_id?: string
  request_id?: string
}

export interface UseHeraState {
  loading: boolean
  error: string | null
  lastResponse: CommandResponse | null
}

/**
 * React hook for HERA API v2 commands
 */
export function useHera(options: UseHeraOptions = {}) {
  const [state, setState] = useState<UseHeraState>({
    loading: false,
    error: null,
    lastResponse: null
  })

  const command = useCallback(async <T = any>(
    cmd: string,
    payload: any,
    orgId?: string
  ): Promise<CommandResponse<T>> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Get auth token from your auth provider
      const token = await getAuthToken() // Implement based on your auth system
      
      if (!token) {
        throw new Error('No authentication token available')
      }

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      }

      // Add organization context if provided
      if (orgId) {
        headers['X-Organization-Id'] = orgId
      }

      // Make API request
      const response = await fetch(\`\${options.baseUrl || ''}/api/v2/command\`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ command: cmd, payload }),
        signal: AbortSignal.timeout(options.timeout || 30000)
      })

      const result: CommandResponse<T> = await response.json()

      setState(prev => ({
        ...prev,
        loading: false,
        lastResponse: result,
        error: result.success ? null : result.error?.message || 'Command failed'
      }))

      return result

    } catch (error: any) {
      const errorMessage = error.message || 'Network error'
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        lastResponse: null
      }))

      return {
        success: false,
        error: {
          code: 'client_error',
          message: errorMessage
        }
      }
    }
  }, [options.baseUrl, options.timeout])

  // Convenience methods for common operations
  const createEntity = useCallback((entityData: any, orgId?: string) => {
    return command('entity.create', { entity: entityData }, orgId)
  }, [command])

  const updateEntity = useCallback((entityId: string, updates: any, orgId?: string) => {
    return command('entity.update', { 
      entity: { id: entityId, ...updates } 
    }, orgId)
  }, [command])

  const deleteEntity = useCallback((entityId: string, orgId?: string) => {
    return command('entity.delete', { entity: { id: entityId } }, orgId)
  }, [command])

  const readEntities = useCallback((filters: any, orgId?: string) => {
    return command('entity.read', { filters }, orgId)
  }, [command])

  const createTransaction = useCallback((transactionData: any, lines: any[], orgId?: string) => {
    return command('transaction.create', { 
      transaction: transactionData, 
      lines 
    }, orgId)
  }, [command])

  const setDynamicField = useCallback((entityId: string, fieldName: string, value: any, fieldType: string, smartCode: string, orgId?: string) => {
    return command('dynamic.set', {
      entity_id: entityId,
      fields: [{
        field_name: fieldName,
        field_value_text: fieldType === 'text' ? value : undefined,
        field_value_number: fieldType === 'number' ? value : undefined,
        field_value_boolean: fieldType === 'boolean' ? value : undefined,
        field_value_json: fieldType === 'json' ? value : undefined,
        field_type: fieldType,
        smart_code: smartCode
      }]
    }, orgId)
  }, [command])

  const createRelationship = useCallback((sourceId: string, targetId: string, relationshipType: string, smartCode: string, orgId?: string) => {
    return command('relationship.create', {
      source_entity_id: sourceId,
      relationship: {
        target_entity_id: targetId,
        relationship_type: relationshipType,
        smart_code: smartCode
      }
    }, orgId)
  }, [command])

  return {
    // State
    loading: state.loading,
    error: state.error,
    lastResponse: state.lastResponse,

    // Core command interface
    command,

    // Convenience methods
    createEntity,
    updateEntity,
    deleteEntity,
    readEntities,
    createTransaction,
    setDynamicField,
    createRelationship
  }
}

/**
 * Get authentication token from your auth system
 * This should be implemented based on your authentication provider
 */
async function getAuthToken(): Promise<string | null> {
  // Example implementation for Supabase
  // const { data: { session } } = await supabase.auth.getSession()
  // return session?.access_token || null
  
  // For now, return null - implement based on your auth system
  console.warn('getAuthToken not implemented - please configure your auth provider')
  return null
}

/**
 * Type-safe command helpers
 */
export const HeraCommands = {
  // Entity commands
  ENTITY_CREATE: 'entity.create' as const,
  ENTITY_READ: 'entity.read' as const,
  ENTITY_UPDATE: 'entity.update' as const,
  ENTITY_DELETE: 'entity.delete' as const,

  // Transaction commands
  TRANSACTION_CREATE: 'transaction.create' as const,
  TRANSACTION_READ: 'transaction.read' as const,
  TRANSACTION_UPDATE: 'transaction.update' as const,
  TRANSACTION_DELETE: 'transaction.delete' as const,
  TRANSACTION_POST: 'transaction.post' as const,

  // Dynamic data commands
  DYNAMIC_SET: 'dynamic.set' as const,
  DYNAMIC_GET: 'dynamic.get' as const,
  DYNAMIC_DELETE: 'dynamic.delete' as const,

  // Relationship commands
  RELATIONSHIP_CREATE: 'relationship.create' as const,
  RELATIONSHIP_DELETE: 'relationship.delete' as const
} as const

export type HeraCommand = typeof HeraCommands[keyof typeof HeraCommands]

/**
 * Example usage:
 * 
 * const { loading, error, createEntity, setDynamicField } = useHera()
 * 
 * // Create customer entity
 * const customer = await createEntity({
 *   entity_type: 'CUSTOMER',
 *   entity_name: 'Acme Corp',
 *   smart_code: 'HERA.ENTERPRISE.CUSTOMER.v1'
 * }, orgId)
 * 
 * // Set dynamic field
 * await setDynamicField(
 *   customer.data.id,
 *   'email',
 *   'contact@acme.com',
 *   'text',
 *   'HERA.ENTERPRISE.CUSTOMER.FIELD.EMAIL.v1',
 *   orgId
 * )
 */`
  }

  private generateIdentityResolver(): string {
    const { generateIdentityResolver } = require('./generators/api-handler')
    return generateIdentityResolver()
  }

  private generateOrgResolver(): string {
    const { generateOrgResolver } = require('./generators/api-handler')
    return generateOrgResolver()
  }

  private generateGuardrails(): string {
    const { generateGuardrails } = require('./generators/api-handler')
    return generateGuardrails()
  }

  private generateOrgResolverMiddleware(): string {
    // TODO: Implement org resolver middleware
    return `// Org resolver middleware - TODO: Implement`
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const mvpGenerator = new MVPGenerator()

export { AppPackSchema, SmartCodeSchema }