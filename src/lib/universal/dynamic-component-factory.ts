/**
 * HERA Dynamic Component Factory
 * Smart Code: HERA.PLATFORM.UNIVERSAL.COMPONENT_FACTORY.v1
 * 
 * Runtime component resolution and rendering system
 * Eliminates hardcoded component mappings with database-driven component resolution
 */

import { ComponentType, ReactNode, lazy, LazyExoticComponent } from 'react'
import { supabaseAppBuilder, GeneratedAppRuntime } from './supabase-app-builder'

// Core Universal Templates (always available)
import { EntityWizard } from '@/components/universal/EntityWizard'
import { TransactionWizard } from '@/components/universal/TransactionWizard'
import { UniversalOperationPage } from '@/components/universal/UniversalOperationPage'
import { UniversalEntityShell } from '@/components/universal/UniversalEntityShell'
import { UniversalTransactionShell } from '@/components/universal/UniversalTransactionShell'
import HERAMasterDataTemplate from '@/components/hera/HERAMasterDataTemplate'

export interface ComponentMapping {
  component_name: string
  component_path: string
  component_type: 'core' | 'universal' | 'custom' | 'lazy'
  entity_types?: string[]
  transaction_types?: string[]
  screen_types?: string[]
  permissions?: string[]
  organization_id?: string
  lazy_import?: () => Promise<{ default: ComponentType<any> }>
}

export interface ComponentResolutionContext {
  app_id: string
  organization_id: string
  entity_type?: string
  transaction_type?: string
  screen_type?: string
  operation: 'create' | 'read' | 'update' | 'delete' | 'list'
  permissions?: string[]
  user_preferences?: any
}

export interface ResolvedComponent {
  component: ComponentType<any>
  component_name: string
  config: any
  fallback_used: boolean
  resolution_path: string[]
}

/**
 * Dynamic Component Factory Class
 * Resolves and renders components based on runtime configuration
 */
export class DynamicComponentFactory {
  private static instance: DynamicComponentFactory
  private coreComponents: Map<string, ComponentType<any>>
  private customComponents: Map<string, ComponentType<any>>
  private lazyComponents: Map<string, LazyExoticComponent<ComponentType<any>>>
  private componentMappings: Map<string, ComponentMapping>
  private fallbackMappings: Map<string, string>

  private constructor() {
    this.coreComponents = new Map()
    this.customComponents = new Map()
    this.lazyComponents = new Map()
    this.componentMappings = new Map()
    this.fallbackMappings = new Map()

    this.initializeCoreComponents()
    this.initializeFallbackMappings()
  }

  public static getInstance(): DynamicComponentFactory {
    if (!DynamicComponentFactory.instance) {
      DynamicComponentFactory.instance = new DynamicComponentFactory()
    }
    return DynamicComponentFactory.instance
  }

  /**
   * Initialize core universal components
   */
  private initializeCoreComponents(): void {
    this.coreComponents.set('EntityWizard', EntityWizard)
    this.coreComponents.set('TransactionWizard', TransactionWizard)
    this.coreComponents.set('UniversalOperationPage', UniversalOperationPage)
    this.coreComponents.set('UniversalEntityShell', UniversalEntityShell)
    this.coreComponents.set('UniversalTransactionShell', UniversalTransactionShell)
    this.coreComponents.set('HERAMasterDataTemplate', HERAMasterDataTemplate)
    
    // Common aliases
    this.coreComponents.set('EntityListPage', HERAMasterDataTemplate)
    this.coreComponents.set('TransactionListPage', HERAMasterDataTemplate)
    this.coreComponents.set('EntityDetailPage', UniversalOperationPage)
    this.coreComponents.set('TransactionDetailPage', UniversalOperationPage)
    this.coreComponents.set('EntityForm', EntityWizard)
    this.coreComponents.set('TransactionForm', TransactionWizard)

    console.log(`🔧 DynamicComponentFactory: Initialized ${this.coreComponents.size} core components`)
  }

  /**
   * Initialize fallback component mappings
   */
  private initializeFallbackMappings(): void {
    // Entity operation fallbacks
    this.fallbackMappings.set('entity:create', 'EntityWizard')
    this.fallbackMappings.set('entity:read', 'EntityDetailPage')
    this.fallbackMappings.set('entity:update', 'EntityWizard')
    this.fallbackMappings.set('entity:list', 'EntityListPage')

    // Transaction operation fallbacks
    this.fallbackMappings.set('transaction:create', 'TransactionWizard')
    this.fallbackMappings.set('transaction:read', 'TransactionDetailPage')
    this.fallbackMappings.set('transaction:update', 'TransactionWizard')
    this.fallbackMappings.set('transaction:list', 'TransactionListPage')

    // Screen type fallbacks
    this.fallbackMappings.set('screen:entity_list', 'EntityListPage')
    this.fallbackMappings.set('screen:entity_form', 'EntityWizard')
    this.fallbackMappings.set('screen:transaction_form', 'TransactionWizard')
    this.fallbackMappings.set('screen:dashboard', 'HERAMasterDataTemplate')
    this.fallbackMappings.set('screen:report', 'HERAMasterDataTemplate')

    console.log(`📋 DynamicComponentFactory: Initialized ${this.fallbackMappings.size} fallback mappings`)
  }

  /**
   * Resolve component for given context
   */
  async resolveComponent(context: ComponentResolutionContext): Promise<ResolvedComponent> {
    const resolutionPath: string[] = []

    try {
      console.log(`🔍 DynamicComponentFactory: Resolving component for ${context.app_id}:${context.operation}`)

      // 1. Try app-specific component mapping
      const appComponent = await this.resolveAppSpecificComponent(context)
      if (appComponent) {
        resolutionPath.push('app_specific')
        return {
          component: appComponent.component,
          component_name: appComponent.component_name,
          config: appComponent.config,
          fallback_used: false,
          resolution_path: resolutionPath
        }
      }

      // 2. Try organization-specific custom component
      const customComponent = await this.resolveCustomComponent(context)
      if (customComponent) {
        resolutionPath.push('organization_custom')
        return {
          component: customComponent.component,
          component_name: customComponent.component_name,
          config: customComponent.config,
          fallback_used: false,
          resolution_path: resolutionPath
        }
      }

      // 3. Try entity/transaction type specific component
      const typeComponent = await this.resolveTypeSpecificComponent(context)
      if (typeComponent) {
        resolutionPath.push('type_specific')
        return {
          component: typeComponent.component,
          component_name: typeComponent.component_name,
          config: typeComponent.config,
          fallback_used: false,
          resolution_path: resolutionPath
        }
      }

      // 4. Fall back to operation-based component
      const fallbackComponent = this.resolveFallbackComponent(context)
      resolutionPath.push('fallback')
      
      return {
        component: fallbackComponent.component,
        component_name: fallbackComponent.component_name,
        config: fallbackComponent.config,
        fallback_used: true,
        resolution_path: resolutionPath
      }

    } catch (error) {
      console.error('💥 DynamicComponentFactory: Error resolving component:', error)
      
      // Ultimate fallback
      const ultimateFallback = this.getUltimateFallback(context)
      resolutionPath.push('ultimate_fallback')
      
      return {
        component: ultimateFallback,
        component_name: 'HERAMasterDataTemplate',
        config: {},
        fallback_used: true,
        resolution_path: resolutionPath
      }
    }
  }

  /**
   * Resolve app-specific component from configuration
   */
  private async resolveAppSpecificComponent(
    context: ComponentResolutionContext
  ): Promise<{ component: ComponentType<any>; component_name: string; config: any } | null> {
    try {
      // Load app configuration
      const appRuntime = await supabaseAppBuilder.loadAppConfig(
        context.app_id,
        'system', // TODO: Use actual actor ID
        {
          organization_id: context.organization_id,
          resolve_inheritance: true
        }
      )

      if (!appRuntime) {
        return null
      }

      // Check for screen-specific component mapping
      if (context.screen_type && appRuntime.app_config.screens) {
        const screen = appRuntime.app_config.screens.find(
          s => s.screen_type === context.screen_type
        )
        
        if (screen?.component) {
          const component = this.getComponentByName(screen.component)
          if (component) {
            return {
              component,
              component_name: screen.component,
              config: screen
            }
          }
        }
      }

      // Check entity-specific configurations
      if (context.entity_type) {
        const entityConfig = appRuntime.entity_configs[`${context.app_id}.${context.entity_type.toLowerCase()}`]
        if (entityConfig) {
          const componentName = this.getEntityComponentName(context.operation)
          const component = this.getComponentByName(componentName)
          if (component) {
            return {
              component,
              component_name: componentName,
              config: entityConfig
            }
          }
        }
      }

      // Check transaction-specific configurations
      if (context.transaction_type) {
        const transactionConfig = appRuntime.transaction_configs[`${context.app_id}.${context.transaction_type.toLowerCase()}`]
        if (transactionConfig) {
          const componentName = this.getTransactionComponentName(context.operation)
          const component = this.getComponentByName(componentName)
          if (component) {
            return {
              component,
              component_name: componentName,
              config: transactionConfig
            }
          }
        }
      }

      return null

    } catch (error) {
      console.error('Error resolving app-specific component:', error)
      return null
    }
  }

  /**
   * Resolve organization-specific custom component
   */
  private async resolveCustomComponent(
    context: ComponentResolutionContext
  ): Promise<{ component: ComponentType<any>; component_name: string; config: any } | null> {
    // Check custom components registry
    const customKey = `${context.organization_id}:${context.entity_type || context.transaction_type}:${context.operation}`
    const customComponent = this.customComponents.get(customKey)
    
    if (customComponent) {
      return {
        component: customComponent,
        component_name: customKey,
        config: {}
      }
    }

    return null
  }

  /**
   * Resolve type-specific component
   */
  private async resolveTypeSpecificComponent(
    context: ComponentResolutionContext
  ): Promise<{ component: ComponentType<any>; component_name: string; config: any } | null> {
    // Try to load a type-specific component (e.g., VESSEL_EntityWizard, SALE_TransactionWizard)
    if (context.entity_type) {
      const typeComponentName = `${context.entity_type}_${this.getEntityComponentName(context.operation)}`
      const component = this.getComponentByName(typeComponentName)
      if (component) {
        return {
          component,
          component_name: typeComponentName,
          config: {}
        }
      }
    }

    if (context.transaction_type) {
      const typeComponentName = `${context.transaction_type}_${this.getTransactionComponentName(context.operation)}`
      const component = this.getComponentByName(typeComponentName)
      if (component) {
        return {
          component,
          component_name: typeComponentName,
          config: {}
        }
      }
    }

    return null
  }

  /**
   * Resolve fallback component based on operation
   */
  private resolveFallbackComponent(
    context: ComponentResolutionContext
  ): { component: ComponentType<any>; component_name: string; config: any } {
    let fallbackKey: string

    if (context.entity_type) {
      fallbackKey = `entity:${context.operation}`
    } else if (context.transaction_type) {
      fallbackKey = `transaction:${context.operation}`
    } else if (context.screen_type) {
      fallbackKey = `screen:${context.screen_type}`
    } else {
      fallbackKey = `entity:${context.operation}` // Default to entity
    }

    const componentName = this.fallbackMappings.get(fallbackKey) || 'HERAMasterDataTemplate'
    const component = this.getComponentByName(componentName)!

    return {
      component,
      component_name: componentName,
      config: {}
    }
  }

  /**
   * Get ultimate fallback component
   */
  private getUltimateFallback(context: ComponentResolutionContext): ComponentType<any> {
    return HERAMasterDataTemplate
  }

  /**
   * Get component by name from all registries
   */
  private getComponentByName(componentName: string): ComponentType<any> | null {
    // Check core components first
    const coreComponent = this.coreComponents.get(componentName)
    if (coreComponent) {
      return coreComponent
    }

    // Check custom components
    const customComponent = this.customComponents.get(componentName)
    if (customComponent) {
      return customComponent
    }

    // Check lazy components
    const lazyComponent = this.lazyComponents.get(componentName)
    if (lazyComponent) {
      return lazyComponent
    }

    return null
  }

  /**
   * Get entity operation component name
   */
  private getEntityComponentName(operation: string): string {
    switch (operation) {
      case 'create':
      case 'update':
        return 'EntityWizard'
      case 'read':
        return 'EntityDetailPage'
      case 'list':
        return 'EntityListPage'
      default:
        return 'EntityDetailPage'
    }
  }

  /**
   * Get transaction operation component name
   */
  private getTransactionComponentName(operation: string): string {
    switch (operation) {
      case 'create':
      case 'update':
        return 'TransactionWizard'
      case 'read':
        return 'TransactionDetailPage'
      case 'list':
        return 'TransactionListPage'
      default:
        return 'TransactionDetailPage'
    }
  }

  /**
   * Register custom component
   */
  registerCustomComponent(
    name: string,
    component: ComponentType<any>,
    organizationId?: string
  ): void {
    const key = organizationId ? `${organizationId}:${name}` : name
    this.customComponents.set(key, component)
    console.log(`🔧 DynamicComponentFactory: Registered custom component: ${key}`)
  }

  /**
   * Register lazy component
   */
  registerLazyComponent(
    name: string,
    importFunction: () => Promise<{ default: ComponentType<any> }>
  ): void {
    const lazyComponent = lazy(importFunction)
    this.lazyComponents.set(name, lazyComponent)
    console.log(`⚡ DynamicComponentFactory: Registered lazy component: ${name}`)
  }

  /**
   * Register component mapping
   */
  registerComponentMapping(mapping: ComponentMapping): void {
    const key = `${mapping.organization_id || 'global'}:${mapping.component_name}`
    this.componentMappings.set(key, mapping)
    console.log(`📋 DynamicComponentFactory: Registered component mapping: ${key}`)
  }

  /**
   * Unregister component
   */
  unregisterComponent(name: string, organizationId?: string): void {
    const key = organizationId ? `${organizationId}:${name}` : name
    
    this.customComponents.delete(key)
    this.lazyComponents.delete(key)
    this.componentMappings.delete(key)
    
    console.log(`🗑️ DynamicComponentFactory: Unregistered component: ${key}`)
  }

  /**
   * List registered components
   */
  listComponents(): {
    core: string[]
    custom: string[]
    lazy: string[]
    mappings: string[]
  } {
    return {
      core: Array.from(this.coreComponents.keys()),
      custom: Array.from(this.customComponents.keys()),
      lazy: Array.from(this.lazyComponents.keys()),
      mappings: Array.from(this.componentMappings.keys())
    }
  }

  /**
   * Clear custom components for organization
   */
  clearOrganizationComponents(organizationId: string): void {
    const keysToRemove: string[] = []

    this.customComponents.forEach((_, key) => {
      if (key.startsWith(`${organizationId}:`)) {
        keysToRemove.push(key)
      }
    })

    this.lazyComponents.forEach((_, key) => {
      if (key.startsWith(`${organizationId}:`)) {
        keysToRemove.push(key)
      }
    })

    this.componentMappings.forEach((_, key) => {
      if (key.startsWith(`${organizationId}:`)) {
        keysToRemove.push(key)
      }
    })

    keysToRemove.forEach(key => {
      this.customComponents.delete(key)
      this.lazyComponents.delete(key)
      this.componentMappings.delete(key)
    })

    console.log(`🧹 DynamicComponentFactory: Cleared ${keysToRemove.length} components for org ${organizationId}`)
  }
}

// Export singleton instance
export const dynamicComponentFactory = DynamicComponentFactory.getInstance()

// Convenience functions for common use cases
export async function resolveEntityComponent(
  appId: string,
  entityType: string,
  operation: 'create' | 'read' | 'update' | 'list',
  organizationId: string
): Promise<ResolvedComponent> {
  return dynamicComponentFactory.resolveComponent({
    app_id: appId,
    organization_id: organizationId,
    entity_type: entityType,
    operation: operation
  })
}

export async function resolveTransactionComponent(
  appId: string,
  transactionType: string,
  operation: 'create' | 'read' | 'update' | 'list',
  organizationId: string
): Promise<ResolvedComponent> {
  return dynamicComponentFactory.resolveComponent({
    app_id: appId,
    organization_id: organizationId,
    transaction_type: transactionType,
    operation: operation
  })
}

export async function resolveScreenComponent(
  appId: string,
  screenType: string,
  organizationId: string
): Promise<ResolvedComponent> {
  return dynamicComponentFactory.resolveComponent({
    app_id: appId,
    organization_id: organizationId,
    screen_type: screenType,
    operation: 'read'
  })
}

export function registerIndustryComponents(industry: string, components: Record<string, ComponentType<any>>): void {
  Object.entries(components).forEach(([name, component]) => {
    dynamicComponentFactory.registerCustomComponent(`${industry}_${name}`, component)
  })
}

export default dynamicComponentFactory