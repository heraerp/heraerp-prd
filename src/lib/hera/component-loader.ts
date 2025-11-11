/**
 * HERA Dynamic Component Loader
 * Smart Code: HERA.PLATFORM.COMPONENT.LOADER.v1
 * 
 * Dynamically loads React components based on component_id patterns
 * Supports lazy loading and component caching
 */

import { lazy, ComponentType } from 'react'
import type { ResolvedOperation } from './navigation-resolver'

// Component registry for dynamic loading
const componentRegistry = new Map<string, () => Promise<{ default: ComponentType<any> }>>()

/**
 * Register core component patterns
 */
function registerCoreComponents() {
  // Entity List components
  componentRegistry.set('EntityList:CUSTOMER', () => 
    import('@/components/universal/EntityList').then(mod => ({ 
      default: (props: any) => mod.EntityList({ ...props, entityType: 'CUSTOMER' })
    }))
  )
  
  componentRegistry.set('EntityList:VENDOR', () => 
    import('@/components/universal/EntityList').then(mod => ({ 
      default: (props: any) => mod.EntityList({ ...props, entityType: 'VENDOR' })
    }))
  )
  
  componentRegistry.set('EntityList:JEWELRY_APPRAISAL', () => 
    import('@/components/universal/EntityList').then(mod => ({ 
      default: (props: any) => mod.EntityList({ ...props, entityType: 'JEWELRY_APPRAISAL' })
    }))
  )
  
  componentRegistry.set('EntityList:WM_ROUTE', () => 
    import('@/components/universal/EntityList').then(mod => ({ 
      default: (props: any) => mod.EntityList({ ...props, entityType: 'WM_ROUTE' })
    }))
  )
  
  // Cashew Manufacturing Entity List Components
  componentRegistry.set('EntityList:MATERIAL', () => 
    import('@/components/universal/EntityList').then(mod => ({ 
      default: (props: any) => mod.EntityList({ ...props, entityType: 'MATERIAL' })
    }))
  )
  
  componentRegistry.set('EntityList:PRODUCT', () => 
    import('@/components/universal/EntityList').then(mod => ({ 
      default: (props: any) => mod.EntityList({ ...props, entityType: 'PRODUCT' })
    }))
  )
  
  componentRegistry.set('EntityList:BATCH', () => 
    import('@/components/universal/EntityList').then(mod => ({ 
      default: (props: any) => mod.EntityList({ ...props, entityType: 'BATCH' })
    }))
  )
  
  componentRegistry.set('EntityList:WORK_CENTER', () => 
    import('@/components/universal/EntityList').then(mod => ({ 
      default: (props: any) => mod.EntityList({ ...props, entityType: 'WORK_CENTER' })
    }))
  )
  
  componentRegistry.set('EntityList:LOCATION', () => 
    import('@/components/universal/EntityList').then(mod => ({ 
      default: (props: any) => mod.EntityList({ ...props, entityType: 'LOCATION' })
    }))
  )
  
  componentRegistry.set('EntityList:BOM', () => 
    import('@/components/universal/EntityList').then(mod => ({ 
      default: (props: any) => mod.EntityList({ ...props, entityType: 'BOM' })
    }))
  )
  
  componentRegistry.set('EntityList:COST_CENTER', () => 
    import('@/components/universal/EntityList').then(mod => ({ 
      default: (props: any) => mod.EntityList({ ...props, entityType: 'COST_CENTER' })
    }))
  )
  
  componentRegistry.set('EntityList:PROFIT_CENTER', () => 
    import('@/components/universal/EntityList').then(mod => ({ 
      default: (props: any) => mod.EntityList({ ...props, entityType: 'PROFIT_CENTER' })
    }))
  )
  
  // Entity Wizard components
  componentRegistry.set('EntityWizard:CUSTOMER', () => 
    import('@/components/universal/EntityWizard').then(mod => ({ 
      default: (props: any) => mod.EntityWizard({ ...props, entityType: 'CUSTOMER' })
    }))
  )
  
  componentRegistry.set('EntityWizard:VENDOR', () => 
    import('@/components/universal/EntityWizard').then(mod => ({ 
      default: (props: any) => mod.EntityWizard({ ...props, entityType: 'VENDOR' })
    }))
  )
  
  componentRegistry.set('EntityWizard:JEWELRY_APPRAISAL', () => 
    import('@/components/universal/EntityWizard').then(mod => ({ 
      default: (props: any) => mod.EntityWizard({ ...props, entityType: 'JEWELRY_APPRAISAL' })
    }))
  )
  
  componentRegistry.set('EntityWizard:WM_ROUTE', () => 
    import('@/components/universal/EntityWizard').then(mod => ({ 
      default: (props: any) => mod.EntityWizard({ ...props, entityType: 'WM_ROUTE' })
    }))
  )
  
  // Cashew Manufacturing Entity Wizard Components
  componentRegistry.set('EntityWizard:MATERIAL', () => 
    import('@/components/universal/EntityWizard').then(mod => ({ 
      default: (props: any) => mod.EntityWizard({ ...props, entityType: 'MATERIAL' })
    }))
  )
  
  componentRegistry.set('EntityWizard:PRODUCT', () => 
    import('@/components/universal/EntityWizard').then(mod => ({ 
      default: (props: any) => mod.EntityWizard({ ...props, entityType: 'PRODUCT' })
    }))
  )
  
  componentRegistry.set('EntityWizard:BATCH', () => 
    import('@/components/universal/EntityWizard').then(mod => ({ 
      default: (props: any) => mod.EntityWizard({ ...props, entityType: 'BATCH' })
    }))
  )
  
  componentRegistry.set('EntityWizard:WORK_CENTER', () => 
    import('@/components/universal/EntityWizard').then(mod => ({ 
      default: (props: any) => mod.EntityWizard({ ...props, entityType: 'WORK_CENTER' })
    }))
  )
  
  componentRegistry.set('EntityWizard:LOCATION', () => 
    import('@/components/universal/EntityWizard').then(mod => ({ 
      default: (props: any) => mod.EntityWizard({ ...props, entityType: 'LOCATION' })
    }))
  )
  
  componentRegistry.set('EntityWizard:BOM', () => 
    import('@/components/universal/EntityWizard').then(mod => ({ 
      default: (props: any) => mod.EntityWizard({ ...props, entityType: 'BOM' })
    }))
  )
  
  componentRegistry.set('EntityWizard:COST_CENTER', () => 
    import('@/components/universal/EntityWizard').then(mod => ({ 
      default: (props: any) => mod.EntityWizard({ ...props, entityType: 'COST_CENTER' })
    }))
  )
  
  componentRegistry.set('EntityWizard:PROFIT_CENTER', () => 
    import('@/components/universal/EntityWizard').then(mod => ({ 
      default: (props: any) => mod.EntityWizard({ ...props, entityType: 'PROFIT_CENTER' })
    }))
  )
  
  // Transaction List components (using existing TransactionList with adapters)
  componentRegistry.set('TransactionList:GL_JOURNAL', () => 
    import('@/components/universal/TransactionListPage').then(mod => ({ 
      default: (props: any) => mod.TransactionListPage({ ...props, transactionType: 'GL_JOURNAL' })
    }))
  )
  
  componentRegistry.set('TransactionList:PURCHASE_ORDER', () => 
    import('@/components/universal/TransactionListPage').then(mod => ({ 
      default: (props: any) => mod.TransactionListPage({ ...props, transactionType: 'PURCHASE_ORDER' })
    }))
  )
  
  componentRegistry.set('TransactionList:SALES_ORDER', () => 
    import('@/components/universal/TransactionListPage').then(mod => ({ 
      default: (props: any) => mod.TransactionListPage({ ...props, transactionType: 'SALES_ORDER' })
    }))
  )
  
  // Cashew Manufacturing Transaction List Components
  componentRegistry.set('TransactionList:MFG_ISSUE', () => 
    import('@/components/universal/TransactionListPage').then(mod => ({ 
      default: (props: any) => mod.TransactionListPage({ ...props, transactionType: 'MFG_ISSUE' })
    }))
  )
  
  componentRegistry.set('TransactionList:MFG_LABOR', () => 
    import('@/components/universal/TransactionListPage').then(mod => ({ 
      default: (props: any) => mod.TransactionListPage({ ...props, transactionType: 'MFG_LABOR' })
    }))
  )
  
  componentRegistry.set('TransactionList:MFG_OVERHEAD', () => 
    import('@/components/universal/TransactionListPage').then(mod => ({ 
      default: (props: any) => mod.TransactionListPage({ ...props, transactionType: 'MFG_OVERHEAD' })
    }))
  )
  
  componentRegistry.set('TransactionList:MFG_RECEIPT', () => 
    import('@/components/universal/TransactionListPage').then(mod => ({ 
      default: (props: any) => mod.TransactionListPage({ ...props, transactionType: 'MFG_RECEIPT' })
    }))
  )
  
  componentRegistry.set('TransactionList:MFG_BATCHCOST', () => 
    import('@/components/universal/TransactionListPage').then(mod => ({ 
      default: (props: any) => mod.TransactionListPage({ ...props, transactionType: 'MFG_BATCHCOST' })
    }))
  )
  
  componentRegistry.set('TransactionList:MFG_QC', () => 
    import('@/components/universal/TransactionListPage').then(mod => ({ 
      default: (props: any) => mod.TransactionListPage({ ...props, transactionType: 'MFG_QC' })
    }))
  )
  
  // Transaction Wizard components
  componentRegistry.set('TransactionWizard:GL_JOURNAL', () => 
    import('@/components/universal/TransactionWizard').then(mod => ({ 
      default: (props: any) => mod.TransactionWizard({ ...props, transactionType: 'GL_JOURNAL' })
    }))
  )
  
  componentRegistry.set('TransactionWizard:PURCHASE_ORDER', () => 
    import('@/components/universal/TransactionWizard').then(mod => ({ 
      default: (props: any) => mod.TransactionWizard({ ...props, transactionType: 'PURCHASE_ORDER' })
    }))
  )
  
  componentRegistry.set('TransactionWizard:SALES_ORDER', () => 
    import('@/components/universal/TransactionWizard').then(mod => ({ 
      default: (props: any) => mod.TransactionWizard({ ...props, transactionType: 'SALES_ORDER' })
    }))
  )
  
  // Cashew Manufacturing Transaction Wizard Components
  componentRegistry.set('TransactionWizard:MFG_ISSUE', () => 
    import('@/components/universal/TransactionWizard').then(mod => ({ 
      default: (props: any) => mod.TransactionWizard({ ...props, transactionType: 'MFG_ISSUE' })
    }))
  )
  
  componentRegistry.set('TransactionWizard:MFG_LABOR', () => 
    import('@/components/universal/TransactionWizard').then(mod => ({ 
      default: (props: any) => mod.TransactionWizard({ ...props, transactionType: 'MFG_LABOR' })
    }))
  )
  
  componentRegistry.set('TransactionWizard:MFG_OVERHEAD', () => 
    import('@/components/universal/TransactionWizard').then(mod => ({ 
      default: (props: any) => mod.TransactionWizard({ ...props, transactionType: 'MFG_OVERHEAD' })
    }))
  )
  
  componentRegistry.set('TransactionWizard:MFG_RECEIPT', () => 
    import('@/components/universal/TransactionWizard').then(mod => ({ 
      default: (props: any) => mod.TransactionWizard({ ...props, transactionType: 'MFG_RECEIPT' })
    }))
  )
  
  componentRegistry.set('TransactionWizard:MFG_BATCHCOST', () => 
    import('@/components/universal/TransactionWizard').then(mod => ({ 
      default: (props: any) => mod.TransactionWizard({ ...props, transactionType: 'MFG_BATCHCOST' })
    }))
  )
  
  componentRegistry.set('TransactionWizard:MFG_QC', () => 
    import('@/components/universal/TransactionWizard').then(mod => ({ 
      default: (props: any) => mod.TransactionWizard({ ...props, transactionType: 'MFG_QC' })
    }))
  )
  
  // Fallback components
  componentRegistry.set('UniversalModulePage', () => 
    import('@/components/universal/UniversalModulePage').then(mod => ({ default: mod.default }))
  )
  
  componentRegistry.set('UniversalAreaPage', () => 
    import('@/components/universal/UniversalAreaPage').then(mod => ({ default: mod.default }))
  )
  
  componentRegistry.set('UniversalOperationPage', () => 
    import('@/components/universal/UniversalOperationPage').then(mod => ({ default: mod.default }))
  )
  
  // Page not found component
  componentRegistry.set('PageNotFound', () => 
    import('@/components/universal/PageNotFound').then(mod => ({ default: mod.default }))
  )
}

// Initialize component registry
registerCoreComponents()

/**
 * Props interface for dynamic components
 */
export interface DynamicComponentProps {
  resolvedOperation: ResolvedOperation
  orgId: string
  actorId: string
  searchParams: Record<string, string>
  // Additional props passed from the resolved operation
  [key: string]: any
}

/**
 * Load component dynamically based on component_id
 */
export async function loadComponent(
  componentId: string
): Promise<ComponentType<DynamicComponentProps> | null> {
  try {
    const loader = componentRegistry.get(componentId)
    
    if (!loader) {
      console.warn(`Component not found: ${componentId}, using fallback`)
      
      // Try to determine fallback based on component_id pattern
      if (componentId.includes('List')) {
        const fallbackLoader = componentRegistry.get('UniversalAreaPage')
        return fallbackLoader ? (await fallbackLoader()).default : null
      } else if (componentId.includes('Wizard') || componentId.includes('Create')) {
        const fallbackLoader = componentRegistry.get('UniversalOperationPage')
        return fallbackLoader ? (await fallbackLoader()).default : null
      } else {
        const fallbackLoader = componentRegistry.get('UniversalModulePage')
        return fallbackLoader ? (await fallbackLoader()).default : null
      }
    }
    
    const module = await loader()
    return module.default
  } catch (error) {
    console.error(`Error loading component ${componentId}:`, error)
    
    // Return Page Not Found component as ultimate fallback
    try {
      const fallbackLoader = componentRegistry.get('PageNotFound')
      return fallbackLoader ? (await fallbackLoader()).default : null
    } catch (fallbackError) {
      console.error('Error loading fallback component:', fallbackError)
      return null
    }
  }
}

/**
 * Create lazy component with error boundary
 */
export function createLazyComponent(componentId: string) {
  return lazy(async () => {
    const Component = await loadComponent(componentId)
    
    if (!Component) {
      throw new Error(`Failed to load component: ${componentId}`)
    }
    
    return { default: Component }
  })
}

/**
 * Register custom component
 */
export function registerComponent(
  componentId: string, 
  loader: () => Promise<{ default: ComponentType<any> }>
): void {
  componentRegistry.set(componentId, loader)
}

/**
 * Get all registered component IDs
 */
export function getRegisteredComponents(): string[] {
  return Array.from(componentRegistry.keys())
}

/**
 * Component loading statistics
 */
export function getComponentLoadingStats() {
  return {
    registeredComponents: componentRegistry.size,
    availableComponents: getRegisteredComponents()
  }
}