/**
 * Universal Report Engine
 * Smart Code: HERA.DNA.URP.ENGINE.v1
 *
 * Main orchestrator for Universal Report Pattern
 */

import {
  EntityResolver,
  HierarchyBuilder,
  TransactionFacts,
  DynamicJoin,
  RollupBalance,
  PresentationFormatter,
  type URPContext
} from './primitives/urp-primitives'
import { reportRecipes, type ReportRecipe } from './recipes'
import { cacheManager } from './cache/cache-manager'

export interface ReportEngineConfig extends URPContext {
  enableMaterializedViews?: boolean
  enableCaching?: boolean
  cacheTTL?: number
}

export interface ReportExecutionOptions {
  recipe: string
  parameters?: Record<string, any>
  format?: 'json' | 'table' | 'excel' | 'pdf' | 'csv'
  locale?: string
  currency?: string
  useCache?: boolean
  refreshCache?: boolean
}

export class UniversalReportEngine {
  public readonly entityResolver: EntityResolver
  public readonly hierarchyBuilder: HierarchyBuilder
  public readonly transactionFacts: TransactionFacts
  public readonly dynamicJoin: DynamicJoin
  public readonly rollupBalance: RollupBalance
  public readonly presentationFormatter: PresentationFormatter

  private recipes: Map<string, ReportRecipe>

  constructor(private config: ReportEngineConfig) {
    // Initialize primitives
    this.entityResolver = new EntityResolver(config)
    this.hierarchyBuilder = new HierarchyBuilder(config)
    this.transactionFacts = new TransactionFacts(config)
    this.dynamicJoin = new DynamicJoin(config)
    this.rollupBalance = new RollupBalance(config)
    this.presentationFormatter = new PresentationFormatter(config)

    // Load recipes
    this.recipes = new Map(reportRecipes)
  }

  /**
   * Execute a complete report recipe
   */
  async executeRecipe(
    recipeName: string,
    parameters: Record<string, any> = {},
    options: Partial<ReportExecutionOptions> = {}
  ): Promise<any> {
    const recipe = this.recipes.get(recipeName)
    if (!recipe) {
      throw new Error(`Recipe not found: ${recipeName}`)
    }

    // Check cache if enabled
    if (this.config.enableCaching && options.useCache !== false && !options.refreshCache) {
      const cached = await cacheManager.get(this.config.organizationId, recipeName, parameters)

      if (cached) {
        return this.formatOutput(cached, options)
      }
    }

    // Execute recipe steps
    let data: any = null

    for (const step of recipe.steps) {
      switch (step.primitive) {
        case 'entityResolver':
          data = await this.entityResolver.resolve({
            ...step.config,
            ...this.applyParameterOverrides(step.config, parameters)
          })
          break

        case 'hierarchyBuilder':
          data = await this.hierarchyBuilder.build({
            entities: data || [],
            ...step.config,
            ...this.applyParameterOverrides(step.config, parameters)
          })
          break

        case 'transactionFacts':
          data = await this.transactionFacts.aggregate({
            ...step.config,
            ...this.applyParameterOverrides(step.config, parameters)
          })
          break

        case 'dynamicJoin':
          data = await this.dynamicJoin.join({
            ...step.config,
            ...this.applyParameterOverrides(step.config, parameters)
          })
          break

        case 'rollupBalance':
          data = this.rollupBalance.calculate({
            transactions: data || [],
            ...step.config,
            ...this.applyParameterOverrides(step.config, parameters)
          })
          break

        case 'custom':
          if (step.handler) {
            data = await step.handler(data, this, parameters)
          }
          break
      }

      // Store intermediate results if named
      if (step.outputKey) {
        parameters[step.outputKey] = data
      }
    }

    // Cache result if enabled
    if (this.config.enableCaching && options.useCache !== false) {
      await cacheManager.set(
        this.config.organizationId,
        recipeName,
        parameters,
        data,
        this.config.cacheTTL || recipe.cacheTTL
      )
    }

    return this.formatOutput(data, options)
  }

  /**
   * Register a custom report recipe
   */
  registerRecipe(recipe: ReportRecipe): void {
    this.recipes.set(recipe.name, recipe)
  }

  /**
   * Get available recipes
   */
  getAvailableRecipes(): ReportRecipe[] {
    return Array.from(this.recipes.values())
  }

  /**
   * Clear cache for a specific report or all reports
   */
  async clearCache(recipeName?: string): Promise<void> {
    if (recipeName) {
      await cacheManager.clear(this.config.organizationId, recipeName)
    } else {
      await cacheManager.clearAll(this.config.organizationId)
    }
  }

  /**
   * Apply parameter overrides to step configuration
   */
  private applyParameterOverrides(
    config: Record<string, any>,
    parameters: Record<string, any>
  ): Record<string, any> {
    const overrides: Record<string, any> = {}

    for (const [key, value] of Object.entries(config)) {
      // Replace parameter placeholders
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const paramName = value.slice(2, -2).trim()
        if (parameters[paramName] !== undefined) {
          overrides[key] = parameters[paramName]
        }
      }
    }

    return overrides
  }

  /**
   * Format output based on requested format
   */
  private formatOutput(data: any, options: Partial<ReportExecutionOptions>): any {
    if (!options.format || options.format === 'json') {
      return data
    }

    return this.presentationFormatter.format({
      data,
      format: options.format,
      locale: options.locale,
      currency: options.currency
    })
  }

  /**
   * Create a materialized view for a recipe (if database supports it)
   */
  async createMaterializedView(
    recipeName: string,
    viewName: string,
    refreshInterval?: string
  ): Promise<void> {
    if (!this.config.enableMaterializedViews) {
      throw new Error('Materialized views are not enabled')
    }

    const recipe = this.recipes.get(recipeName)
    if (!recipe) {
      throw new Error(`Recipe not found: ${recipeName}`)
    }

    // This would create actual database views
    // For now, we'll store the configuration
    await cacheManager.set(
      this.config.organizationId,
      `view_${viewName}`,
      { recipeName, refreshInterval },
      null,
      -1 // Never expire
    )
  }

  /**
   * Refresh a materialized view
   */
  async refreshMaterializedView(viewName: string): Promise<void> {
    const viewConfig = await cacheManager.get(this.config.organizationId, `view_${viewName}`, {})

    if (!viewConfig) {
      throw new Error(`Materialized view not found: ${viewName}`)
    }

    // Execute the recipe and cache with view name
    const data = await this.executeRecipe(viewConfig.recipeName, {}, { refreshCache: true })

    await cacheManager.set(
      this.config.organizationId,
      `view_data_${viewName}`,
      {},
      data,
      -1 // Never expire
    )
  }

  /**
   * Query a materialized view
   */
  async queryMaterializedView(viewName: string): Promise<any> {
    const data = await cacheManager.get(this.config.organizationId, `view_data_${viewName}`, {})

    if (!data) {
      throw new Error(
        `Materialized view data not found: ${viewName}. Run refreshMaterializedView first.`
      )
    }

    return data
  }
}
