/**
 * Claude Brain - AI-Powered Operation Suggestions Engine
 * Intelligently suggests business actions based on context and user intent
 * 
 * Integrates with Master CRUD v2 and business context for smart recommendations
 */

import {
  BusinessAction,
  BusinessContext,
  BusinessInsight,
  SuggestedOperation,
  MasterCrudEntityResult,
  ActionType,
  ImpactLevel
} from '@/types/claude-brain.types'
import {
  CreateEntityCompleteRequest,
  UpdateEntityCompleteRequest,
  DeleteEntityCompleteRequest,
  QueryEntityCompleteRequest
} from '@/types/master-crud-v2.types'
import { businessContextManager, heraBIEngine } from './business-context'
import { masterCrudV2Client } from '@/lib/master-crud-v2'

/**
 * Action Pattern Recognition
 * Identifies common business patterns and suggests appropriate actions
 */
const ACTION_PATTERNS = {
  // Customer lifecycle patterns
  new_customer: {
    triggers: ['customer_created', 'first_interaction'],
    suggestions: [
      'send_welcome_email',
      'schedule_onboarding_call',
      'create_customer_profile',
      'assign_account_manager'
    ]
  },
  
  inactive_customer: {
    triggers: ['no_activity_30_days', 'last_purchase_60_days'],
    suggestions: [
      'send_re_engagement_email',
      'offer_special_discount',
      'schedule_check_in_call',
      'analyze_customer_feedback'
    ]
  },
  
  // Sales opportunity patterns
  high_value_lead: {
    triggers: ['lead_score_high', 'company_size_large', 'budget_confirmed'],
    suggestions: [
      'assign_senior_rep',
      'schedule_demo',
      'prepare_custom_proposal',
      'involve_sales_manager'
    ]
  },
  
  stalled_opportunity: {
    triggers: ['no_progress_14_days', 'last_contact_7_days'],
    suggestions: [
      'send_follow_up_email',
      'provide_additional_resources',
      'schedule_stakeholder_meeting',
      'offer_limited_time_incentive'
    ]
  },
  
  // Inventory management patterns
  low_inventory: {
    triggers: ['stock_below_threshold', 'high_demand_product'],
    suggestions: [
      'create_purchase_order',
      'notify_procurement_team',
      'adjust_safety_stock',
      'contact_preferred_supplier'
    ]
  },
  
  slow_moving_inventory: {
    triggers: ['no_sales_30_days', 'high_carrying_cost'],
    suggestions: [
      'create_promotional_campaign',
      'offer_bundle_discount',
      'liquidate_excess_stock',
      'analyze_demand_patterns'
    ]
  }
}

/**
 * Business Intelligence Triggers
 * Conditions that trigger automatic action suggestions
 */
const BI_TRIGGERS = {
  performance_decline: {
    condition: 'metric_below_threshold',
    threshold: 0.8, // 80% of target
    actions: ['investigate_root_cause', 'implement_improvement_plan', 'allocate_additional_resources']
  },
  
  performance_improvement: {
    condition: 'metric_above_threshold',
    threshold: 1.1, // 110% of target
    actions: ['document_best_practices', 'scale_successful_initiatives', 'share_learnings']
  },
  
  anomaly_detected: {
    condition: 'statistical_anomaly',
    threshold: 2.0, // 2 standard deviations
    actions: ['verify_data_accuracy', 'investigate_anomaly', 'implement_corrective_measures']
  }
}

/**
 * AI-Powered Suggestions Engine
 */
export class AISuggestionsEngine {
  private readonly confidenceThreshold = 0.7
  private readonly maxSuggestions = 10

  /**
   * Generate smart action suggestions based on business context and data
   */
  async generateActionSuggestions(
    context: BusinessContext,
    entities: MasterCrudEntityResult[],
    currentOperation?: string
  ): Promise<BusinessAction[]> {
    const suggestions: BusinessAction[] = []
    
    // Pattern-based suggestions
    suggestions.push(...await this.generatePatternBasedSuggestions(context, entities))
    
    // Context-aware suggestions
    suggestions.push(...await this.generateContextAwareSuggestions(context, currentOperation))
    
    // Business intelligence driven suggestions
    suggestions.push(...await this.generateBISuggestions(context, entities))
    
    // Industry-specific suggestions
    suggestions.push(...await this.generateIndustrySpecificSuggestions(context, entities))
    
    // Filter and rank suggestions
    return this.rankAndFilterSuggestions(suggestions, context)
  }

  /**
   * Suggest follow-up actions for completed operations
   */
  async suggestFollowUpActions(
    operation: string,
    result: any,
    context: BusinessContext
  ): Promise<BusinessAction[]> {
    const followUps: BusinessAction[] = []
    
    switch (operation) {
      case 'createEntityComplete':
        followUps.push(...this.getEntityCreationFollowUps(result, context))
        break
        
      case 'updateEntityComplete':
        followUps.push(...this.getEntityUpdateFollowUps(result, context))
        break
        
      case 'queryEntityComplete':
        followUps.push(...this.getQueryFollowUps(result, context))
        break
    }
    
    return this.rankAndFilterSuggestions(followUps, context)
  }

  /**
   * Suggest optimizations for business processes
   */
  async suggestProcessOptimizations(
    context: BusinessContext,
    performanceData: any[]
  ): Promise<BusinessAction[]> {
    const optimizations: BusinessAction[] = []
    
    // Analyze performance data for optimization opportunities
    const insights = await heraBIEngine.generateInsights(context, performanceData)
    
    for (const insight of insights) {
      if (insight.type === 'recommendation' || insight.type === 'opportunity') {
        optimizations.push(this.convertInsightToAction(insight, context))
      }
    }
    
    // Add industry-specific optimizations
    optimizations.push(...this.getIndustryOptimizations(context))
    
    return this.rankAndFilterSuggestions(optimizations, context)
  }

  /**
   * Suggest preventive actions based on risk analysis
   */
  async suggestPreventiveActions(
    context: BusinessContext,
    riskFactors: any[]
  ): Promise<BusinessAction[]> {
    const preventiveActions: BusinessAction[] = []
    
    for (const risk of riskFactors) {
      const actions = this.generateRiskMitigationActions(risk, context)
      preventiveActions.push(...actions)
    }
    
    return this.rankAndFilterSuggestions(preventiveActions, context)
  }

  // Private helper methods
  private async generatePatternBasedSuggestions(
    context: BusinessContext,
    entities: MasterCrudEntityResult[]
  ): Promise<BusinessAction[]> {
    const suggestions: BusinessAction[] = []
    
    for (const entity of entities.slice(0, 20)) { // Limit analysis for performance
      const patterns = this.identifyEntityPatterns(entity, context)
      
      for (const pattern of patterns) {
        const patternActions = ACTION_PATTERNS[pattern]
        if (patternActions) {
          for (const suggestion of patternActions.suggestions) {
            suggestions.push(this.createActionFromPattern(suggestion, entity, context))
          }
        }
      }
    }
    
    return suggestions
  }

  private async generateContextAwareSuggestions(
    context: BusinessContext,
    currentOperation?: string
  ): Promise<BusinessAction[]> {
    const suggestions: BusinessAction[] = []
    
    // Suggest related operations based on current context
    if (currentOperation) {
      suggestions.push(...this.getRelatedOperations(currentOperation, context))
    }
    
    // Suggest workflow continuations
    suggestions.push(...this.getWorkflowSuggestions(context))
    
    // Suggest data quality improvements
    suggestions.push(...this.getDataQualitySuggestions(context))
    
    return suggestions
  }

  private async generateBISuggestions(
    context: BusinessContext,
    entities: MasterCrudEntityResult[]
  ): Promise<BusinessAction[]> {
    const suggestions: BusinessAction[] = []
    
    // Analyze recent activity for patterns
    const recentActivity = context.recentActivity
    
    // Suggest missing data points
    if (recentActivity.entities.includes('customer') && !recentActivity.entities.includes('order')) {
      suggestions.push({
        id: 'suggest_create_order',
        type: 'create',
        title: 'Create Order for Customer',
        description: 'You have customer data but no recent orders. Consider creating orders for active customers.',
        operation: {
          type: 'master_crud',
          operation: 'createEntityComplete',
          parameters: {
            entityType: 'order',
            entityName: 'New Order',
            smartCode: 'HERA.CRM.ORDER.TRANSACTION.B2B.V1'
          }
        },
        estimation: {
          timeMs: 80,
          impact: 'medium',
          reversible: true
        }
      })
    }
    
    // Suggest analytics based on data volume
    if (entities.length > 50) {
      suggestions.push({
        id: 'suggest_analytics',
        type: 'analyze',
        title: 'Generate Business Analytics',
        description: 'You have sufficient data volume. Generate insights to identify trends and opportunities.',
        operation: {
          type: 'analytics',
          operation: 'generateBusinessAnalytics'
        },
        estimation: {
          timeMs: 200,
          impact: 'high',
          reversible: true
        }
      })
    }
    
    return suggestions
  }

  private async generateIndustrySpecificSuggestions(
    context: BusinessContext,
    entities: MasterCrudEntityResult[]
  ): Promise<BusinessAction[]> {
    switch (context.industry) {
      case 'retail':
        return this.getRetailSuggestions(entities, context)
      case 'manufacturing':
        return this.getManufacturingSuggestions(entities, context)
      case 'services':
        return this.getServicesSuggestions(entities, context)
      case 'salon':
        return this.getSalonSuggestions(entities, context)
      default:
        return this.getGeneralBusinessSuggestions(entities, context)
    }
  }

  private identifyEntityPatterns(entity: MasterCrudEntityResult, context: BusinessContext): string[] {
    const patterns: string[] = []
    const entityType = entity.entity.entity_type
    const dynamicData = this.extractDynamicDataValues(entity.dynamicData || [])
    
    // Customer patterns
    if (entityType === 'customer') {
      const createdAt = new Date(entity.entity.created_at)
      const daysSinceCreated = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceCreated <= 1) {
        patterns.push('new_customer')
      } else if (daysSinceCreated > 30) {
        patterns.push('inactive_customer')
      }
    }
    
    // Lead patterns
    if (entityType === 'lead') {
      const leadScore = dynamicData.lead_score || dynamicData.score || 0
      if (leadScore > 80) {
        patterns.push('high_value_lead')
      }
    }
    
    // Product patterns
    if (entityType === 'product') {
      const stock = dynamicData.inventory_count || dynamicData.stock || 0
      if (stock < 10) {
        patterns.push('low_inventory')
      }
    }
    
    return patterns
  }

  private createActionFromPattern(
    suggestion: string,
    entity: MasterCrudEntityResult,
    context: BusinessContext
  ): BusinessAction {
    const actionMap = {
      send_welcome_email: {
        type: 'notify' as ActionType,
        title: 'Send Welcome Email',
        description: `Send welcome email to ${entity.entity.entity_name}`,
        impact: 'low' as ImpactLevel
      },
      schedule_onboarding_call: {
        type: 'create' as ActionType,
        title: 'Schedule Onboarding Call',
        description: `Schedule onboarding call with ${entity.entity.entity_name}`,
        impact: 'medium' as ImpactLevel
      },
      create_purchase_order: {
        type: 'create' as ActionType,
        title: 'Create Purchase Order',
        description: `Create purchase order for ${entity.entity.entity_name}`,
        impact: 'high' as ImpactLevel
      }
    }
    
    const actionConfig = actionMap[suggestion] || {
      type: 'query' as ActionType,
      title: suggestion.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Suggested action: ${suggestion}`,
      impact: 'medium' as ImpactLevel
    }
    
    return {
      id: `${suggestion}_${entity.entity.id}`,
      type: actionConfig.type,
      title: actionConfig.title,
      description: actionConfig.description,
      estimation: {
        timeMs: 100,
        impact: actionConfig.impact,
        reversible: true
      }
    }
  }

  private getEntityCreationFollowUps(result: any, context: BusinessContext): BusinessAction[] {
    const followUps: BusinessAction[] = []
    const entityType = result.entity?.entity_type
    
    if (entityType === 'customer') {
      followUps.push({
        id: 'customer_followup_1',
        type: 'create',
        title: 'Create Customer Contact',
        description: 'Add contact information for the new customer',
        estimation: { timeMs: 80, impact: 'medium', reversible: true }
      })
      
      followUps.push({
        id: 'customer_followup_2',
        type: 'create',
        title: 'Schedule Follow-up',
        description: 'Schedule follow-up appointment or call',
        estimation: { timeMs: 60, impact: 'low', reversible: true }
      })
    }
    
    return followUps
  }

  private getEntityUpdateFollowUps(result: any, context: BusinessContext): BusinessAction[] {
    const followUps: BusinessAction[] = []
    
    followUps.push({
      id: 'update_followup_1',
      type: 'notify',
      title: 'Notify Stakeholders',
      description: 'Notify relevant team members about the update',
      estimation: { timeMs: 30, impact: 'low', reversible: false }
    })
    
    return followUps
  }

  private getQueryFollowUps(result: any, context: BusinessContext): BusinessAction[] {
    const followUps: BusinessAction[] = []
    const entityCount = result.entities?.length || 0
    
    if (entityCount > 0) {
      followUps.push({
        id: 'query_followup_1',
        type: 'analyze',
        title: 'Analyze Results',
        description: `Analyze the ${entityCount} entities found`,
        estimation: { timeMs: 150, impact: 'medium', reversible: true }
      })
    }
    
    if (entityCount > 10) {
      followUps.push({
        id: 'query_followup_2',
        type: 'export',
        title: 'Export to Spreadsheet',
        description: 'Export results to spreadsheet for further analysis',
        estimation: { timeMs: 80, impact: 'low', reversible: true }
      })
    }
    
    return followUps
  }

  private getRelatedOperations(operation: string, context: BusinessContext): BusinessAction[] {
    const related: BusinessAction[] = []
    
    const operationRelations = {
      'create_customer': ['create_contact', 'create_opportunity', 'schedule_meeting'],
      'create_product': ['update_inventory', 'create_pricing', 'assign_category'],
      'create_order': ['send_confirmation', 'update_inventory', 'schedule_delivery']
    }
    
    const relatedOps = operationRelations[operation] || []
    
    for (const relatedOp of relatedOps) {
      related.push({
        id: `related_${relatedOp}`,
        type: relatedOp.startsWith('create') ? 'create' : 'update',
        title: relatedOp.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Related operation: ${relatedOp}`,
        estimation: { timeMs: 80, impact: 'medium', reversible: true }
      })
    }
    
    return related
  }

  private getWorkflowSuggestions(context: BusinessContext): BusinessAction[] {
    const suggestions: BusinessAction[] = []
    
    // Suggest common workflow steps based on industry
    switch (context.industry) {
      case 'retail':
        suggestions.push({
          id: 'retail_workflow_1',
          type: 'create',
          title: 'Update Product Catalog',
          description: 'Keep product catalog updated with latest items',
          estimation: { timeMs: 120, impact: 'medium', reversible: true }
        })
        break
        
      case 'services':
        suggestions.push({
          id: 'services_workflow_1',
          type: 'create',
          title: 'Create Project Template',
          description: 'Create reusable project templates for efficiency',
          estimation: { timeMs: 200, impact: 'high', reversible: true }
        })
        break
    }
    
    return suggestions
  }

  private getDataQualitySuggestions(context: BusinessContext): BusinessAction[] {
    return [
      {
        id: 'data_quality_1',
        type: 'update',
        title: 'Review Data Completeness',
        description: 'Review and complete missing data fields',
        estimation: { timeMs: 180, impact: 'medium', reversible: true }
      },
      {
        id: 'data_quality_2',
        type: 'analyze',
        title: 'Identify Duplicate Records',
        description: 'Find and merge duplicate customer records',
        estimation: { timeMs: 300, impact: 'high', reversible: false }
      }
    ]
  }

  private getRetailSuggestions(entities: MasterCrudEntityResult[], context: BusinessContext): BusinessAction[] {
    return [
      {
        id: 'retail_1',
        type: 'analyze',
        title: 'Analyze Sales Trends',
        description: 'Identify top-selling products and seasonal patterns',
        estimation: { timeMs: 200, impact: 'high', reversible: true }
      },
      {
        id: 'retail_2',
        type: 'update',
        title: 'Optimize Inventory Levels',
        description: 'Adjust inventory levels based on demand patterns',
        estimation: { timeMs: 150, impact: 'medium', reversible: true }
      }
    ]
  }

  private getManufacturingSuggestions(entities: MasterCrudEntityResult[], context: BusinessContext): BusinessAction[] {
    return [
      {
        id: 'manufacturing_1',
        type: 'analyze',
        title: 'Production Efficiency Analysis',
        description: 'Analyze production efficiency and identify bottlenecks',
        estimation: { timeMs: 250, impact: 'high', reversible: true }
      }
    ]
  }

  private getServicesSuggestions(entities: MasterCrudEntityResult[], context: BusinessContext): BusinessAction[] {
    return [
      {
        id: 'services_1',
        type: 'analyze',
        title: 'Client Satisfaction Analysis',
        description: 'Analyze client feedback and satisfaction scores',
        estimation: { timeMs: 180, impact: 'high', reversible: true }
      }
    ]
  }

  private getSalonSuggestions(entities: MasterCrudEntityResult[], context: BusinessContext): BusinessAction[] {
    return [
      {
        id: 'salon_1',
        type: 'analyze',
        title: 'Appointment Utilization',
        description: 'Analyze appointment booking patterns and utilization',
        estimation: { timeMs: 160, impact: 'medium', reversible: true }
      }
    ]
  }

  private getGeneralBusinessSuggestions(entities: MasterCrudEntityResult[], context: BusinessContext): BusinessAction[] {
    return [
      {
        id: 'general_1',
        type: 'analyze',
        title: 'Customer Analysis',
        description: 'Analyze customer behavior and preferences',
        estimation: { timeMs: 200, impact: 'medium', reversible: true }
      }
    ]
  }

  private convertInsightToAction(insight: BusinessInsight, context: BusinessContext): BusinessAction {
    return {
      id: `insight_action_${Date.now()}`,
      type: 'analyze',
      title: insight.title,
      description: insight.description,
      estimation: {
        timeMs: 150,
        impact: insight.impact,
        reversible: true
      }
    }
  }

  private getIndustryOptimizations(context: BusinessContext): BusinessAction[] {
    // Return industry-specific optimization suggestions
    return []
  }

  private generateRiskMitigationActions(risk: any, context: BusinessContext): BusinessAction[] {
    return [
      {
        id: `risk_mitigation_${risk.id}`,
        type: 'update',
        title: `Mitigate ${risk.type} Risk`,
        description: `Take action to mitigate identified ${risk.type} risk`,
        estimation: { timeMs: 200, impact: 'high', reversible: true }
      }
    ]
  }

  private rankAndFilterSuggestions(suggestions: BusinessAction[], context: BusinessContext): BusinessAction[] {
    // Score suggestions based on relevance, impact, and context
    const scoredSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      score: this.calculateActionScore(suggestion, context)
    }))
    
    // Filter by confidence threshold and limit results
    return scoredSuggestions
      .filter(s => s.score >= this.confidenceThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxSuggestions)
      .map(({ score, ...suggestion }) => suggestion)
  }

  private calculateActionScore(action: BusinessAction, context: BusinessContext): number {
    let score = 0.5 // Base score
    
    // Boost score based on impact
    switch (action.estimation.impact) {
      case 'high': score += 0.3; break
      case 'medium': score += 0.2; break
      case 'low': score += 0.1; break
    }
    
    // Boost score for quick actions
    if (action.estimation.timeMs < 100) {
      score += 0.1
    }
    
    // Boost score for reversible actions
    if (action.estimation.reversible) {
      score += 0.1
    }
    
    return Math.min(score, 1.0)
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
}

// Export singleton instance
export const aiSuggestionsEngine = new AISuggestionsEngine()