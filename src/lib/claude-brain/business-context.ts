/**
 * Claude Brain - Business Context Intelligence System
 * Provides deep business understanding for AI-powered operations
 * 
 * Integrates with Master CRUD v2 for real-time business insights
 */

import {
  BusinessContext,
  BusinessIntelligenceEngine,
  BusinessInsight,
  ContextLearningEngine,
  ConversationTurn,
  IndustryContext,
  UserPreferences
} from '@/types/claude-brain.types'
import { masterCrudV2Client } from '@/lib/master-crud-v2'
import { MasterCrudEntityResult } from '@/types/master-crud-v2.types'

/**
 * Business Context Manager
 * Maintains and updates business context for AI operations
 */
export class BusinessContextManager {
  private contextCache = new Map<string, BusinessContext>()
  private cacheExpiry = new Map<string, number>()
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes

  /**
   * Get comprehensive business context for organization
   */
  async getBusinessContext(organizationId: string, userId?: string): Promise<BusinessContext> {
    // Check cache first
    const cached = this.getCachedContext(organizationId)
    if (cached) return cached

    // Build fresh context
    const context = await this.buildBusinessContext(organizationId, userId)
    
    // Cache the result
    this.setCachedContext(organizationId, context)
    
    return context
  }

  /**
   * Update business context with new information
   */
  async updateBusinessContext(
    organizationId: string, 
    updates: Partial<BusinessContext>
  ): Promise<BusinessContext> {
    const currentContext = await this.getBusinessContext(organizationId)
    const updatedContext = { ...currentContext, ...updates }
    
    // Update cache
    this.setCachedContext(organizationId, updatedContext)
    
    // Persist important updates
    await this.persistContextUpdates(organizationId, updates)
    
    return updatedContext
  }

  /**
   * Learn from user interactions to improve context
   */
  async learnFromInteraction(
    organizationId: string,
    interaction: ConversationTurn
  ): Promise<void> {
    const context = await this.getBusinessContext(organizationId)
    
    // Extract business patterns from interaction
    const patterns = this.extractBusinessPatterns(interaction)
    
    // Update context with learned patterns
    const updates = this.generateContextUpdates(patterns, context)
    
    if (Object.keys(updates).length > 0) {
      await this.updateBusinessContext(organizationId, updates)
    }
  }

  /**
   * Generate industry-specific context
   */
  async generateIndustryContext(organizationId: string): Promise<IndustryContext> {
    const entities = await masterCrudV2Client.findEntities(organizationId, 'all', {
      includeDynamicData: true,
      limit: 100
    })

    const industry = await this.detectIndustry(entities)
    
    return {
      industryType: industry,
      commonEntities: this.getCommonEntities(industry),
      businessProcesses: this.getBusinessProcesses(industry),
      keyMetrics: this.getKeyMetrics(industry),
      regulatoryRequirements: this.getRegulatoryRequirements(industry),
      seasonality: this.getSeasonalityPatterns(industry)
    }
  }

  // Private helper methods
  private getCachedContext(organizationId: string): BusinessContext | null {
    const expiry = this.cacheExpiry.get(organizationId)
    if (!expiry || Date.now() > expiry) {
      this.contextCache.delete(organizationId)
      this.cacheExpiry.delete(organizationId)
      return null
    }
    
    return this.contextCache.get(organizationId) || null
  }

  private setCachedContext(organizationId: string, context: BusinessContext): void {
    this.contextCache.set(organizationId, context)
    this.cacheExpiry.set(organizationId, Date.now() + this.CACHE_TTL)
  }

  private async buildBusinessContext(organizationId: string, userId?: string): Promise<BusinessContext> {
    // Get basic organization info
    const orgEntities = await masterCrudV2Client.findEntities(organizationId, 'organization', {
      includeDynamicData: true,
      limit: 1
    })

    const orgEntity = orgEntities[0]
    const orgData = this.extractDynamicDataValues(orgEntity?.dynamicData || [])

    // Get user info if provided
    let currentUser = {
      id: userId || 'anonymous',
      role: 'user',
      permissions: ['read'],
      department: 'general'
    }

    if (userId) {
      const userEntities = await masterCrudV2Client.findEntities(organizationId, 'employee', {
        includeDynamicData: true,
        limit: 1
      })
      
      const userEntity = userEntities.find(e => e.entity.id === userId)
      if (userEntity) {
        const userData = this.extractDynamicDataValues(userEntity.dynamicData || [])
        currentUser = {
          id: userId,
          role: userData.role || 'user',
          permissions: userData.permissions?.split(',') || ['read'],
          department: userData.department || 'general'
        }
      }
    }

    // Analyze recent activity
    const recentActivity = await this.analyzeRecentActivity(organizationId)

    // Detect industry and business model
    const industry = await this.detectIndustryFromData(organizationId)
    const businessModel = await this.detectBusinessModel(organizationId)

    return {
      organizationId,
      industry,
      businessModel,
      currentUser,
      recentActivity,
      preferences: {
        timezone: orgData.timezone || 'UTC',
        currency: orgData.currency || 'USD',
        units: orgData.units || 'metric',
        reportingPeriod: orgData.reportingPeriod || 'monthly'
      }
    }
  }

  private async analyzeRecentActivity(organizationId: string): Promise<any> {
    // Get recent entities created/updated
    const recentEntities = await masterCrudV2Client.queryEntityComplete({
      organizationId,
      includeDynamicData: false,
      includeRelationships: false,
      limit: 50,
      orderBy: 'updated_at',
      orderDirection: 'desc'
    })

    // Analyze entity types and operations
    const entityTypes = new Map<string, number>()
    const operations: string[] = []

    for (const entity of recentEntities.entities) {
      const type = entity.entity.entity_type
      entityTypes.set(type, (entityTypes.get(type) || 0) + 1)
      operations.push(`modified_${type}`)
    }

    return {
      operations: operations.slice(0, 20),
      entities: Array.from(entityTypes.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([type]) => type),
      timeframe: 'last_7_days'
    }
  }

  private async detectIndustryFromData(organizationId: string): Promise<string> {
    const entities = await masterCrudV2Client.findEntities(organizationId, 'all', {
      includeDynamicData: true,
      limit: 100
    })

    return this.detectIndustry(entities)
  }

  private detectIndustry(entities: MasterCrudEntityResult[]): string {
    const industryKeywords = {
      retail: ['product', 'inventory', 'pos', 'sale', 'customer', 'store'],
      manufacturing: ['production', 'bom', 'material', 'assembly', 'quality'],
      healthcare: ['patient', 'appointment', 'medical', 'treatment', 'diagnosis'],
      finance: ['account', 'transaction', 'payment', 'portfolio', 'investment'],
      services: ['client', 'project', 'service', 'consultation', 'billing'],
      restaurant: ['menu', 'order', 'table', 'reservation', 'food'],
      salon: ['appointment', 'service', 'client', 'stylist', 'treatment'],
      real_estate: ['property', 'listing', 'client', 'commission', 'lease']
    }

    const scores = new Map<string, number>()

    // Analyze entity types and field names
    for (const entity of entities) {
      const entityType = entity.entity.entity_type.toLowerCase()
      const fieldNames = entity.dynamicData?.map(d => d.field_name.toLowerCase()) || []
      
      for (const [industry, keywords] of Object.entries(industryKeywords)) {
        let score = 0
        
        // Score based on entity type
        if (keywords.some(keyword => entityType.includes(keyword))) {
          score += 3
        }
        
        // Score based on field names
        for (const fieldName of fieldNames) {
          if (keywords.some(keyword => fieldName.includes(keyword))) {
            score += 1
          }
        }
        
        scores.set(industry, (scores.get(industry) || 0) + score)
      }
    }

    // Return industry with highest score
    const sortedScores = Array.from(scores.entries()).sort(([,a], [,b]) => b - a)
    return sortedScores[0]?.[0] || 'general'
  }

  private async detectBusinessModel(organizationId: string): Promise<string> {
    const entities = await masterCrudV2Client.findEntities(organizationId, 'all', {
      includeDynamicData: false,
      limit: 50
    })

    const entityTypes = entities.map(e => e.entity.entity_type.toLowerCase())
    
    // Business model detection patterns
    if (entityTypes.includes('customer') && entityTypes.includes('order') && entityTypes.includes('product')) {
      return 'b2c_ecommerce'
    }
    
    if (entityTypes.includes('account') && entityTypes.includes('opportunity') && entityTypes.includes('lead')) {
      return 'b2b_sales'
    }
    
    if (entityTypes.includes('client') && entityTypes.includes('project') && entityTypes.includes('service')) {
      return 'service_provider'
    }
    
    if (entityTypes.includes('appointment') && entityTypes.includes('client') && entityTypes.includes('service')) {
      return 'appointment_based'
    }
    
    return 'general_business'
  }

  private extractDynamicDataValues(dynamicData: any[]): Record<string, any> {
    const values: Record<string, any> = {}
    
    for (const field of dynamicData) {
      const value = field.field_value_text || 
                   field.field_value_number || 
                   field.field_value_boolean || 
                   field.field_value_date || 
                   field.field_value_json
      
      if (value !== null && value !== undefined) {
        values[field.field_name] = value
      }
    }
    
    return values
  }

  private extractBusinessPatterns(interaction: ConversationTurn): Record<string, any> {
    const patterns: Record<string, any> = {}
    
    // Extract entity types mentioned
    const entityTypes = this.extractEntityTypes(interaction.userMessage)
    if (entityTypes.length > 0) {
      patterns.preferredEntityTypes = entityTypes
    }
    
    // Extract operation patterns
    const operations = this.extractOperationTypes(interaction.userMessage)
    if (operations.length > 0) {
      patterns.commonOperations = operations
    }
    
    // Extract business terminology
    const businessTerms = this.extractBusinessTerms(interaction.userMessage)
    if (businessTerms.length > 0) {
      patterns.businessVocabulary = businessTerms
    }
    
    return patterns
  }

  private extractEntityTypes(message: string): string[] {
    const entityPatterns = {
      customer: /customer|client|buyer/i,
      product: /product|item|inventory/i,
      order: /order|sale|purchase/i,
      employee: /employee|staff|user/i,
      lead: /lead|prospect|opportunity/i
    }
    
    const found: string[] = []
    for (const [entityType, pattern] of Object.entries(entityPatterns)) {
      if (pattern.test(message)) {
        found.push(entityType)
      }
    }
    
    return found
  }

  private extractOperationTypes(message: string): string[] {
    const operationPatterns = {
      create: /create|add|new/i,
      update: /update|change|modify/i,
      query: /find|search|show|list/i,
      analyze: /analyze|report|summary/i
    }
    
    const found: string[] = []
    for (const [operation, pattern] of Object.entries(operationPatterns)) {
      if (pattern.test(message)) {
        found.push(operation)
      }
    }
    
    return found
  }

  private extractBusinessTerms(message: string): string[] {
    const businessTerms = [
      'revenue', 'profit', 'sales', 'marketing', 'inventory', 'supply chain',
      'customer service', 'quality', 'production', 'logistics', 'compliance'
    ]
    
    const found: string[] = []
    const lowerMessage = message.toLowerCase()
    
    for (const term of businessTerms) {
      if (lowerMessage.includes(term)) {
        found.push(term)
      }
    }
    
    return found
  }

  private generateContextUpdates(patterns: Record<string, any>, currentContext: BusinessContext): Partial<BusinessContext> {
    const updates: Partial<BusinessContext> = {}
    
    // Update recent activity patterns
    if (patterns.preferredEntityTypes) {
      updates.recentActivity = {
        ...currentContext.recentActivity,
        entities: [...new Set([
          ...patterns.preferredEntityTypes,
          ...currentContext.recentActivity.entities
        ])].slice(0, 10)
      }
    }
    
    return updates
  }

  private async persistContextUpdates(organizationId: string, updates: Partial<BusinessContext>): Promise<void> {
    // In a real implementation, this would persist to database
    // For now, we'll just log the updates
    console.log(`[Business Context] Updated context for org ${organizationId}:`, updates)
  }

  private getCommonEntities(industry: string): string[] {
    const industryEntities = {
      retail: ['customer', 'product', 'order', 'inventory', 'supplier', 'store'],
      manufacturing: ['product', 'material', 'production_order', 'quality_check', 'supplier', 'equipment'],
      healthcare: ['patient', 'appointment', 'provider', 'treatment', 'diagnosis', 'insurance'],
      finance: ['account', 'transaction', 'client', 'portfolio', 'investment', 'risk_assessment'],
      services: ['client', 'project', 'service', 'contract', 'invoice', 'resource'],
      restaurant: ['customer', 'order', 'menu_item', 'table', 'reservation', 'ingredient'],
      salon: ['client', 'appointment', 'service', 'stylist', 'treatment', 'product']
    }
    
    return industryEntities[industry] || ['customer', 'product', 'order', 'employee', 'vendor']
  }

  private getBusinessProcesses(industry: string): string[] {
    const industryProcesses = {
      retail: ['order_management', 'inventory_control', 'customer_service', 'point_of_sale'],
      manufacturing: ['production_planning', 'quality_control', 'supply_chain_management', 'maintenance'],
      healthcare: ['patient_scheduling', 'treatment_planning', 'billing', 'compliance'],
      finance: ['client_onboarding', 'risk_assessment', 'portfolio_management', 'reporting'],
      services: ['project_management', 'client_relationship', 'resource_allocation', 'billing'],
      restaurant: ['order_taking', 'kitchen_management', 'table_service', 'inventory_management'],
      salon: ['appointment_booking', 'service_delivery', 'client_management', 'inventory_tracking']
    }
    
    return industryProcesses[industry] || ['customer_management', 'order_processing', 'reporting']
  }

  private getKeyMetrics(industry: string): string[] {
    const industryMetrics = {
      retail: ['sales_revenue', 'inventory_turnover', 'customer_satisfaction', 'profit_margin'],
      manufacturing: ['production_efficiency', 'quality_rate', 'equipment_utilization', 'on_time_delivery'],
      healthcare: ['patient_satisfaction', 'treatment_outcomes', 'appointment_no_shows', 'billing_accuracy'],
      finance: ['portfolio_performance', 'client_retention', 'risk_metrics', 'compliance_score'],
      services: ['project_profitability', 'client_satisfaction', 'resource_utilization', 'delivery_time'],
      restaurant: ['table_turnover', 'food_cost_percentage', 'customer_satisfaction', 'revenue_per_seat'],
      salon: ['appointment_utilization', 'service_revenue', 'client_retention', 'product_sales']
    }
    
    return industryMetrics[industry] || ['revenue', 'customer_satisfaction', 'operational_efficiency']
  }

  private getRegulatoryRequirements(industry: string): string[] {
    const industryRegulations = {
      retail: ['consumer_protection', 'data_privacy', 'tax_compliance'],
      manufacturing: ['safety_standards', 'environmental_compliance', 'quality_certifications'],
      healthcare: ['hipaa_compliance', 'medical_licensing', 'patient_safety'],
      finance: ['securities_regulation', 'anti_money_laundering', 'data_protection'],
      services: ['professional_licensing', 'contract_compliance', 'tax_obligations'],
      restaurant: ['food_safety', 'health_department', 'liquor_licensing'],
      salon: ['health_department', 'professional_licensing', 'safety_standards']
    }
    
    return industryRegulations[industry] || ['general_business_compliance', 'tax_obligations']
  }

  private getSeasonalityPatterns(industry: string): Record<string, any> {
    const seasonalPatterns = {
      retail: {
        q4: 'holiday_season_peak',
        summer: 'outdoor_products_peak',
        back_to_school: 'education_supplies_peak'
      },
      restaurant: {
        summer: 'outdoor_dining_peak',
        holidays: 'special_events_peak',
        winter: 'comfort_food_season'
      },
      salon: {
        spring: 'wedding_season',
        summer: 'vacation_prep',
        holidays: 'special_events'
      }
    }
    
    return seasonalPatterns[industry] || {}
  }
}

/**
 * Business Intelligence Engine Implementation
 */
export class HeraBIEngine implements BusinessIntelligenceEngine {
  private contextManager = new BusinessContextManager()

  async generateInsights(context: BusinessContext, data: any[]): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = []
    
    // Generate trend insights
    insights.push(...await this.analyzeTrends(data, context))
    
    // Generate performance insights
    insights.push(...await this.analyzePerformance(data, context))
    
    // Generate opportunity insights
    insights.push(...await this.identifyOpportunities(data, context))
    
    return insights.filter(insight => insight.confidence >= 0.7)
  }

  async detectAnomalies(data: any[], timeframe: string): Promise<BusinessInsight[]> {
    const anomalies: BusinessInsight[] = []
    
    // Simple anomaly detection (would use more sophisticated algorithms in production)
    if (data.length < 10) return anomalies
    
    const values = data.map(d => d.value || 0)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length)
    
    for (let i = 0; i < data.length; i++) {
      const value = values[i]
      const zScore = Math.abs((value - mean) / stdDev)
      
      if (zScore > 2) { // Anomaly threshold
        anomalies.push({
          type: 'anomaly',
          title: `Unusual ${data[i].metric || 'value'} detected`,
          description: `Value ${value} is ${zScore.toFixed(1)} standard deviations from normal`,
          data: data[i],
          confidence: Math.min(zScore / 3, 1),
          impact: zScore > 3 ? 'high' : 'medium',
          timeframe,
          actionable: true,
          suggestedActions: ['investigate_cause', 'verify_data', 'take_corrective_action']
        })
      }
    }
    
    return anomalies
  }

  async predictTrends(data: any[], horizon: string): Promise<BusinessInsight[]> {
    const trends: BusinessInsight[] = []
    
    if (data.length < 5) return trends
    
    // Simple linear regression for trend prediction
    const values = data.map(d => d.value || 0)
    const slope = this.calculateSlope(values)
    const direction = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'
    
    if (Math.abs(slope) > 0.1) {
      trends.push({
        type: 'trend',
        title: `${direction.charAt(0).toUpperCase() + direction.slice(1)} trend detected`,
        description: `Data shows ${direction} trend with slope ${slope.toFixed(2)}`,
        data: { slope, direction, horizon },
        confidence: Math.min(Math.abs(slope) * 2, 1),
        impact: Math.abs(slope) > 0.5 ? 'high' : 'medium',
        timeframe: horizon,
        actionable: true,
        suggestedActions: direction === 'decreasing' ? ['investigate_decline', 'implement_improvements'] : ['maintain_momentum', 'scale_operations']
      })
    }
    
    return trends
  }

  async suggestOptimizations(context: BusinessContext): Promise<BusinessInsight[]> {
    const optimizations: BusinessInsight[] = []
    
    // Industry-specific optimization suggestions
    switch (context.industry) {
      case 'retail':
        optimizations.push(...this.getRetailOptimizations(context))
        break
      case 'manufacturing':
        optimizations.push(...this.getManufacturingOptimizations(context))
        break
      case 'services':
        optimizations.push(...this.getServicesOptimizations(context))
        break
      default:
        optimizations.push(...this.getGeneralOptimizations(context))
    }
    
    return optimizations
  }

  async analyzePerformance(metrics: any, targets: any): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = []
    
    for (const [metric, actual] of Object.entries(metrics)) {
      const target = targets[metric]
      if (target) {
        const performance = (actual as number) / target
        const variance = ((actual as number) - target) / target
        
        insights.push({
          type: performance >= 1 ? 'opportunity' : 'risk',
          title: `${metric} performance: ${(performance * 100).toFixed(1)}% of target`,
          description: `Actual: ${actual}, Target: ${target}, Variance: ${(variance * 100).toFixed(1)}%`,
          data: { metric, actual, target, performance, variance },
          confidence: 0.9,
          impact: Math.abs(variance) > 0.2 ? 'high' : Math.abs(variance) > 0.1 ? 'medium' : 'low',
          timeframe: 'current',
          actionable: true,
          suggestedActions: performance >= 1 ? ['maintain_performance', 'scale_success'] : ['improve_process', 'allocate_resources']
        })
      }
    }
    
    return insights
  }

  // Private helper methods
  private async analyzeTrends(data: any[], context: BusinessContext): Promise<BusinessInsight[]> {
    // Implementation would analyze historical data for trends
    return []
  }

  private async analyzePerformance(data: any[], context: BusinessContext): Promise<BusinessInsight[]> {
    // Implementation would analyze performance metrics
    return []
  }

  private async identifyOpportunities(data: any[], context: BusinessContext): Promise<BusinessInsight[]> {
    // Implementation would identify business opportunities
    return []
  }

  private calculateSlope(values: number[]): number {
    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0)
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  }

  private getRetailOptimizations(context: BusinessContext): BusinessInsight[] {
    return [
      {
        type: 'recommendation',
        title: 'Optimize inventory turnover',
        description: 'Implement dynamic pricing and demand forecasting to improve inventory efficiency',
        data: { category: 'inventory_management' },
        confidence: 0.8,
        impact: 'medium',
        timeframe: '30_days',
        actionable: true,
        suggestedActions: ['implement_dynamic_pricing', 'setup_demand_forecasting', 'optimize_reorder_points']
      }
    ]
  }

  private getManufacturingOptimizations(context: BusinessContext): BusinessInsight[] {
    return [
      {
        type: 'recommendation',
        title: 'Implement predictive maintenance',
        description: 'Reduce equipment downtime through predictive maintenance scheduling',
        data: { category: 'equipment_optimization' },
        confidence: 0.8,
        impact: 'high',
        timeframe: '60_days',
        actionable: true,
        suggestedActions: ['setup_equipment_monitoring', 'implement_maintenance_scheduling', 'train_maintenance_team']
      }
    ]
  }

  private getServicesOptimizations(context: BusinessContext): BusinessInsight[] {
    return [
      {
        type: 'recommendation',
        title: 'Optimize resource allocation',
        description: 'Improve project profitability through better resource allocation and scheduling',
        data: { category: 'resource_management' },
        confidence: 0.7,
        impact: 'medium',
        timeframe: '45_days',
        actionable: true,
        suggestedActions: ['implement_resource_planning', 'optimize_project_scheduling', 'improve_capacity_management']
      }
    ]
  }

  private getGeneralOptimizations(context: BusinessContext): BusinessInsight[] {
    return [
      {
        type: 'recommendation',
        title: 'Improve customer segmentation',
        description: 'Enhance customer targeting through better segmentation and personalization',
        data: { category: 'customer_management' },
        confidence: 0.7,
        impact: 'medium',
        timeframe: '30_days',
        actionable: true,
        suggestedActions: ['analyze_customer_data', 'create_customer_segments', 'personalize_communications']
      }
    ]
  }
}

// Export singleton instances
export const businessContextManager = new BusinessContextManager()
export const heraBIEngine = new HeraBIEngine()