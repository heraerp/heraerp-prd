import { universalApi } from '@/lib/universal-api'
import { createLeadScoringEngine, LeadScore } from '@/lib/email/lead-scoring-engine'

/**
 * HERA CRM Lead Conversion Pipeline
 * Intelligent lead management system with automated conversion workflows
 * 
 * Features:
 * - Automated lead qualification and scoring
 * - Multi-stage conversion pipeline management
 * - AI-powered lead nurturing recommendations
 * - Integration with email marketing campaigns
 * - CRM opportunity and contact creation
 * - Revenue attribution and conversion tracking
 */

export interface LeadPipelineStage {
  stage_id: string
  stage_name: string
  stage_order: number
  conversion_rate: number
  average_time_in_stage: number // days
  required_actions: string[]
  automation_rules: {
    auto_qualify_threshold: number
    auto_move_conditions: string[]
    nurturing_sequence?: string
    follow_up_tasks: string[]
  }
}

export interface CRMOpportunity {
  id: string
  lead_id: string
  opportunity_name: string
  stage: string
  probability: number
  estimated_value: number
  expected_close_date: string
  lead_source: 'email_campaign' | 'inbound' | 'referral' | 'cold_outreach'
  sales_rep_id?: string
  next_follow_up: string
  notes: string[]
  conversion_metrics: {
    days_in_pipeline: number
    email_opens: number
    email_clicks: number
    website_visits: number
    content_downloads: number
  }
}

export interface ConversionMetrics {
  total_leads: number
  qualified_leads: number
  opportunities_created: number
  deals_won: number
  conversion_rate: number
  average_deal_size: number
  sales_cycle_days: number
  revenue_attributed: number
  pipeline_velocity: number
}

export class LeadConversionPipeline {
  private organizationId: string
  private leadScoringEngine: any
  
  // Default pipeline stages - can be customized per organization
  private defaultPipelineStages: LeadPipelineStage[] = [
    {
      stage_id: 'lead',
      stage_name: 'New Lead',
      stage_order: 1,
      conversion_rate: 0.45, // 45% of leads get qualified
      average_time_in_stage: 2,
      required_actions: ['lead_scoring', 'initial_qualification'],
      automation_rules: {
        auto_qualify_threshold: 60, // Lead score of 60+ auto-qualifies
        auto_move_conditions: ['lead_score >= 60', 'engagement_level = high'],
        nurturing_sequence: 'new_lead_nurture_sequence',
        follow_up_tasks: ['send_welcome_email', 'schedule_qualification_call']
      }
    },
    {
      stage_id: 'qualified',
      stage_name: 'Qualified Lead',
      stage_order: 2,
      conversion_rate: 0.65, // 65% of qualified leads become opportunities
      average_time_in_stage: 5,
      required_actions: ['needs_assessment', 'budget_qualification'],
      automation_rules: {
        auto_qualify_threshold: 75,
        auto_move_conditions: ['needs_identified', 'budget_confirmed'],
        nurturing_sequence: 'qualified_lead_nurture_sequence',
        follow_up_tasks: ['discovery_call', 'send_product_info']
      }
    },
    {
      stage_id: 'opportunity',
      stage_name: 'Sales Opportunity',
      stage_order: 3,
      conversion_rate: 0.35, // 35% of opportunities close as deals
      average_time_in_stage: 14,
      required_actions: ['proposal_sent', 'demo_completed'],
      automation_rules: {
        auto_qualify_threshold: 85,
        auto_move_conditions: ['proposal_accepted', 'contract_negotiation'],
        follow_up_tasks: ['schedule_demo', 'prepare_proposal', 'send_case_studies']
      }
    },
    {
      stage_id: 'negotiation',
      stage_name: 'Negotiation',
      stage_order: 4,
      conversion_rate: 0.70, // 70% of negotiations close successfully
      average_time_in_stage: 7,
      required_actions: ['contract_review', 'pricing_approved'],
      automation_rules: {
        auto_qualify_threshold: 90,
        auto_move_conditions: ['contract_signed'],
        follow_up_tasks: ['legal_review', 'stakeholder_approval', 'final_demo']
      }
    },
    {
      stage_id: 'closed_won',
      stage_name: 'Closed Won',
      stage_order: 5,
      conversion_rate: 1.0,
      average_time_in_stage: 0,
      required_actions: ['deal_closed', 'customer_onboarded'],
      automation_rules: {
        auto_qualify_threshold: 100,
        auto_move_conditions: [],
        follow_up_tasks: ['send_welcome_kit', 'schedule_onboarding', 'create_customer_record']
      }
    }
  ]

  constructor(organizationId: string) {
    this.organizationId = organizationId
    this.leadScoringEngine = createLeadScoringEngine(organizationId)
    universalApi.setOrganizationId(organizationId)
  }

  /**
   * Process new lead from email engagement
   */
  async processEmailLead(
    email: string, 
    campaignId: string, 
    engagementType: string
  ): Promise<{ leadId: string; currentStage: string }> {
    try {
      // Check if lead already exists
      const existingLeads = await universalApi.getEntities('lead', {
        filters: { email }
      })

      let leadId: string
      let isNewLead = false

      if (existingLeads.length === 0) {
        // Create new lead
        isNewLead = true
        const leadEntity = await universalApi.createEntity({
          organization_id: this.organizationId,
          entity_type: 'lead',
          entity_name: `Lead - ${email}`,
          entity_code: `LEAD-${Date.now()}`,
          status: 'new',
          metadata: {
            lead_source: 'email_campaign',
            source_campaign_id: campaignId,
            initial_engagement: engagementType,
            created_from_email: true
          }
        })

        leadId = leadEntity.id

        // Store lead contact information
        await universalApi.setDynamicField(leadId, 'email', email)
        await universalApi.setDynamicField(leadId, 'lead_source', 'email_campaign')
        await universalApi.setDynamicField(leadId, 'source_campaign_id', campaignId)
        await universalApi.setDynamicField(leadId, 'pipeline_stage', 'lead')
        
      } else {
        leadId = existingLeads[0].id
      }

      // Calculate lead score
      const leadScore = await this.leadScoringEngine.calculateLeadScore(email)
      
      // Update lead scoring
      await universalApi.setDynamicField(leadId, 'lead_score', String(leadScore.total_score))
      await universalApi.setDynamicField(leadId, 'lead_grade', leadScore.lead_grade)
      await universalApi.setDynamicField(leadId, 'qualification_status', leadScore.qualification_status)

      // Determine current pipeline stage
      const currentStage = await this.getCurrentPipelineStage(leadId)
      
      // Check if lead should be automatically moved to next stage
      await this.processStageAutomation(leadId, currentStage, leadScore)
      
      // Create lead processing transaction
      await universalApi.createTransaction({
        organization_id: this.organizationId,
        transaction_type: 'lead_processing',
        transaction_code: `LEAD-PROC-${Date.now()}`,
        transaction_date: new Date().toISOString().split('T')[0],
        reference_number: email,
        total_amount: leadScore.total_score,
        status: 'completed',
        description: `Lead processed from ${engagementType} engagement`,
        metadata: {
          lead_id: leadId,
          email,
          campaign_id: campaignId,
          engagement_type: engagementType,
          lead_score: leadScore.total_score,
          lead_grade: leadScore.lead_grade,
          is_new_lead: isNewLead,
          current_stage: currentStage,
          recommended_action: leadScore.recommended_action
        }
      })

      return { leadId, currentStage }

    } catch (error) {
      console.error('Error processing email lead:', error)
      throw error
    }
  }

  /**
   * Move lead to next pipeline stage
   */
  async moveLeadToStage(leadId: string, targetStage: string, reason?: string): Promise<void> {
    try {
      const currentStage = await this.getCurrentPipelineStage(leadId)
      const targetStageInfo = this.defaultPipelineStages.find(s => s.stage_id === targetStage)
      
      if (!targetStageInfo) {
        throw new Error(`Invalid pipeline stage: ${targetStage}`)
      }

      // Update lead stage
      await universalApi.setDynamicField(leadId, 'pipeline_stage', targetStage)
      await universalApi.setDynamicField(leadId, 'stage_moved_at', new Date().toISOString())
      
      if (reason) {
        await universalApi.setDynamicField(leadId, 'stage_move_reason', reason)
      }

      // Create stage movement transaction
      await universalApi.createTransaction({
        organization_id: this.organizationId,
        transaction_type: 'pipeline_stage_change',
        transaction_code: `STAGE-${Date.now()}`,
        transaction_date: new Date().toISOString().split('T')[0],
        reference_number: leadId,
        total_amount: targetStageInfo.stage_order,
        status: 'completed',
        description: `Lead moved from ${currentStage} to ${targetStage}`,
        metadata: {
          lead_id: leadId,
          from_stage: currentStage,
          to_stage: targetStage,
          reason: reason || 'manual_move',
          stage_order: targetStageInfo.stage_order,
          expected_conversion_rate: targetStageInfo.conversion_rate
        }
      })

      // Execute stage automation rules
      await this.executeStageActions(leadId, targetStageInfo)

      // If moved to opportunity stage, create CRM opportunity
      if (targetStage === 'opportunity') {
        await this.createCRMOpportunity(leadId)
      }

      // If moved to closed won, process deal closure
      if (targetStage === 'closed_won') {
        await this.processClosedWon(leadId)
      }

    } catch (error) {
      console.error('Error moving lead to stage:', error)
      throw error
    }
  }

  /**
   * Create CRM opportunity from qualified lead
   */
  async createCRMOpportunity(leadId: string): Promise<string> {
    try {
      // Get lead data
      const leadEntity = await universalApi.getEntity(leadId)
      const leadDynamicData = await universalApi.getDynamicData(leadId)

      // Create opportunity entity
      const opportunityEntity = await universalApi.createEntity({
        organization_id: this.organizationId,
        entity_type: 'opportunity',
        entity_name: `Opportunity - ${leadDynamicData.email || 'Unknown'}`,
        entity_code: `OPP-${Date.now()}`,
        status: 'open',
        metadata: {
          lead_id: leadId,
          source_lead: leadDynamicData.email,
          lead_source: leadDynamicData.lead_source || 'email_campaign',
          source_campaign_id: leadDynamicData.source_campaign_id
        }
      })

      const opportunityId = opportunityEntity.id

      // Set opportunity details
      const estimatedValue = await this.estimateOpportunityValue(leadId)
      const probability = this.calculateCloseProbability(leadDynamicData)
      
      await universalApi.setDynamicField(opportunityId, 'estimated_value', String(estimatedValue))
      await universalApi.setDynamicField(opportunityId, 'close_probability', String(probability))
      await universalApi.setDynamicField(opportunityId, 'pipeline_stage', 'opportunity')
      await universalApi.setDynamicField(opportunityId, 'lead_score', leadDynamicData.lead_score || '0')
      await universalApi.setDynamicField(opportunityId, 'source_email', leadDynamicData.email || '')
      
      // Set expected close date (average sales cycle + current date)
      const expectedCloseDate = new Date()
      expectedCloseDate.setDate(expectedCloseDate.getDate() + 30) // 30-day default sales cycle
      await universalApi.setDynamicField(opportunityId, 'expected_close_date', expectedCloseDate.toISOString())

      // Link opportunity back to lead
      await universalApi.setDynamicField(leadId, 'opportunity_id', opportunityId)

      // Create opportunity creation transaction
      await universalApi.createTransaction({
        organization_id: this.organizationId,
        transaction_type: 'opportunity_created',
        transaction_code: `OPP-CREATE-${Date.now()}`,
        transaction_date: new Date().toISOString().split('T')[0],
        reference_number: opportunityId,
        total_amount: estimatedValue,
        status: 'completed',
        description: `Opportunity created from lead conversion`,
        metadata: {
          opportunity_id: opportunityId,
          lead_id: leadId,
          estimated_value: estimatedValue,
          close_probability: probability,
          lead_source: leadDynamicData.lead_source,
          source_campaign_id: leadDynamicData.source_campaign_id
        }
      })

      console.log(`🎯 CRM Opportunity created: ${opportunityId} (Value: $${estimatedValue})`)
      return opportunityId

    } catch (error) {
      console.error('Error creating CRM opportunity:', error)
      throw error
    }
  }

  /**
   * Get pipeline conversion metrics
   */
  async getConversionMetrics(timeframe: 'month' | 'quarter' | 'year' = 'month'): Promise<ConversionMetrics> {
    try {
      const startDate = this.getTimeframeStartDate(timeframe)
      
      // Get all leads in timeframe
      const leads = await universalApi.getTransactions({
        filters: {
          transaction_type: 'lead_processing',
          transaction_date: `>=${startDate}`
        },
        limit: 10000
      })

      // Get all opportunities in timeframe
      const opportunities = await universalApi.getTransactions({
        filters: {
          transaction_type: 'opportunity_created',
          transaction_date: `>=${startDate}`
        },
        limit: 10000
      })

      // Get all deals closed in timeframe
      const closedDeals = await universalApi.getTransactions({
        filters: {
          transaction_type: 'deal_closed',
          transaction_date: `>=${startDate}`
        },
        limit: 10000
      })

      const totalLeads = leads.length
      const qualifiedLeads = leads.filter(l => 
        parseInt(l.metadata?.lead_score || '0') >= 60
      ).length
      
      const opportunitiesCreated = opportunities.length
      const dealsWon = closedDeals.length
      
      const totalRevenue = closedDeals.reduce((sum, deal) => 
        sum + (deal.total_amount || 0), 0
      )
      
      const avgDealSize = dealsWon > 0 ? totalRevenue / dealsWon : 0
      const conversionRate = totalLeads > 0 ? (dealsWon / totalLeads) * 100 : 0

      // Calculate average sales cycle
      const avgSalesCycle = await this.calculateAverageSalesCycle(timeframe)
      
      // Calculate pipeline velocity (deals per time period)
      const pipelineVelocity = this.calculatePipelineVelocity(dealsWon, timeframe)

      return {
        total_leads: totalLeads,
        qualified_leads: qualifiedLeads,
        opportunities_created: opportunitiesCreated,
        deals_won: dealsWon,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        average_deal_size: Math.round(avgDealSize),
        sales_cycle_days: avgSalesCycle,
        revenue_attributed: Math.round(totalRevenue),
        pipeline_velocity: Math.round(pipelineVelocity * 100) / 100
      }

    } catch (error) {
      console.error('Error getting conversion metrics:', error)
      throw error
    }
  }

  /**
   * Get leads by pipeline stage
   */
  async getLeadsByStage(): Promise<Record<string, any[]>> {
    try {
      const leadsByStage: Record<string, any[]> = {}
      
      for (const stage of this.defaultPipelineStages) {
        const stageLeads = await universalApi.getEntities('lead', {
          filters: { pipeline_stage: stage.stage_id }
        })
        
        // Enrich leads with dynamic data
        const enrichedLeads = await Promise.all(
          stageLeads.map(async (lead) => {
            const dynamicData = await universalApi.getDynamicData(lead.id)
            return {
              ...lead,
              ...dynamicData,
              stage_info: stage
            }
          })
        )
        
        leadsByStage[stage.stage_id] = enrichedLeads
      }
      
      return leadsByStage

    } catch (error) {
      console.error('Error getting leads by stage:', error)
      throw error
    }
  }

  // Private helper methods

  private async getCurrentPipelineStage(leadId: string): Promise<string> {
    const currentStage = await universalApi.getDynamicField(leadId, 'pipeline_stage')
    return currentStage || 'lead' // Default to first stage
  }

  private async processStageAutomation(
    leadId: string, 
    currentStage: string, 
    leadScore: LeadScore
  ): Promise<void> {
    const stageInfo = this.defaultPipelineStages.find(s => s.stage_id === currentStage)
    if (!stageInfo) return

    // Check if lead qualifies for auto-advancement
    const autoQualifyThreshold = stageInfo.automation_rules.auto_qualify_threshold
    
    if (leadScore.total_score >= autoQualifyThreshold) {
      const nextStageIndex = stageInfo.stage_order
      const nextStage = this.defaultPipelineStages.find(s => s.stage_order === nextStageIndex + 1)
      
      if (nextStage) {
        await this.moveLeadToStage(
          leadId, 
          nextStage.stage_id, 
          `Auto-qualified with score ${leadScore.total_score}`
        )
      }
    }
  }

  private async executeStageActions(leadId: string, stageInfo: LeadPipelineStage): Promise<void> {
    // Execute follow-up tasks based on stage automation rules
    for (const task of stageInfo.automation_rules.follow_up_tasks) {
      await this.createFollowUpTask(leadId, task, stageInfo.stage_id)
    }

    // Trigger nurturing sequence if configured
    if (stageInfo.automation_rules.nurturing_sequence) {
      await this.triggerNurturingSequence(leadId, stageInfo.automation_rules.nurturing_sequence)
    }
  }

  private async createFollowUpTask(leadId: string, task: string, stage: string): Promise<void> {
    await universalApi.createEntity({
      organization_id: this.organizationId,
      entity_type: 'task',
      entity_name: `${task} - Lead ${leadId}`,
      entity_code: `TASK-${Date.now()}`,
      status: 'pending',
      metadata: {
        lead_id: leadId,
        task_type: task,
        pipeline_stage: stage,
        auto_generated: true,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Due tomorrow
      }
    })
  }

  private async triggerNurturingSequence(leadId: string, sequenceName: string): Promise<void> {
    // This would integrate with email campaign system to trigger nurturing emails
    console.log(`Triggering nurturing sequence "${sequenceName}" for lead ${leadId}`)
    
    // Create nurturing campaign trigger
    await universalApi.createTransaction({
      organization_id: this.organizationId,
      transaction_type: 'nurturing_sequence_triggered',
      transaction_code: `NURTURE-${Date.now()}`,
      transaction_date: new Date().toISOString().split('T')[0],
      reference_number: leadId,
      status: 'completed',
      description: `Nurturing sequence triggered: ${sequenceName}`,
      metadata: {
        lead_id: leadId,
        sequence_name: sequenceName,
        trigger_reason: 'stage_automation'
      }
    })
  }

  private async estimateOpportunityValue(leadId: string): Promise<number> {
    // Basic value estimation based on lead source and scoring
    const leadDynamicData = await universalApi.getDynamicData(leadId)
    const leadScore = parseInt(leadDynamicData.lead_score || '50')
    
    // Base value multipliers by lead source
    const sourceMultipliers = {
      'email_campaign': 1.2,
      'inbound': 1.5,
      'referral': 2.0,
      'cold_outreach': 0.8
    }
    
    const baseValue = 5000 // Base opportunity value
    const source = leadDynamicData.lead_source || 'email_campaign'
    const sourceMultiplier = sourceMultipliers[source as keyof typeof sourceMultipliers] || 1.0
    const scoreMultiplier = leadScore / 100
    
    return Math.round(baseValue * sourceMultiplier * scoreMultiplier)
  }

  private calculateCloseProbability(leadDynamicData: any): number {
    const leadScore = parseInt(leadDynamicData.lead_score || '50')
    const baseProbability = Math.min(90, Math.max(10, leadScore)) // 10-90% range
    return baseProbability
  }

  private async processClosedWon(leadId: string): Promise<void> {
    const opportunityId = await universalApi.getDynamicField(leadId, 'opportunity_id')
    const estimatedValue = await universalApi.getDynamicField(opportunityId, 'estimated_value')
    
    // Create deal closure transaction
    await universalApi.createTransaction({
      organization_id: this.organizationId,
      transaction_type: 'deal_closed',
      transaction_code: `DEAL-${Date.now()}`,
      transaction_date: new Date().toISOString().split('T')[0],
      reference_number: opportunityId,
      total_amount: parseFloat(estimatedValue || '0'),
      status: 'completed',
      description: 'Deal closed successfully',
      metadata: {
        lead_id: leadId,
        opportunity_id: opportunityId,
        deal_value: estimatedValue,
        closure_reason: 'successful_conversion'
      }
    })

    // Update lead and opportunity status
    await universalApi.setDynamicField(leadId, 'status', 'converted')
    if (opportunityId) {
      await universalApi.updateEntity(opportunityId, { status: 'closed_won' })
    }
  }

  private getTimeframeStartDate(timeframe: 'month' | 'quarter' | 'year'): string {
    const now = new Date()
    const startDate = new Date(now)
    
    switch (timeframe) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }
    
    return startDate.toISOString().split('T')[0]
  }

  private async calculateAverageSalesCycle(timeframe: string): Promise<number> {
    // This would calculate based on historical closed deals
    // For now, return default based on timeframe
    const defaultCycles = { month: 21, quarter: 35, year: 45 }
    return defaultCycles[timeframe as keyof typeof defaultCycles] || 30
  }

  private calculatePipelineVelocity(dealsWon: number, timeframe: 'month' | 'quarter' | 'year'): number {
    const timeframeDays = { month: 30, quarter: 90, year: 365 }
    const days = timeframeDays[timeframe]
    return (dealsWon / days) * 30 // Deals per 30 days
  }
}

/**
 * Factory function to create lead conversion pipeline
 */
export const createLeadConversionPipeline = (organizationId: string) => {
  return new LeadConversionPipeline(organizationId)
}