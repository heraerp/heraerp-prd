/**
 * HERA API v2 - Static Route Registry
 * Smart Code: HERA.API.V2.ROUTES.STATIC.v1
 * 
 * O(1) route resolution with predefined endpoints for security and performance
 * No dynamic endpoint discovery - only explicitly registered routes allowed
 */

export interface RouteDefinition {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  handler: string // Handler function name
  rpcFunction?: string // Supabase RPC function to call
  operationType: 'READ' | 'write' | 'finance' // For rate limiting
  requiredPermissions?: string[]
  description: string
  version: string
  deprecated?: boolean
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface RouteMatch {
  route: RouteDefinition
  params: Record<string, string>
  isValid: boolean
}

/**
 * Static Route Registry for HERA API v2
 */
export class StaticRouteRegistry {
  private routes: Map<string, RouteDefinition> = new Map()
  private pathPatterns: Array<{ pattern: RegExp; route: RouteDefinition }> = []

  constructor() {
    this.registerDefaultRoutes()
  }

  /**
   * Register all default HERA API v2 routes
   */
  private registerDefaultRoutes(): void {
    // Entity Management Routes (register both Supabase and standard formats)
    this.registerBothFormats({
      path: '/api-v2/entities',
      method: 'POST',
      handler: 'handleEntitiesCRUD',
      rpcFunction: 'hera_entities_crud_v1',
      operationType: 'write',
      description: 'Create, update, or delete entities',
      version: '2.0',
      securityLevel: 'HIGH'
    })

    this.registerBothFormats({
      path: '/api-v2/entities/search',
      method: 'POST',
      handler: 'handleEntitiesSearch',
      rpcFunction: 'hera_entities_search_v1',
      operationType: 'read',
      description: 'Search entities with filters',
      version: '2.0',
      securityLevel: 'MEDIUM'
    })

    this.registerBothFormats({
      path: '/api-v2/entities/:entityId',
      method: 'GET',
      handler: 'handleEntityById',
      rpcFunction: 'hera_entities_crud_v1',
      operationType: 'read',
      description: 'Get entity by ID',
      version: '2.0',
      securityLevel: 'MEDIUM'
    })

    // Transaction Management Routes (register both Supabase and standard formats)
    this.registerBothFormats({
      path: '/api-v2/transactions',
      method: 'POST',
      handler: 'handleTransactionsCRUD',
      rpcFunction: 'hera_txn_crud_v1',
      operationType: 'finance',
      description: 'Create, update, or manage transactions',
      version: '2.0',
      securityLevel: 'CRITICAL'
    })

    this.register({
      path: '/api/v2/transactions/approve',
      method: 'POST',
      handler: 'handleTransactionApproval',
      rpcFunction: 'hera_txn_approval_v1',
      operationType: 'finance',
      requiredPermissions: ['transaction_approve'],
      description: 'Approve financial transactions',
      version: '2.0',
      securityLevel: 'CRITICAL'
    })

    this.register({
      path: '/api/v2/transactions/reverse',
      method: 'POST',
      handler: 'handleTransactionReversal',
      rpcFunction: 'hera_txn_reversal_v1',
      operationType: 'finance',
      requiredPermissions: ['transaction_reverse'],
      description: 'Reverse financial transactions',
      version: '2.0',
      securityLevel: 'CRITICAL'
    })

    this.register({
      path: '/api/v2/transactions/:transactionId',
      method: 'GET',
      handler: 'handleTransactionById',
      rpcFunction: 'hera_txn_crud_v1',
      operationType: 'read',
      description: 'Get transaction by ID',
      version: '2.0',
      securityLevel: 'MEDIUM'
    })

    // Dynamic Data Routes
    this.register({
      path: '/api/v2/dynamic-data',
      method: 'POST',
      handler: 'handleDynamicData',
      rpcFunction: 'hera_dynamic_data_crud_v1',
      operationType: 'write',
      description: 'Manage entity dynamic fields',
      version: '2.0',
      securityLevel: 'HIGH'
    })

    this.register({
      path: '/api/v2/dynamic-data/batch',
      method: 'POST',
      handler: 'handleDynamicDataBatch',
      rpcFunction: 'hera_dynamic_data_batch_v1',
      operationType: 'write',
      description: 'Batch update dynamic fields',
      version: '2.0',
      securityLevel: 'HIGH'
    })

    // Relationship Management Routes
    this.register({
      path: '/api/v2/relationships',
      method: 'POST',
      handler: 'handleRelationships',
      rpcFunction: 'hera_relationships_crud_v1',
      operationType: 'write',
      description: 'Manage entity relationships',
      version: '2.0',
      securityLevel: 'HIGH'
    })

    this.register({
      path: '/api/v2/relationships/entity/:entityId',
      method: 'GET',
      handler: 'handleEntityRelationships',
      rpcFunction: 'hera_relationships_by_entity_v1',
      operationType: 'read',
      description: 'Get relationships for specific entity',
      version: '2.0',
      securityLevel: 'MEDIUM'
    })

    // Financial Operations
    this.register({
      path: '/api/v2/finance/gl-balance',
      method: 'POST',
      handler: 'handleGLBalanceCheck',
      rpcFunction: 'hera_gl_balance_check_v1',
      operationType: 'finance',
      description: 'Validate GL balance for transactions',
      version: '2.0',
      securityLevel: 'CRITICAL'
    })

    this.register({
      path: '/api/v2/finance/trial-balance',
      method: 'GET',
      handler: 'handleTrialBalance',
      rpcFunction: 'hera_trial_balance_v1',
      operationType: 'read',
      requiredPermissions: ['financial_reports'],
      description: 'Generate trial balance report',
      version: '2.0',
      securityLevel: 'HIGH'
    })

    // Organization Management
    this.register({
      path: '/api/v2/organizations/settings',
      method: 'POST',
      handler: 'handleOrganizationSettings',
      rpcFunction: 'hera_org_settings_v1',
      operationType: 'write',
      requiredPermissions: ['org_admin'],
      description: 'Update organization settings',
      version: '2.0',
      securityLevel: 'HIGH'
    })

    this.register({
      path: '/api/v2/organizations/branding',
      method: 'POST',
      handler: 'handleOrganizationBranding',
      rpcFunction: 'hera_org_branding_v1',
      operationType: 'write',
      requiredPermissions: ['org_branding'],
      description: 'Update organization branding',
      version: '2.0',
      securityLevel: 'MEDIUM'
    })

    // User Management
    this.register({
      path: '/api/v2/users/profile',
      method: 'POST',
      handler: 'handleUserProfile',
      rpcFunction: 'hera_user_profile_v1',
      operationType: 'write',
      description: 'Update user profile',
      version: '2.0',
      securityLevel: 'MEDIUM'
    })

    this.register({
      path: '/api/v2/users/permissions',
      method: 'GET',
      handler: 'handleUserPermissions',
      rpcFunction: 'hera_user_permissions_v1',
      operationType: 'read',
      description: 'Get user permissions',
      version: '2.0',
      securityLevel: 'MEDIUM'
    })

    // Batch Operations
    this.register({
      path: '/api/v2/batch/entities',
      method: 'POST',
      handler: 'handleBatchEntities',
      rpcFunction: 'hera_batch_entities_v1',
      operationType: 'write',
      description: 'Batch entity operations',
      version: '2.0',
      securityLevel: 'HIGH'
    })

    this.register({
      path: '/api/v2/batch/transactions',
      method: 'POST',
      handler: 'handleBatchTransactions',
      rpcFunction: 'hera_batch_transactions_v1',
      operationType: 'finance',
      requiredPermissions: ['batch_transactions'],
      description: 'Batch transaction operations',
      version: '2.0',
      securityLevel: 'CRITICAL'
    })

    // System Operations
    this.register({
      path: '/api/v2/system/health',
      method: 'GET',
      handler: 'handleSystemHealth',
      operationType: 'read',
      description: 'System health check',
      version: '2.0',
      securityLevel: 'LOW'
    })

    this.register({
      path: '/api/v2/system/metrics',
      method: 'GET',
      handler: 'handleSystemMetrics',
      rpcFunction: 'hera_system_metrics_v1',
      operationType: 'read',
      requiredPermissions: ['system_admin'],
      description: 'System performance metrics',
      version: '2.0',
      securityLevel: 'MEDIUM'
    })

    // Legacy Generic Command Interface (being phased out)
    this.register({
      path: '/api/v2/command',
      method: 'POST',
      handler: 'handleGenericCommand',
      operationType: 'write',
      description: 'Generic command interface (deprecated)',
      version: '2.0',
      deprecated: true,
      securityLevel: 'HIGH'
    })

    console.log(`✅ Registered ${this.routes.size} static routes`)
  }

  /**
   * Register a new route
   */
  register(route: RouteDefinition): void {
    const key = this.generateRouteKey(route.path, route.method)
    this.routes.set(key, route)

    // If route has parameters, add to pattern matching
    if (route.path.includes(':')) {
      const pattern = this.pathToRegex(route.path)
      this.pathPatterns.push({ pattern, route })
    }
  }

  /**
   * Register route in both Supabase (/api-v2/) and standard (/api/v2/) formats
   */
  private registerBothFormats(route: RouteDefinition): void {
    // Register Supabase format (with hyphens)
    this.register(route)
    
    // Register standard format (with slashes) if different
    if (route.path.startsWith('/api-v2/')) {
      const standardRoute = {
        ...route,
        path: route.path.replace('/api-v2/', '/api/v2/')
      }
      this.register(standardRoute)
    }
  }

  /**
   * Find matching route for request
   */
  match(path: string, method: string): RouteMatch {
    // First try exact match (fastest)
    const exactKey = this.generateRouteKey(path, method)
    const exactRoute = this.routes.get(exactKey)
    
    if (exactRoute) {
      return {
        route: exactRoute,
        params: {},
        isValid: !exactRoute.deprecated
      }
    }

    // Try pattern matching for parameterized routes
    for (const { pattern, route } of this.pathPatterns) {
      if (route.method !== method) continue
      
      const match = path.match(pattern)
      if (match) {
        const params = this.extractParams(route.path, path)
        return {
          route,
          params,
          isValid: !route.deprecated
        }
      }
    }

    // No route found
    return {
      route: this.createNotFoundRoute(path, method),
      params: {},
      isValid: false
    }
  }

  /**
   * Get all routes for documentation
   */
  getAllRoutes(): RouteDefinition[] {
    return Array.from(this.routes.values())
      .sort((a, b) => a.path.localeCompare(b.path))
  }

  /**
   * Get routes by security level
   */
  getRoutesBySecurityLevel(level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): RouteDefinition[] {
    return Array.from(this.routes.values())
      .filter(route => route.securityLevel === level)
  }

  /**
   * Get routes by operation type
   */
  getRoutesByOperationType(type: 'read' | 'write' | 'finance'): RouteDefinition[] {
    return Array.from(this.routes.values())
      .filter(route => route.operationType === type)
  }

  /**
   * Check if route exists
   */
  hasRoute(path: string, method: string): boolean {
    const match = this.match(path, method)
    return match.isValid
  }

  /**
   * Get route statistics
   */
  getRouteStats(): {
    totalRoutes: number
    routesByMethod: Record<string, number>
    routesByOperationType: Record<string, number>
    routesBySecurityLevel: Record<string, number>
    deprecatedRoutes: number
  } {
    const routes = this.getAllRoutes()
    
    const routesByMethod: Record<string, number> = {}
    const routesByOperationType: Record<string, number> = {}
    const routesBySecurityLevel: Record<string, number> = {}
    let deprecatedRoutes = 0

    for (const route of routes) {
      // Count by method
      routesByMethod[route.method] = (routesByMethod[route.method] || 0) + 1
      
      // Count by operation type
      routesByOperationType[route.operationType] = (routesByOperationType[route.operationType] || 0) + 1
      
      // Count by security level
      routesBySecurityLevel[route.securityLevel] = (routesBySecurityLevel[route.securityLevel] || 0) + 1
      
      // Count deprecated
      if (route.deprecated) {
        deprecatedRoutes++
      }
    }

    return {
      totalRoutes: routes.length,
      routesByMethod,
      routesByOperationType,
      routesBySecurityLevel,
      deprecatedRoutes
    }
  }

  /**
   * Utility methods
   */
  private generateRouteKey(path: string, method: string): string {
    return `${method}:${path}`
  }

  private pathToRegex(path: string): RegExp {
    // Convert /api/v2/entities/:entityId to regex
    const regexPath = path
      .replace(/\//g, '\\/')
      .replace(/:([^/]+)/g, '([^/]+)')
    
    return new RegExp(`^${regexPath}$`)
  }

  private extractParams(routePath: string, actualPath: string): Record<string, string> {
    const params: Record<string, string> = {}
    const routeParts = routePath.split('/')
    const actualParts = actualPath.split('/')

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        const paramName = routeParts[i].substring(1)
        params[paramName] = actualParts[i]
      }
    }

    return params
  }

  private createNotFoundRoute(path: string, method: string): RouteDefinition {
    return {
      path: 'NOT_FOUND',
      method: method as any,
      handler: 'handleNotFound',
      operationType: 'read',
      description: `Route not found: ${method} ${path}`,
      version: '2.0',
      securityLevel: 'LOW'
    }
  }

  /**
   * Test route registry functionality
   */
  testRouteRegistry(): { success: boolean; results: any[] } {
    const results = []
    let allSuccess = true

    try {
      // Test 1: Exact Route Matching
      const exactMatch = this.match('/api/v2/entities', 'POST')
      const exactMatchSuccess = exactMatch.isValid && exactMatch.route.handler === 'handleEntitiesCRUD'
      
      results.push({
        test: 'Exact Route Matching',
        success: exactMatchSuccess,
        details: exactMatchSuccess ? 'Exact match working correctly' : 'Exact match failed'
      })
      allSuccess = allSuccess && exactMatchSuccess

      // Test 2: Parameterized Route Matching
      const paramMatch = this.match('/api/v2/entities/123-456-789', 'GET')
      const paramMatchSuccess = paramMatch.isValid && 
                               paramMatch.route.handler === 'handleEntityById' &&
                               paramMatch.params.entityId === '123-456-789'
      
      results.push({
        test: 'Parameterized Route Matching',
        success: paramMatchSuccess,
        details: paramMatchSuccess ? 
          `Params extracted: ${JSON.stringify(paramMatch.params)}` : 
          'Parameter extraction failed'
      })
      allSuccess = allSuccess && paramMatchSuccess

      // Test 3: Route Not Found
      const notFoundMatch = this.match('/api/v2/invalid-endpoint', 'GET')
      const notFoundSuccess = !notFoundMatch.isValid && notFoundMatch.route.path === 'NOT_FOUND'
      
      results.push({
        test: 'Route Not Found Handling',
        success: notFoundSuccess,
        details: notFoundSuccess ? 'Not found correctly handled' : 'Not found handling failed'
      })
      allSuccess = allSuccess && notFoundSuccess

      // Test 4: Security Level Classification
      const criticalRoutes = this.getRoutesBySecurityLevel('CRITICAL')
      const securitySuccess = criticalRoutes.length > 0 && 
                             criticalRoutes.some(r => r.path.includes('/transactions'))
      
      results.push({
        test: 'Security Level Classification',
        success: securitySuccess,
        details: securitySuccess ? 
          `${criticalRoutes.length} critical routes identified` : 
          'Security classification failed'
      })
      allSuccess = allSuccess && securitySuccess

      // Test 5: Route Statistics
      const stats = this.getRouteStats()
      const statsSuccess = stats.totalRoutes > 20 && 
                          stats.routesByOperationType.finance > 0 &&
                          stats.routesBySecurityLevel.CRITICAL > 0
      
      results.push({
        test: 'Route Statistics',
        success: statsSuccess,
        details: statsSuccess ? 
          `Total: ${stats.totalRoutes}, Finance: ${stats.routesByOperationType.finance}` : 
          'Statistics generation failed'
      })
      allSuccess = allSuccess && statsSuccess

      // Test 6: Operation Type Classification
      const financeRoutes = this.getRoutesByOperationType('finance')
      const operationSuccess = financeRoutes.length > 0 && 
                              financeRoutes.every(r => r.operationType === 'finance')
      
      results.push({
        test: 'Operation Type Classification',
        success: operationSuccess,
        details: operationSuccess ? 
          `${financeRoutes.length} finance routes classified` : 
          'Operation classification failed'
      })
      allSuccess = allSuccess && operationSuccess

    } catch (error) {
      results.push({
        test: 'System Test',
        success: false,
        details: `Error: ${(error as Error).message}`
      })
      allSuccess = false
    }

    return { success: allSuccess, results }
  }
}

/**
 * Singleton instance for Edge Function usage
 */
export const routeRegistry = new StaticRouteRegistry()

/**
 * Helper function for Edge Function integration
 */
export function resolveRoute(url: URL, method: string): {
  match: RouteMatch
  isValid: boolean
  route?: RouteDefinition
  params?: Record<string, string>
} {
  const match = routeRegistry.match(url.pathname, method)
  
  return {
    match,
    isValid: match.isValid,
    route: match.isValid ? match.route : undefined,
    params: match.params
  }
}

/**
 * Helper function to generate API documentation
 */
export function generateAPIDocumentation(): {
  routes: RouteDefinition[]
  summary: any
  securityLevels: Record<string, RouteDefinition[]>
} {
  const routes = routeRegistry.getAllRoutes()
  const summary = routeRegistry.getRouteStats()
  
  const securityLevels: Record<string, RouteDefinition[]> = {
    LOW: routeRegistry.getRoutesBySecurityLevel('LOW'),
    MEDIUM: routeRegistry.getRoutesBySecurityLevel('MEDIUM'),
    HIGH: routeRegistry.getRoutesBySecurityLevel('HIGH'),
    CRITICAL: routeRegistry.getRoutesBySecurityLevel('CRITICAL')
  }

  return {
    routes,
    summary,
    securityLevels
  }
}

/**
 * Helper function to validate route security
 */
export function validateRouteSecurity(
  route: RouteDefinition,
  userPermissions: string[] = []
): { allowed: boolean; reason?: string } {
  // Check if route requires specific permissions
  if (route.requiredPermissions && route.requiredPermissions.length > 0) {
    const hasPermission = route.requiredPermissions.some(perm => 
      userPermissions.includes(perm)
    )
    
    if (!hasPermission) {
      return {
        allowed: false,
        reason: `Missing required permissions: ${route.requiredPermissions.join(', ')}`
      }
    }
  }

  // Check for deprecated routes
  if (route.deprecated) {
    return {
      allowed: true, // Allow but warn
      reason: 'Route is deprecated and may be removed in future versions'
    }
  }

  return { allowed: true }
}