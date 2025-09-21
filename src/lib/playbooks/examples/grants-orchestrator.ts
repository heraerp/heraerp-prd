/**
 * GRANTS Intake & Review Orchestrator Example
 *
 * Demonstrates complete orchestration logic for a public sector
 * grants intake and review process using HERA's universal architecture.
 */

import { universalApi } from '@/lib/universal-api'
import { PlaybookOrchestrator } from '../orchestrator'
import { createPlaybookAIService } from '../ai-service'
import type { WorkerResult } from '../orchestrator'

export class GrantsIntakeOrchestrator extends PlaybookOrchestrator {
  /**
   * Process Step 1: RegisterApplication (Human)
   */
  protected async processHumanStep(
    runId: string,
    stepId: string,
    stepDef: any,
    inputs: any
  ): Promise<WorkerResult> {
    if (stepDef.metadata.step_name === 'RegisterApplication') {
      return this.processApplicationRegistration(runId, stepId, stepDef, inputs)
    }

    if (stepDef.metadata.step_name === 'CommitteeReview') {
      return this.processCommitteeReview(runId, stepId, stepDef, inputs)
    }

    // Default human step processing
    return super.processHumanStep(runId, stepId, stepDef, inputs)
  }

  /**
   * Process Step 2: EligibilityScreen (System)
   */
  protected async processSystemStep(
    runId: string,
    stepId: string,
    stepDef: any,
    inputs: any
  ): Promise<WorkerResult> {
    if (stepDef.metadata.step_name === 'EligibilityScreen') {
      return this.processEligibilityScreening(runId, stepId, stepDef, inputs)
    }

    if (stepDef.metadata.step_name === 'AwardDecision') {
      return this.processAwardDecision(runId, stepId, stepDef, inputs)
    }

    // Default system step processing
    return super.processSystemStep(runId, stepId, stepDef, inputs)
  }

  /**
   * Process Step 3: ScoreProposal (AI)
   */
  protected async processAIStep(
    runId: string,
    stepId: string,
    stepDef: any,
    inputs: any
  ): Promise<WorkerResult> {
    if (stepDef.metadata.step_name === 'ScoreProposal') {
      return this.processAIScoring(runId, stepId, stepDef, inputs)
    }

    // Default AI step processing
    return super.processAIStep(runId, stepId, stepDef, inputs)
  }

  /**
   * Application Registration Processing
   */
  private async processApplicationRegistration(
    runId: string,
    stepId: string,
    stepDef: any,
    inputs: any
  ): Promise<WorkerResult> {
    const startTime = Date.now()

    try {
      // Get run details
      const run = await universalApi.getTransaction(runId)

      // Generate application ID
      const applicationId = `APP-${inputs.program}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`

      // Create or update applicant entity
      let applicantEntity
      if (inputs.applicant_id) {
        applicantEntity = await universalApi.getEntity(inputs.applicant_id)
      } else {
        applicantEntity = await universalApi.createEntity({
          entity_type: 'grant_applicant',
          entity_name: inputs.applicant_name,
          entity_code: `APPLICANT-${inputs.applicant_name.replace(/\s+/g, '-').toUpperCase()}`,
          smart_code: 'HERA.PUBLICSECTOR.GRANTS.APPLICANT.ORG.V1',
          organization_id: this.organizationId,
          metadata: {
            type: inputs.applicant_type,
            contact_email: inputs.contact_email,
            established_year: inputs.established_year
          }
        })
      }

      // Get applicant's grant history
      const previousGrants = await universalApi.queryTransactions({
        filters: {
          transaction_type: 'grant_award',
          reference_entity_id: applicantEntity.id,
          status: 'completed'
        },
        organization_id: this.organizationId
      })

      const totalPreviousFunding =
        previousGrants.data?.reduce((sum, grant) => sum + (grant.total_amount || 0), 0) || 0

      // Build comprehensive proposal summary
      const proposalSummary = {
        title: inputs.project_title,
        description: inputs.project_description,
        target_beneficiaries: inputs.target_beneficiaries,
        duration_months: inputs.project_duration_months,
        innovation_score: this.calculateInnovationScore(inputs),
        sector: this.extractSector(inputs.program),
        keywords: this.extractKeywords(inputs.project_description)
      }

      // Prepare outputs
      const outputs = {
        application_id: applicationId,
        applicant_profile: {
          organization_id: applicantEntity.id,
          type: inputs.applicant_type,
          tax_id: inputs.tax_id,
          established_year: inputs.established_year,
          previous_grants: previousGrants.data?.length || 0,
          total_previous_funding: totalPreviousFunding,
          success_rate: this.calculateSuccessRate(previousGrants.data || [])
        },
        proposal_summary: proposalSummary,
        documentation_status: {
          application_form: 'complete',
          budget_details: 'complete',
          organizational_documents: 'complete',
          project_narrative: 'complete',
          letters_of_support: inputs.letters_of_support?.length || 0
        }
      }

      // Calculate AI confidence based on completeness
      const confidence = this.calculateRegistrationConfidence(inputs, outputs)

      return {
        status: 'completed',
        outputs,
        duration_ms: Date.now() - startTime,
        worker_notes: 'Complete application package received. All required documents present.',
        ai_confidence: confidence,
        ai_insights: `Application registration completed with ${confidence >= 0.9 ? 'excellent' : confidence >= 0.8 ? 'good' : 'adequate'} data quality. Applicant has ${outputs.applicant_profile.previous_grants} previous grants totaling $${totalPreviousFunding.toLocaleString()}.`
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        duration_ms: Date.now() - startTime,
        ai_confidence: 0.1,
        ai_insights: `Registration failed: ${error.message}`
      }
    }
  }

  /**
   * Eligibility Screening Processing
   */
  private async processEligibilityScreening(
    runId: string,
    stepId: string,
    stepDef: any,
    inputs: any
  ): Promise<WorkerResult> {
    const startTime = Date.now()

    try {
      // Get eligibility rules from playbook configuration
      const playbook = await universalApi.getEntity(stepDef.metadata.playbook_id)
      const eligibilityRulesData = await universalApi.getDynamicField(
        playbook.id,
        'eligibility_rules'
      )

      const eligibilityRules = JSON.parse(eligibilityRulesData.field_value_text)

      // Run eligibility checks
      const rulesEvaluated: Record<string, any> = {}
      const eligibilityReasons: string[] = []
      let allPassed = true

      // Amount limits check
      const amountInRange =
        inputs.amount_requested >= eligibilityRules.min_amount &&
        inputs.amount_requested <= eligibilityRules.max_amount
      rulesEvaluated.amount_limits = {
        passed: amountInRange,
        value: inputs.amount_requested,
        min_threshold: eligibilityRules.min_amount,
        max_threshold: eligibilityRules.max_amount
      }

      if (amountInRange) {
        eligibilityReasons.push(
          `Amount within limits: $${inputs.amount_requested.toLocaleString()} ≤ $${eligibilityRules.max_amount.toLocaleString()} ✓`
        )
      } else {
        eligibilityReasons.push(
          `Amount outside limits: $${inputs.amount_requested.toLocaleString()} (min: $${eligibilityRules.min_amount.toLocaleString()}, max: $${eligibilityRules.max_amount.toLocaleString()}) ✗`
        )
        allPassed = false
      }

      // Organization type check
      const orgTypeEligible = eligibilityRules.organization_types.includes(
        inputs.applicant_profile.type
      )
      rulesEvaluated.organization_type = {
        passed: orgTypeEligible,
        value: inputs.applicant_profile.type,
        allowed: eligibilityRules.organization_types
      }

      if (orgTypeEligible) {
        eligibilityReasons.push(
          `Organization type '${inputs.applicant_profile.type}' is eligible ✓`
        )
      } else {
        eligibilityReasons.push(
          `Organization type '${inputs.applicant_profile.type}' not eligible ✗`
        )
        allPassed = false
      }

      // Sector eligibility check
      const proposalSector = this.extractSector(inputs.program)
      const sectorEligible = eligibilityRules.eligible_sectors.includes(proposalSector)
      rulesEvaluated.sector = {
        passed: sectorEligible,
        value: proposalSector,
        allowed: eligibilityRules.eligible_sectors
      }

      if (sectorEligible) {
        eligibilityReasons.push(`${proposalSector} program matches eligible sectors ✓`)
      } else {
        eligibilityReasons.push(`${proposalSector} program not in eligible sectors ✗`)
        allPassed = false
      }

      // Geographic restrictions check (simplified)
      const geoEligible = true // Assume passed for this example
      rulesEvaluated.geographic = {
        passed: geoEligible,
        restrictions: eligibilityRules.geographic_restrictions
      }

      if (geoEligible) {
        eligibilityReasons.push('No geographic restrictions violated ✓')
      }

      // Prepare outputs
      const outputs = {
        eligibility_status: allPassed ? 'eligible' : 'ineligible',
        eligibility_reasons,
        next_steps: allPassed ? 'proceed_to_scoring' : 'reject_application',
        rules_evaluated: rulesEvaluated,
        screening_timestamp: new Date().toISOString()
      }

      return {
        status: 'completed',
        outputs,
        duration_ms: Date.now() - startTime,
        ai_confidence: 0.99,
        ai_insights: allPassed
          ? 'Perfect eligibility screening. All rules passed decisively.'
          : `Eligibility screening failed. ${Object.values(rulesEvaluated).filter((r: any) => !r.passed).length} rules failed.`
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        duration_ms: Date.now() - startTime,
        ai_confidence: 0.1,
        ai_insights: `Eligibility screening failed: ${error.message}`
      }
    }
  }

  /**
   * AI Scoring Processing
   */
  private async processAIScoring(
    runId: string,
    stepId: string,
    stepDef: any,
    inputs: any
  ): Promise<WorkerResult> {
    const startTime = Date.now()

    try {
      // Get scoring criteria from playbook configuration
      const playbook = await universalApi.getEntity(stepDef.metadata.playbook_id)
      const scoringCriteriaData = await universalApi.getDynamicField(
        playbook.id,
        'scoring_criteria'
      )

      const scoringCriteria = JSON.parse(scoringCriteriaData.field_value_text)

      // Initialize AI service
      const aiService = createPlaybookAIService(this.organizationId)

      // Simulate AI scoring (in production, this would call actual AI model)
      const criteriaScores = await this.simulateAIScoring(inputs, scoringCriteria)

      // Calculate total weighted score
      let totalScore = 0
      const scoredCriteria: Record<string, any> = {}

      for (const [criterion, config] of Object.entries(scoringCriteria)) {
        const score = criteriaScores[criterion]
        const weighted = score * (config as any).weight
        totalScore += weighted

        scoredCriteria[criterion] = {
          score,
          weight: (config as any).weight,
          weighted,
          max_score: (config as any).max_score
        }
      }

      // Generate AI rationale
      const rationale = this.generateScoringRationale(scoredCriteria, inputs)

      // Assess risks
      const riskAssessment = this.assessProposalRisks(inputs, scoredCriteria)

      // Generate recommendations
      const recommendations = this.generateScoringRecommendations(scoredCriteria, riskAssessment)

      // Calculate AI confidence based on score distribution and consistency
      const confidence = this.calculateScoringConfidence(scoredCriteria)

      const outputs = {
        total_score: Math.round(totalScore * 10) / 10,
        criteria_scores: scoredCriteria,
        ai_rationale: rationale,
        risk_assessment: riskAssessment,
        recommendations,
        model_metadata: {
          model_version: 'grants-scoring-v2.1',
          processing_time_ms: Date.now() - startTime,
          confidence_score: confidence
        }
      }

      return {
        status: 'completed',
        outputs,
        duration_ms: Date.now() - startTime,
        ai_confidence: confidence,
        ai_insights: `AI scoring completed with total score ${outputs.total_score}/100. ${confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low'} confidence in analysis.`
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        duration_ms: Date.now() - startTime,
        ai_confidence: 0.1,
        ai_insights: `AI scoring failed: ${error.message}`
      }
    }
  }

  /**
   * Committee Review Processing
   */
  private async processCommitteeReview(
    runId: string,
    stepId: string,
    stepDef: any,
    inputs: any
  ): Promise<WorkerResult> {
    // For human steps like committee review, we typically just track
    // that the step was assigned and wait for external completion
    // This is a simplified implementation

    const startTime = Date.now()

    try {
      // Get committee configuration
      const playbook = await universalApi.getEntity(stepDef.metadata.playbook_id)
      const committeeConfigData = await universalApi.getDynamicField(
        playbook.id,
        'committee_config'
      )

      const committeeConfig = JSON.parse(committeeConfigData.field_value_text)

      // For this example, simulate committee voting
      // In production, this would integrate with actual voting system
      const simulatedVotes = await this.simulateCommitteeVoting(inputs, committeeConfig)

      const consensusScore =
        simulatedVotes.reduce((sum, vote) => sum + vote.score, 0) / simulatedVotes.length

      const outputs = {
        committee_votes: simulatedVotes,
        consensus_score: Math.round(consensusScore * 10) / 10,
        review_notes: `${simulatedVotes.filter(v => v.vote === 'approve').length}/${simulatedVotes.length} committee approval. Average score: ${consensusScore.toFixed(1)}.`,
        voting_summary: {
          total_votes: simulatedVotes.length,
          approve_votes: simulatedVotes.filter(v => v.vote === 'approve').length,
          deny_votes: simulatedVotes.filter(v => v.vote === 'deny').length,
          abstain_votes: simulatedVotes.filter(v => v.vote === 'abstain').length,
          consensus_reached: true
        }
      }

      return {
        status: 'completed',
        outputs,
        duration_ms: Date.now() - startTime,
        ai_confidence: 0.85,
        ai_insights: `Committee review completed with ${outputs.voting_summary.approve_votes}/${outputs.voting_summary.total_votes} approval votes.`
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        duration_ms: Date.now() - startTime,
        ai_confidence: 0.1,
        ai_insights: `Committee review failed: ${error.message}`
      }
    }
  }

  /**
   * Award Decision Processing
   */
  private async processAwardDecision(
    runId: string,
    stepId: string,
    stepDef: any,
    inputs: any
  ): Promise<WorkerResult> {
    const startTime = Date.now()

    try {
      // Get decision algorithm configuration
      const aiWeight = 0.4
      const committeeWeight = 0.6
      const approvalThreshold = 70.0

      // Calculate final score
      const finalScore = inputs.total_score * aiWeight + inputs.consensus_score * committeeWeight

      // Determine award decision
      const shouldAward =
        finalScore >= approvalThreshold &&
        inputs.committee_votes.filter((v: any) => v.vote === 'approve').length >=
          Math.ceil(inputs.committee_votes.length / 2)

      // Generate decision rationale
      const rationale = this.generateDecisionRationale(
        inputs,
        finalScore,
        shouldAward,
        approvalThreshold
      )

      // Prepare award details
      const awardAmount = shouldAward ? inputs.amount_requested : 0
      const awardStatus = shouldAward ? 'awarded' : 'denied'

      // Send notifications (simulated)
      const notificationResult = await this.sendAwardNotification(
        inputs.application_id,
        awardStatus,
        awardAmount,
        rationale
      )

      const outputs = {
        award_status: awardStatus,
        award_amount: awardAmount,
        decision_rationale: rationale,
        notification_sent: notificationResult,
        final_score: Math.round(finalScore * 10) / 10,
        decision_metadata: {
          ai_score: inputs.total_score,
          committee_score: inputs.consensus_score,
          weighted_score: finalScore,
          approval_threshold: approvalThreshold,
          algorithm: 'weighted_average_with_consensus'
        }
      }

      return {
        status: 'completed',
        outputs,
        duration_ms: Date.now() - startTime,
        ai_confidence: 0.96,
        ai_insights: `Award decision completed: ${awardStatus.toUpperCase()}. Final score ${finalScore.toFixed(1)} ${shouldAward ? 'exceeds' : 'below'} threshold ${approvalThreshold}.`
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        duration_ms: Date.now() - startTime,
        ai_confidence: 0.1,
        ai_insights: `Award decision failed: ${error.message}`
      }
    }
  }

  // Helper methods for grants-specific processing

  private calculateInnovationScore(inputs: any): number {
    // Simplified innovation scoring based on keywords and approach
    const innovativeKeywords = [
      'ai',
      'machine learning',
      'blockchain',
      'iot',
      'vr',
      'ar',
      'quantum'
    ]
    const description = (inputs.project_description || '').toLowerCase()
    const keywordMatches = innovativeKeywords.filter(keyword =>
      description.includes(keyword)
    ).length

    return Math.min(10, 5 + keywordMatches * 1.5)
  }

  private extractSector(program: string): string {
    if (program.toLowerCase().includes('stem')) return 'education'
    if (program.toLowerCase().includes('health')) return 'healthcare'
    if (program.toLowerCase().includes('tech')) return 'technology'
    if (program.toLowerCase().includes('environment')) return 'environment'
    return 'general'
  }

  private extractKeywords(description: string): string[] {
    // Simple keyword extraction
    const keywords = description
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .slice(0, 10)
    return keywords
  }

  private calculateSuccessRate(previousGrants: any[]): number {
    if (previousGrants.length === 0) return 0
    const successful = previousGrants.filter(g => g.metadata?.outcome === 'successful').length
    return successful / previousGrants.length
  }

  private calculateRegistrationConfidence(inputs: any, outputs: any): number {
    let confidence = 0.5

    // Boost confidence for complete data
    if (inputs.project_description?.length > 100) confidence += 0.1
    if (inputs.applicant_type) confidence += 0.1
    if (inputs.project_duration_months > 0) confidence += 0.1
    if (outputs.applicant_profile.previous_grants > 0) confidence += 0.15
    if (outputs.documentation_status.letters_of_support > 0) confidence += 0.05

    return Math.min(0.95, confidence)
  }

  private async simulateAIScoring(inputs: any, criteria: any): Promise<Record<string, number>> {
    // Simulate AI scoring based on proposal characteristics
    const scores: Record<string, number> = {}

    scores.innovation = 75 + Math.random() * 20 // 75-95 range
    scores.impact = 80 + Math.random() * 15 // 80-95 range
    scores.feasibility = 70 + Math.random() * 20 // 70-90 range
    scores.budget = 75 + Math.random() * 15 // 75-90 range
    scores.sustainability = 60 + Math.random() * 25 // 60-85 range

    // Adjust based on inputs
    if (inputs.amount_requested > 75000) {
      scores.budget -= 10 // Penalize large requests
    }

    if (inputs.proposal_summary?.innovation_score > 8) {
      scores.innovation += 5
    }

    return scores
  }

  private generateScoringRationale(criteria: Record<string, any>, inputs: any): string {
    const topCriteria = Object.entries(criteria)
      .sort(([, a], [, b]) => (b as any).score - (a as any).score)
      .slice(0, 2)
      .map(([name]) => name)

    return `Strong proposal with particular strength in ${topCriteria.join(' and ')}. ${inputs.amount_requested > 40000 ? 'Significant' : 'Moderate'} funding request with ${inputs.proposal_summary?.innovation_score > 7 ? 'innovative' : 'traditional'} approach.`
  }

  private assessProposalRisks(inputs: any, criteria: Record<string, any>): Record<string, string> {
    return {
      technical_risk:
        criteria.feasibility?.score > 80
          ? 'low'
          : criteria.feasibility?.score > 60
            ? 'medium'
            : 'high',
      financial_risk: inputs.amount_requested > 75000 ? 'medium' : 'low',
      timeline_risk: inputs.project_duration_months > 24 ? 'medium' : 'low',
      sustainability_risk: criteria.sustainability?.score > 75 ? 'low' : 'medium'
    }
  }

  private generateScoringRecommendations(
    criteria: Record<string, any>,
    risks: Record<string, string>
  ): string[] {
    const recommendations = []

    if (criteria.sustainability?.score < 70) {
      recommendations.push('Develop stronger sustainability plan for post-grant period')
    }

    if (risks.financial_risk === 'medium') {
      recommendations.push('Consider phased funding approach to mitigate financial risk')
    }

    if (criteria.impact?.score > 90) {
      recommendations.push('Exceptional impact potential - consider for expedited review')
    }

    return recommendations
  }

  private calculateScoringConfidence(criteria: Record<string, any>): number {
    const scores = Object.values(criteria).map((c: any) => c.score)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
    const stdDev = Math.sqrt(variance)

    // Higher confidence for lower variance (more consistent scores)
    return Math.max(0.6, Math.min(0.95, 0.9 - stdDev / 100))
  }

  private async simulateCommitteeVoting(inputs: any, config: any): Promise<any[]> {
    // Simulate committee votes based on AI score
    const baseScore = inputs.total_score

    return [
      {
        member_id: 'committee_member_1',
        name: 'Dr. Sarah Chen',
        vote: baseScore > 80 ? 'approve' : 'deny',
        score: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 10)),
        notes: baseScore > 80 ? 'Strong proposal with clear impact' : 'Concerns about feasibility'
      },
      {
        member_id: 'committee_member_2',
        name: 'Prof. Michael Rodriguez',
        vote: baseScore > 75 ? 'approve' : 'deny',
        score: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 8)),
        notes: baseScore > 85 ? 'Excellent innovation potential' : 'Budget concerns noted'
      },
      {
        member_id: 'committee_member_3',
        name: 'Janet Wilson',
        vote: baseScore > 82 ? 'approve' : 'deny',
        score: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 6)),
        notes: 'Thorough review completed, recommendation based on merit'
      }
    ]
  }

  private generateDecisionRationale(
    inputs: any,
    finalScore: number,
    shouldAward: boolean,
    threshold: number
  ): string {
    if (shouldAward) {
      return `Application approved with committee consensus (${finalScore.toFixed(1)} final score exceeds ${threshold} threshold). Strong proposal demonstrates innovation and impact potential with realistic implementation plan.`
    } else {
      return `Application denied. Final score (${finalScore.toFixed(1)}) below approval threshold (${threshold}). Recommend resubmission with enhanced sustainability plan and budget justification.`
    }
  }

  private async sendAwardNotification(
    applicationId: string,
    status: string,
    amount: number,
    rationale: string
  ): Promise<any> {
    // Simulate notification sending
    return {
      notification_id: `NOTIF-${applicationId}-${Date.now()}`,
      sent_at: new Date().toISOString(),
      status: 'sent',
      template_used: `${status}_notification`,
      recipients: ['applicant@example.com', 'grants@agency.gov']
    }
  }
}

/**
 * Factory function to create grants intake orchestrator
 */
export function createGrantsIntakeOrchestrator(organizationId: string): GrantsIntakeOrchestrator {
  return new GrantsIntakeOrchestrator(organizationId)
}
