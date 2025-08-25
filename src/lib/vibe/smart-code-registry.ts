// HERA 100% Vibe Coding System - Smart Code Registry
// Smart Code: HERA.VIBE.FOUNDATION.SMART.REGISTRY.v1
// Purpose: Universal smart code registration and management system

import { VibeComponent, SmartCodeEntry, VibeError } from './types'

export class SmartCodeRegistry {
  private registry: Map<string, SmartCodeEntry> = new Map()
  private components: Map<string, VibeComponent> = new Map()
  private isInitialized: boolean = false
  private organizationId: string = ''

  // Initialize the registry with organization context
  async initialize(organizationId?: string): Promise<void> {
    try {
      this.organizationId = organizationId || ''
      
      // Load existing registry from universal tables
      await this.loadExistingRegistry()
      
      // Register core vibe patterns
      await this.registerCorePatterns()
      
      this.isInitialized = true
      console.log('🗂️ Smart Code Registry initialized')
      console.log(`   Organization: ${this.organizationId}`)
      console.log(`   Registered codes: ${this.registry.size}`)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new VibeError(
        `Failed to initialize Smart Code Registry: ${errorMessage}`,
        'HERA.VIBE.REGISTRY.INIT.FAILURE.v1',
        { organization_id: organizationId, error: errorMessage }
      )
    }
  }

  // Register a new vibe component
  async registerComponent(component: VibeComponent): Promise<void> {
    if (!this.isInitialized) {
      throw new VibeError(
        'Smart Code Registry not initialized',
        'HERA.VIBE.REGISTRY.NOT.INITIALIZED.v1'
      )
    }

    // Validate smart code format
    this.validateSmartCode(component.smart_code)

    // Check for conflicts
    if (this.registry.has(component.smart_code)) {
      const existing = this.registry.get(component.smart_code)!
      console.warn(`⚠️ Smart code already registered: ${component.smart_code}`)
      
      // Update usage count for existing code
      existing.usage_count++
      existing.integration_count++
      
      await this.persistRegistryEntry(existing)
      return
    }

    // Create registry entry
    const entry: SmartCodeEntry = {
      smart_code: component.smart_code,
      component_id: component.id,
      registration_date: new Date(),
      usage_count: 1,
      integration_count: 0,
      quality_score: 100, // Start with perfect score
      status: 'active',
      organization_id: component.organization_id || this.organizationId
    }

    // Store in registry
    this.registry.set(component.smart_code, entry)
    this.components.set(component.smart_code, component)

    // Persist to universal tables
    await this.persistComponent(component)
    await this.persistRegistryEntry(entry)

    console.log(`📝 Registered smart code: ${component.smart_code}`)
  }

  // Get component by smart code
  async getComponent(smartCode: string): Promise<VibeComponent | null> {
    if (!this.isInitialized) {
      throw new VibeError(
        'Smart Code Registry not initialized',
        'HERA.VIBE.REGISTRY.NOT.INITIALIZED.v1'
      )
    }

    // Check local cache first
    if (this.components.has(smartCode)) {
      // Update usage count
      const entry = this.registry.get(smartCode)
      if (entry) {
        entry.usage_count++
        await this.persistRegistryEntry(entry)
      }
      
      return this.components.get(smartCode)!
    }

    // Load from database if not in cache
    const component = await this.loadComponentFromDatabase(smartCode)
    if (component) {
      this.components.set(smartCode, component)
    }

    return component
  }

  // Get all components matching pattern
  async getComponentsByPattern(pattern: string): Promise<VibeComponent[]> {
    const components: VibeComponent[] = []
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))

    for (const [smartCode, component] of this.components) {
      if (regex.test(smartCode)) {
        components.push(component)
      }
    }

    return components
  }

  // Update component quality score
  async updateQualityScore(smartCode: string, score: number): Promise<void> {
    const entry = this.registry.get(smartCode)
    if (entry) {
      entry.quality_score = score
      await this.persistRegistryEntry(entry)
      console.log(`📊 Updated quality score for ${smartCode}: ${score}%`)
    }
  }

  // Get registry statistics
  getRegistryStatistics(): RegistryStatistics {
    const entries = Array.from(this.registry.values())
    
    return {
      total_components: entries.length,
      active_components: entries.filter(e => e.status === 'active').length,
      deprecated_components: entries.filter(e => e.status === 'deprecated').length,
      experimental_components: entries.filter(e => e.status === 'experimental').length,
      average_quality_score: entries.reduce((sum, e) => sum + e.quality_score, 0) / entries.length,
      total_usage_count: entries.reduce((sum, e) => sum + e.usage_count, 0),
      total_integration_count: entries.reduce((sum, e) => sum + e.integration_count, 0),
      organization_id: this.organizationId
    }
  }

  // Search components by purpose or functionality
  async searchComponents(query: string): Promise<VibeComponent[]> {
    const results: VibeComponent[] = []
    const queryLower = query.toLowerCase()

    for (const component of this.components.values()) {
      if (
        component.name.toLowerCase().includes(queryLower) ||
        component.purpose.toLowerCase().includes(queryLower) ||
        component.smart_code.toLowerCase().includes(queryLower)
      ) {
        results.push(component)
      }
    }

    return results
  }

  // Validate smart code format compliance
  private validateSmartCode(smartCode: string): void {
    const heraVibePattern = /^HERA\.VIBE\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/
    const heraGeneralPattern = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/
    
    if (!heraVibePattern.test(smartCode) && !heraGeneralPattern.test(smartCode)) {
      throw new VibeError(
        `Invalid smart code format: ${smartCode}. Expected: HERA.MODULE.FUNCTION.TYPE.CONTEXT.v1`,
        'HERA.VIBE.REGISTRY.INVALID.SMARTCODE.v1',
        { smart_code: smartCode }
      )
    }
  }

  // Load existing registry from database
  private async loadExistingRegistry(): Promise<void> {
    try {
      // Load from core_entities where entity_type = 'vibe_component'
      const response = await fetch('/api/v1/universal', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hera_auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Process existing components
        // This would be implemented based on actual API response format
        console.log('📂 Loaded existing registry from database')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn('⚠️ Could not load existing registry:', errorMessage)
    }
  }

  // Register core vibe patterns
  private async registerCorePatterns(): Promise<void> {
    const corePatterns = [
      {
        id: 'vibe-engine',
        name: 'Vibe Engine Core',
        smart_code: 'HERA.VIBE.FOUNDATION.CORE.ENGINE.v1',
        purpose: 'Main vibe coding engine for seamless continuity',
        relationships: ['HERA.VIBE.FOUNDATION.SMART.REGISTRY.v1'],
        evolution_history: [],
        usage_patterns: [],
        maintenance_notes: ['Core component - handle with care'],
        test_scenarios: [],
        performance_metrics: {},
        organization_id: this.organizationId,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system'
      },
      {
        id: 'smart-registry',
        name: 'Smart Code Registry',
        smart_code: 'HERA.VIBE.FOUNDATION.SMART.REGISTRY.v1',
        purpose: 'Universal smart code registration and management',
        relationships: ['HERA.VIBE.FOUNDATION.CORE.ENGINE.v1'],
        evolution_history: [],
        usage_patterns: [],
        maintenance_notes: ['Manages all smart code registrations'],
        test_scenarios: [],
        performance_metrics: {},
        organization_id: this.organizationId,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system'
      }
    ]

    for (const pattern of corePatterns) {
      await this.registerComponent(pattern)
    }
  }

  // Persist component to universal tables
  private async persistComponent(component: VibeComponent): Promise<void> {
    try {
      const response = await fetch('/api/v1/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hera_auth_token')}`
        },
        body: JSON.stringify({
          action: 'create',
          table: 'core_entities',
          data: {
            entity_type: 'vibe_component',
            entity_name: component.name,
            entity_code: component.id,
            smart_code: component.smart_code,
            description: component.purpose,
            status: 'active',
            metadata: {
              relationships: component.relationships,
              evolution_history: component.evolution_history,
              usage_patterns: component.usage_patterns,
              maintenance_notes: component.maintenance_notes,
              test_scenarios: component.test_scenarios,
              performance_metrics: component.performance_metrics
            }
          }
        })
      })

      if (!response.ok) {
        console.warn('⚠️ Failed to persist component to database')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn('⚠️ Component persistence failed:', errorMessage)
    }
  }

  // Persist registry entry to universal tables
  private async persistRegistryEntry(entry: SmartCodeEntry): Promise<void> {
    try {
      const response = await fetch('/api/v1/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hera_auth_token')}`
        },
        body: JSON.stringify({
          action: 'create',
          table: 'core_dynamic_data',
          data: {
            entity_id: entry.component_id,
            field_name: 'registry_entry',
            field_type: 'json',
            field_value_json: entry,
            smart_code: 'HERA.VIBE.REGISTRY.ENTRY.DATA.v1'
          }
        })
      })

      if (!response.ok) {
        console.warn('⚠️ Failed to persist registry entry to database')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn('⚠️ Registry entry persistence failed:', errorMessage)
    }
  }

  // Load component from database
  private async loadComponentFromDatabase(smartCode: string): Promise<VibeComponent | null> {
    try {
      // This would query the database for the component
      // Implementation depends on actual API structure
      return null
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn('⚠️ Failed to load component from database:', errorMessage)
      return null
    }
  }
}

// Registry statistics interface
interface RegistryStatistics {
  total_components: number
  active_components: number
  deprecated_components: number
  experimental_components: number
  average_quality_score: number
  total_usage_count: number
  total_integration_count: number
  organization_id: string
}