import { universalApi } from '@/lib/universal-api'

/**
 * HERA Lead Scoring Engine
 * Intelligent lead conversion system using universal transactions and AI-ready scoring
 *
 * Features:
 * - Multi-factor lead scoring based on email engagement patterns
 * - Behavioral analysis using universal transaction history
 * - AI-ready confidence scoring and classification
 * - Automated lead qualification and nurturing workflows
 * - Integration with CRM lead conversion pipeline
 */

export interface LeadScore {
  email: string
  total_score: number
  engagement_score: number
  behavioral_score: number
  demographic_score: number
  recency_score: number
  frequency_score: number
  lead_grade: 'A' | 'B' | 'C' | 'D' | 'F'
  qualification_status: 'hot' | 'warm' | 'cold' | 'unqualified'
  recommended_action: 'immediate_follow_up' | 'nurture_sequence' | 'monitor' | 'remove'
  confidence_level: number
  last_updated: string
}

export interface LeadInsights {
  engagement_pattern: 'highly_engaged' | 'moderately_engaged' | 'low_engagement' | 'declining'
  preferred_content_types: string[]
  best_contact_times: string[]
  geographic_data: {
    country?: string
    region?: string
    timezone?: string
  }
  campaign_responsiveness: {
    most_responsive_campaigns: string[]
    least_responsive_campaigns: string[]
    optimal_frequency: number
  }
  conversion_probability: number
  estimated_value: number
}

export class LeadScoringEngine {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
    universalApi.setOrganizationId(organizationId)
  }

  /**
   * Calculate comprehensive lead score for a contact
   */
  async calculateLeadScore(email: string): Promise<LeadScore> {
    try {
      // Get all email engagements for this contact
      const engagements = await this.getEmailEngagements(email)

      // Calculate different score components
      const engagementScore = await this.calculateEngagementScore(engagements)
      const behavioralScore = await this.calculateBehavioralScore(email, engagements)
      const demographicScore = await this.calculateDemographicScore(email)
      const recencyScore = this.calculateRecencyScore(engagements)
      const frequencyScore = this.calculateFrequencyScore(engagements)

      // Weighted total score (out of 100)
      const totalScore = Math.min(
        100,
        Math.round(
          engagementScore * 0.35 + // 35% weight on engagement
            behavioralScore * 0.25 + // 25% weight on behavior
            demographicScore * 0.15 + // 15% weight on demographics
            recencyScore * 0.15 + // 15% weight on recency
            frequencyScore * 0.1 // 10% weight on frequency
        )
      )

      // Determine lead grade and qualification
      const leadGrade = this.getLeadGrade(totalScore)
      const qualificationStatus = this.getQualificationStatus(totalScore, engagements)
      const recommendedAction = this.getRecommendedAction(
        leadGrade,
        qualificationStatus,
        engagements
      )

      // Calculate confidence level based on data quality
      const confidenceLevel = this.calculateConfidenceLevel(engagements, email)

      return {
        email,
        total_score: totalScore,
        engagement_score: Math.round(engagementScore),
        behavioral_score: Math.round(behavioralScore),
        demographic_score: Math.round(demographicScore),
        recency_score: Math.round(recencyScore),
        frequency_score: Math.round(frequencyScore),
        lead_grade: leadGrade,
        qualification_status: qualificationStatus,
        recommended_action: recommendedAction,
        confidence_level: Math.round(confidenceLevel * 100) / 100,
        last_updated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error calculating lead score:', error)
      throw error
    }
  }

  /**
   * Generate AI-ready insights for lead nurturing
   */
  async generateLeadInsights(email: string): Promise<LeadInsights> {
    const engagements = await this.getEmailEngagements(email)

    return {
      engagement_pattern: this.analyzeEngagementPattern(engagements),
      preferred_content_types: await this.getPreferredContentTypes(engagements),
      best_contact_times: this.analyzeBestContactTimes(engagements),
      geographic_data: await this.getGeographicData(email),
      campaign_responsiveness: await this.analyzeCampaignResponsiveness(engagements),
      conversion_probability: await this.calculateConversionProbability(email, engagements),
      estimated_value: await this.estimateLeadValue(email, engagements)
    }
  }

  /**
   * Process lead scoring for entire email list
   */
  async batchProcessLeadScoring(emails: string[]): Promise<LeadScore[]> {
    const scores = []

    for (const email of emails) {
      try {
        const score = await this.calculateLeadScore(email)
        scores.push(score)

        // Store score in HERA universal tables
        await this.storeLeadScore(score)
      } catch (error) {
        console.error(`Error processing lead score for ${email}:`, error)
      }
    }

    return scores
  }

  /**
   * Get all email engagements for a contact from universal transactions
   */
  private async getEmailEngagements(email: string) {
    try {
      const transactions = await universalApi.getTransactions({
        filters: {
          transaction_type: ['email_opened', 'email_clicked', 'email_delivered', 'email_bounced'],
          'metadata->>recipient_email': email
        },
        limit: 1000,
        orderBy: 'transaction_date DESC'
      })

      return transactions.map((tx: any) => ({
        id: tx.id,
        event_type: tx.transaction_type.replace('email_', ''),
        timestamp: tx.created_at,
        score_value: tx.total_amount,
        campaign_id: (tx.metadata as any)?.campaign_id,
        message_id: (tx.metadata as any)?.message_id,
        metadata: tx.metadata
      }))
    } catch (error) {
      console.error('Error fetching email engagements:', error)
      return []
    }
  }

  /**
   * Calculate engagement score based on email interactions
   */
  private async calculateEngagementScore(engagements: any[]): Promise<number> {
    if (engagements.length === 0) return 0

    let score = 0
    const eventWeights = {
      delivered: 1,
      opened: 3,
      clicked: 8,
      bounced: -5,
      complained: -15,
      unsubscribed: -25
    }

    // Calculate weighted engagement score
    for (const engagement of engagements) {
      const weight = eventWeights[engagement.event_type as keyof typeof eventWeights] || 0
      score += weight
    }

    // Normalize to 0-100 scale based on engagement volume
    const normalizedScore = Math.min(100, Math.max(0, score))
    return normalizedScore
  }

  /**
   * Calculate behavioral score based on engagement patterns
   */
  private async calculateBehavioralScore(email: string, engagements: any[]): Promise<number> {
    let score = 0

    // Consistency bonus - regular engagement over time
    const engagementDays = new Set(engagements.map(e => new Date(e.timestamp).toDateString())).size

    if (engagementDays >= 7)
      score += 20 // Very consistent
    else if (engagementDays >= 3) score += 10 // Moderately consistent

    // Click-through rate bonus
    const opens = engagements.filter(e => e.event_type === 'opened').length
    const clicks = engagements.filter(e => e.event_type === 'clicked').length

    if (opens > 0) {
      const ctr = clicks / opens
      if (ctr >= 0.1)
        score += 25 // Excellent CTR
      else if (ctr >= 0.05)
        score += 15 // Good CTR
      else if (ctr >= 0.02) score += 5 // Average CTR
    }

    // Multi-campaign engagement bonus
    const uniqueCampaigns = new Set(engagements.map(e => e.campaign_id).filter(Boolean)).size

    if (uniqueCampaigns >= 3) score += 15
    else if (uniqueCampaigns >= 2) score += 8

    return Math.min(100, score)
  }

  /**
   * Calculate demographic score based on profile data
   */
  private async calculateDemographicScore(email: string): Promise<number> {
    try {
      // Look for existing contact or lead with this email
      const contacts = await universalApi.getEntities('contact', {
        filters: { email }
      })

      if (contacts.length === 0) return 20 // Base score for unknown demographic

      const contact = contacts[0]
      let score = 30 // Base score for known contact

      // Get dynamic data for demographic info
      const dynamicData = await universalApi.getDynamicData(contact.id)

      // Company size bonus
      const companySize = dynamicData.company_size
      if (companySize === 'enterprise') score += 25
      else if (companySize === 'medium') score += 15
      else if (companySize === 'small') score += 10

      // Title/role bonus
      const title = dynamicData.title?.toLowerCase() || ''
      if (title.includes('ceo') || title.includes('founder') || title.includes('president')) {
        score += 20
      } else if (
        title.includes('director') ||
        title.includes('manager') ||
        title.includes('head')
      ) {
        score += 15
      } else if (title.includes('vp') || title.includes('vice president')) {
        score += 18
      }

      // Industry bonus (if applicable to business model)
      const industry = dynamicData.industry
      const highValueIndustries = ['technology', 'finance', 'healthcare', 'consulting']
      if (industry && highValueIndustries.includes(industry.toLowerCase())) {
        score += 10
      }

      return Math.min(100, score)
    } catch (error) {
      console.error('Error calculating demographic score:', error)
      return 20 // Default score
    }
  }

  /**
   * Calculate recency score - how recent was last engagement
   */
  private calculateRecencyScore(engagements: any[]): number {
    if (engagements.length === 0) return 0

    const lastEngagement = new Date(engagements[0].timestamp) // Already sorted by date DESC
    const daysSinceLastEngagement = (Date.now() - lastEngagement.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceLastEngagement <= 1)
      return 100 // Today
    else if (daysSinceLastEngagement <= 7)
      return 80 // This week
    else if (daysSinceLastEngagement <= 30)
      return 50 // This month
    else if (daysSinceLastEngagement <= 90)
      return 25 // This quarter
    else return 5 // Older than 3 months
  }

  /**
   * Calculate frequency score - how often do they engage
   */
  private calculateFrequencyScore(engagements: any[]): number {
    if (engagements.length === 0) return 0

    // Calculate engagement frequency over last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentEngagements = engagements.filter(e => new Date(e.timestamp) >= thirtyDaysAgo)

    const frequency = recentEngagements.length

    if (frequency >= 10)
      return 100 // Very frequent
    else if (frequency >= 5)
      return 75 // Frequent
    else if (frequency >= 2)
      return 50 // Moderate
    else if (frequency >= 1)
      return 25 // Occasional
    else return 0 // No recent engagement
  }

  /**
   * Determine lead grade based on total score
   */
  private getLeadGrade(score: number): LeadScore['lead_grade'] {
    if (score >= 85) return 'A'
    else if (score >= 70) return 'B'
    else if (score >= 55) return 'C'
    else if (score >= 35) return 'D'
    else return 'F'
  }

  /**
   * Determine qualification status
   */
  private getQualificationStatus(
    score: number,
    engagements: any[]
  ): LeadScore['qualification_status'] {
    const recentHighValueEngagements = engagements.filter(e => {
      const isRecent = new Date(e.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const isHighValue = ['clicked'].includes(e.event_type)
      return isRecent && isHighValue
    })

    if (score >= 80 && recentHighValueEngagements.length >= 1) return 'hot'
    else if (score >= 60) return 'warm'
    else if (score >= 35) return 'cold'
    else return 'unqualified'
  }

  /**
   * Get recommended action based on lead scoring
   */
  private getRecommendedAction(
    grade: LeadScore['lead_grade'],
    qualification: LeadScore['qualification_status'],
    engagements: any[]
  ): LeadScore['recommended_action'] {
    if (grade === 'A' || qualification === 'hot') return 'immediate_follow_up'
    else if (grade === 'B' || qualification === 'warm') return 'nurture_sequence'
    else if (grade === 'C' || qualification === 'cold') return 'monitor'
    else return 'remove'
  }

  /**
   * Calculate confidence level in the scoring
   */
  private calculateConfidenceLevel(engagements: any[], email: string): number {
    let confidence = 0.3 // Base confidence

    // Data volume confidence
    if (engagements.length >= 10) confidence += 0.3
    else if (engagements.length >= 5) confidence += 0.2
    else if (engagements.length >= 2) confidence += 0.1

    // Data recency confidence
    const daysSinceLastEngagement =
      engagements.length > 0
        ? (Date.now() - new Date(engagements[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)
        : 999

    if (daysSinceLastEngagement <= 7) confidence += 0.2
    else if (daysSinceLastEngagement <= 30) confidence += 0.1

    // Data diversity confidence
    const uniqueEventTypes = new Set(engagements.map(e => e.event_type)).size
    if (uniqueEventTypes >= 3) confidence += 0.2
    else if (uniqueEventTypes >= 2) confidence += 0.1

    return Math.min(1.0, confidence)
  }

  // Additional analysis methods for insights generation...

  private analyzeEngagementPattern(engagements: any[]): LeadInsights['engagement_pattern'] {
    if (engagements.length < 3) return 'low_engagement'

    // Analyze engagement trend over time
    const recentEngagements = engagements.slice(0, Math.min(5, engagements.length))
    const olderEngagements = engagements.slice(-Math.min(5, engagements.length))

    const recentAvgScore =
      recentEngagements.reduce((sum, e) => sum + (e.score_value || 0), 0) / recentEngagements.length
    const olderAvgScore =
      olderEngagements.reduce((sum, e) => sum + (e.score_value || 0), 0) / olderEngagements.length

    if (recentAvgScore >= 10) return 'highly_engaged'
    else if (recentAvgScore >= 5) return 'moderately_engaged'
    else if (recentAvgScore < olderAvgScore * 0.7) return 'declining'
    else return 'low_engagement'
  }

  private async getPreferredContentTypes(engagements: any[]): Promise<string[]> {
    // Analyze which campaign types get the most engagement
    const campaignTypes = new Map<string, number>()

    for (const engagement of engagements) {
      if (engagement.campaign_id && engagement.event_type === 'clicked') {
        try {
          const campaignData = await universalApi.getDynamicData(engagement.campaign_id)
          const campaignType = campaignData.campaign_type || 'general'
          campaignTypes.set(campaignType, (campaignTypes.get(campaignType) || 0) + 1)
        } catch (error) {
          // Continue if campaign data not available
        }
      }
    }

    return Array.from(campaignTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type)
  }

  private analyzeBestContactTimes(engagements: any[]): string[] {
    const hourCounts = new Map<number, number>()

    for (const engagement of engagements) {
      if (engagement.event_type === 'opened' || engagement.event_type === 'clicked') {
        const hour = new Date(engagement.timestamp).getHours()
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
      }
    }

    return Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`)
  }

  private async getGeographicData(email: string): Promise<LeadInsights['geographic_data']> {
    // Extract geographic data from engagement metadata
    const contacts = await universalApi.getEntities('contact', { filters: { email } })

    if (contacts.length > 0) {
      const contact = contacts[0]
      const dynamicData = await universalApi.getDynamicData(contact.id)

      return {
        country: dynamicData.country,
        region: dynamicData.region,
        timezone: dynamicData.timezone
      }
    }

    return {}
  }

  private async analyzeCampaignResponsiveness(
    engagements: any[]
  ): Promise<LeadInsights['campaign_responsiveness']> {
    const campaignScores = new Map<string, { score: number; count: number }>()

    for (const engagement of engagements) {
      if (engagement.campaign_id) {
        const current = campaignScores.get(engagement.campaign_id) || { score: 0, count: 0 }
        campaignScores.set(engagement.campaign_id, {
          score: current.score + (engagement.score_value || 0),
          count: current.count + 1
        })
      }
    }

    const sortedCampaigns = Array.from(campaignScores.entries())
      .map(([id, data]) => ({ id, avgScore: data.score / data.count }))
      .sort((a, b) => b.avgScore - a.avgScore)

    return {
      most_responsive_campaigns: sortedCampaigns.slice(0, 3).map(c => c.id),
      least_responsive_campaigns: sortedCampaigns.slice(-3).map(c => c.id),
      optimal_frequency: this.calculateOptimalFrequency(engagements)
    }
  }

  private calculateOptimalFrequency(engagements: any[]): number {
    // Analyze engagement patterns to suggest optimal email frequency
    const dailyEngagements = new Map<string, number>()

    for (const engagement of engagements) {
      const date = new Date(engagement.timestamp).toDateString()
      dailyEngagements.set(date, (dailyEngagements.get(date) || 0) + 1)
    }

    const avgDailyEngagements =
      Array.from(dailyEngagements.values()).reduce((sum, count) => sum + count, 0) /
      dailyEngagements.size

    // Convert to weekly frequency recommendation
    return Math.round(avgDailyEngagements * 7)
  }

  private async calculateConversionProbability(email: string, engagements: any[]): Promise<number> {
    // Use historical conversion patterns to predict probability
    const leadScore = await this.calculateLeadScore(email)
    const recentHighValueEngagements = engagements.filter(
      e =>
        e.event_type === 'clicked' &&
        new Date(e.timestamp) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length

    let probability = 0.05 // Base 5% probability

    if (leadScore.total_score >= 80) probability += 0.4
    else if (leadScore.total_score >= 60) probability += 0.25
    else if (leadScore.total_score >= 40) probability += 0.15

    probability += Math.min(0.3, recentHighValueEngagements * 0.1)

    return Math.min(0.95, probability)
  }

  private async estimateLeadValue(email: string, engagements: any[]): Promise<number> {
    // Estimate potential lead value based on engagement patterns and demographics
    let baseValue = 1000 // Base lead value

    const leadScore = await this.calculateLeadScore(email)
    const valueMultiplier = leadScore.total_score / 100

    // Adjust based on engagement intensity
    const highValueEngagements = engagements.filter(e => e.event_type === 'clicked').length
    const engagementBonus = Math.min(2.0, 1 + highValueEngagements * 0.1)

    return Math.round(baseValue * valueMultiplier * engagementBonus)
  }

  /**
   * Store lead score in HERA universal tables
   */
  private async storeLeadScore(score: LeadScore): Promise<void> {
    try {
      // Look for existing lead scoring entity
      const existingScores = await universalApi.getEntities('lead_score', {
        filters: { email: score.email }
      })

      if (existingScores.length > 0) {
        // Update existing score
        const scoreEntity = existingScores[0]

        await universalApi.updateEntity(scoreEntity.id, {
          metadata: {
            ...score,
            updated_at: new Date().toISOString()
          }
        })

        // Update dynamic fields
        for (const [key, value] of Object.entries(score)) {
          await universalApi.setDynamicField(scoreEntity.id, key, String(value))
        }
      } else {
        // Create new lead score entity
        const scoreEntity = await universalApi.createEntity({
          organization_id: this.organizationId,
          entity_type: 'lead_score',
          entity_name: `Lead Score - ${score.email}`,
          entity_code: `SCORE-${Date.now()}`,
          status: 'active',
          metadata: score
        })

        // Store all score fields as dynamic data
        for (const [key, value] of Object.entries(score)) {
          await universalApi.setDynamicField(scoreEntity.id, key, String(value))
        }
      }

      // Create scoring transaction for analytics
      await universalApi.createTransaction({
        organization_id: this.organizationId,
        transaction_type: 'lead_scoring_update',
        transaction_code: `SCORE-${Date.now()}`,
        transaction_date: new Date().toISOString().split('T')[0],
        reference_number: score.email,
        total_amount: score.total_score,
        status: 'completed',
        description: `Lead score updated: ${score.email} - ${score.lead_grade} grade`,
        metadata: {
          email: score.email,
          total_score: score.total_score,
          lead_grade: score.lead_grade,
          qualification_status: score.qualification_status,
          recommended_action: score.recommended_action,
          confidence_level: score.confidence_level
        }
      })
    } catch (error) {
      console.error('Error storing lead score:', error)
      throw error
    }
  }
}

/**
 * Factory function to create lead scoring engine
 */
export const createLeadScoringEngine = (organizationId: string) => {
  return new LeadScoringEngine(organizationId)
}
