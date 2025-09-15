/**
 * HERA Universal Configuration Rule Resolver
 * Smart Code: HERA.UNIV.CONFIG.RESOLVER.v1
 *
 * Core resolution engine for configuration rules
 */

import type { UniversalRule, Context } from './universal-config-service'

/**
 * Rule match result with scoring
 */
export interface RuleMatch {
  rule: UniversalRule
  score: number
  matchedConditions: string[]
  unmatchedConditions: string[]
}

/**
 * Advanced rule resolution with scoring and debugging
 */
export class RuleResolver {
  /**
   * Score and rank rules based on match quality
   */
  scoreRules(rules: UniversalRule[], context: Context): RuleMatch[] {
    return rules
      .map(rule => {
        const matchResult = this.calculateMatchScore(rule, context)
        return {
          rule,
          score: matchResult.score,
          matchedConditions: matchResult.matched,
          unmatchedConditions: matchResult.unmatched
        }
      })
      .sort((a, b) => b.score - a.score)
  }

  /**
   * Calculate detailed match score for a rule
   */
  private calculateMatchScore(
    rule: UniversalRule,
    context: Context
  ): {
    score: number
    matched: string[]
    unmatched: string[]
  } {
    let score = 0
    const matched: string[] = []
    const unmatched: string[] = []

    // Base score for active rules
    if (rule.status === 'active') {
      score += 100
      matched.push('status:active')
    }

    // Scope matching (weighted by specificity)
    const scopeScore = this.scoreScopeMatch(rule.scope, context)
    score += scopeScore.score
    matched.push(...scopeScore.matched)
    unmatched.push(...scopeScore.unmatched)

    // Time relevance scoring
    const timeScore = this.scoreTimeRelevance(rule.conditions, context)
    score += timeScore.score
    matched.push(...timeScore.matched)
    unmatched.push(...timeScore.unmatched)

    // Business condition scoring
    const conditionScore = this.scoreBusinessConditions(rule.conditions, context)
    score += conditionScore.score
    matched.push(...conditionScore.matched)
    unmatched.push(...conditionScore.unmatched)

    // Priority boost
    score += rule.priority * 10
    if (rule.priority > 0) {
      matched.push(`priority:${rule.priority}`)
    }

    return { score, matched, unmatched }
  }

  /**
   * Score scope matching with specificity weights
   */
  private scoreScopeMatch(
    scope: UniversalRule['scope'],
    context: Context
  ): {
    score: number
    matched: string[]
    unmatched: string[]
  } {
    let score = 0
    const matched: string[] = []
    const unmatched: string[] = []

    // Organization match is mandatory
    if (scope.organization_id === context.organization_id) {
      score += 50
      matched.push('organization')
    } else {
      // No match possible if organization doesn't match
      return { score: -1000, matched: [], unmatched: ['organization'] }
    }

    // Branch matching (weight: 40)
    if (scope.branches) {
      if (context.branch_id && scope.branches.includes(context.branch_id)) {
        score += 40
        matched.push(`branch:${context.branch_id}`)
      } else if (context.branch_id) {
        score -= 20
        unmatched.push('branch')
      }
    }

    // Service matching (weight: 30)
    if (scope.services && context.service_ids) {
      const matchingServices = context.service_ids.filter(id => scope.services!.includes(id))
      if (matchingServices.length > 0) {
        score += 30 * (matchingServices.length / context.service_ids.length)
        matched.push(`services:${matchingServices.length}/${context.service_ids.length}`)
      } else {
        score -= 15
        unmatched.push('services')
      }
    }

    // Specialist matching (weight: 25)
    if (scope.specialists) {
      if (context.specialist_id && scope.specialists.includes(context.specialist_id)) {
        score += 25
        matched.push(`specialist:${context.specialist_id}`)
      } else if (context.specialist_id) {
        score -= 10
        unmatched.push('specialist')
      }
    }

    // Customer segment matching (weight: 20)
    if (scope.customers && context.customer_segments) {
      const matchingSegments = context.customer_segments.filter(segment =>
        scope.customers!.includes(segment)
      )
      if (matchingSegments.length > 0) {
        score += 20 * (matchingSegments.length / context.customer_segments.length)
        matched.push(`segments:${matchingSegments.length}/${context.customer_segments.length}`)
      } else {
        score -= 10
        unmatched.push('customer_segments')
      }
    }

    // Channel matching (weight: 15)
    if (scope.channels) {
      if (context.channel && scope.channels.includes(context.channel)) {
        score += 15
        matched.push(`channel:${context.channel}`)
      } else if (context.channel) {
        score -= 5
        unmatched.push('channel')
      }
    }

    return { score, matched, unmatched }
  }

  /**
   * Score time-based relevance
   */
  private scoreTimeRelevance(
    conditions: UniversalRule['conditions'],
    context: Context
  ): {
    score: number
    matched: string[]
    unmatched: string[]
  } {
    let score = 0
    const matched: string[] = []
    const unmatched: string[] = []
    const now = context.now || new Date()

    // Effective date range
    if (conditions.effective_from) {
      const effectiveFrom = new Date(conditions.effective_from)
      if (now >= effectiveFrom) {
        score += 10
        matched.push('effective_from')
      } else {
        score -= 100 // Future rule, not applicable
        unmatched.push('effective_from')
      }
    }

    if (conditions.effective_to) {
      const effectiveTo = new Date(conditions.effective_to)
      if (now <= effectiveTo) {
        score += 10
        matched.push('effective_to')
      } else {
        score -= 100 // Expired rule, not applicable
        unmatched.push('effective_to')
      }
    }

    // Day of week matching
    if (conditions.days_of_week) {
      const currentDay = now.getDay()
      if (conditions.days_of_week.includes(currentDay)) {
        score += 15
        matched.push(`day_of_week:${currentDay}`)
      } else {
        score -= 50
        unmatched.push('day_of_week')
      }
    }

    // Time window matching
    if (conditions.time_windows && conditions.time_windows.length > 0) {
      const currentTime = now.toTimeString().substring(0, 5)
      const inWindow = conditions.time_windows.some(window =>
        this.isTimeInWindow(currentTime, window.start_time, window.end_time)
      )
      if (inWindow) {
        score += 20
        matched.push(`time_window:${currentTime}`)
      } else {
        score -= 40
        unmatched.push('time_window')
      }
    }

    return { score, matched, unmatched }
  }

  /**
   * Score business-specific conditions
   */
  private scoreBusinessConditions(
    conditions: UniversalRule['conditions'],
    context: Context
  ): {
    score: number
    matched: string[]
    unmatched: string[]
  } {
    let score = 0
    const matched: string[] = []
    const unmatched: string[] = []

    // Utilization threshold
    if (conditions.utilization_below !== undefined && context.utilization !== undefined) {
      if (context.utilization < conditions.utilization_below) {
        score += 25
        matched.push(`utilization:${context.utilization}<${conditions.utilization_below}`)
      } else {
        score -= 30
        unmatched.push('utilization_below')
      }
    }

    // Minimum lead time
    if (conditions.min_lead_minutes !== undefined && context.appointment_time) {
      const appointmentTime = new Date(context.appointment_time)
      const now = context.now || new Date()
      const leadMinutes = (appointmentTime.getTime() - now.getTime()) / (1000 * 60)

      if (leadMinutes >= conditions.min_lead_minutes) {
        score += 20
        matched.push(`lead_time:${Math.round(leadMinutes)}min`)
      } else {
        score -= 40
        unmatched.push('min_lead_minutes')
      }
    }

    // Custom condition handlers by family
    const familyConditions = this.scoreCustomConditions(conditions, context)
    score += familyConditions.score
    matched.push(...familyConditions.matched)
    unmatched.push(...familyConditions.unmatched)

    return { score, matched, unmatched }
  }

  /**
   * Score custom family-specific conditions
   */
  private scoreCustomConditions(
    conditions: any,
    context: Context
  ): {
    score: number
    matched: string[]
    unmatched: string[]
  } {
    let score = 0
    const matched: string[] = []
    const unmatched: string[] = []

    // Add family-specific condition scoring here
    // Example: Booking-specific conditions
    if (conditions.max_advance_days && context.appointment_time) {
      const appointmentTime = new Date(context.appointment_time)
      const now = context.now || new Date()
      const advanceDays = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

      if (advanceDays <= conditions.max_advance_days) {
        score += 15
        matched.push(`advance_days:${Math.round(advanceDays)}`)
      } else {
        score -= 20
        unmatched.push('max_advance_days')
      }
    }

    // Example: Pricing conditions
    if (conditions.min_order_value && context.order_value) {
      if (context.order_value >= conditions.min_order_value) {
        score += 30
        matched.push(`order_value:${context.order_value}>=${conditions.min_order_value}`)
      } else {
        score -= 25
        unmatched.push('min_order_value')
      }
    }

    return { score, matched, unmatched }
  }

  /**
   * Check if time is within window (handles cross-midnight windows)
   */
  private isTimeInWindow(currentTime: string, startTime: string, endTime: string): boolean {
    if (startTime <= endTime) {
      // Normal window (e.g., 09:00-17:00)
      return currentTime >= startTime && currentTime <= endTime
    } else {
      // Cross-midnight window (e.g., 22:00-02:00)
      return currentTime >= startTime || currentTime <= endTime
    }
  }

  /**
   * Merge multiple rules based on family logic
   */
  mergeRules(rules: UniversalRule[], family: string): UniversalRule[] {
    if (rules.length <= 1) return rules

    const familyPrefix = family.split('.').slice(0, 5).join('.')

    switch (familyPrefix) {
      case 'HERA.UNIV.CONFIG.PRICING.DISCOUNT':
        // Stack all discounts
        return this.stackDiscounts(rules)

      case 'HERA.UNIV.CONFIG.NOTIFICATION.SMS':
      case 'HERA.UNIV.CONFIG.NOTIFICATION.EMAIL':
        // Merge notification templates
        return this.mergeNotifications(rules)

      case 'HERA.UNIV.CONFIG.UI.EXPERIMENT':
        // A/B test rules - pick based on hash
        return this.selectExperiment(rules)

      default:
        // Default: highest priority wins
        return [rules[0]]
    }
  }

  /**
   * Stack multiple discount rules
   */
  private stackDiscounts(rules: UniversalRule[]): UniversalRule[] {
    if (rules.length === 1) return rules

    // Create merged rule with stacked discounts
    const mergedRule: UniversalRule = {
      ...rules[0],
      rule_id: 'merged_discount',
      payload: {
        stacked_discounts: rules.map(r => ({
          rule_id: r.rule_id,
          ...r.payload
        }))
      }
    }

    return [mergedRule]
  }

  /**
   * Merge notification templates
   */
  private mergeNotifications(rules: UniversalRule[]): UniversalRule[] {
    if (rules.length === 1) return rules

    // Combine all templates
    const templates: any[] = []
    for (const rule of rules) {
      if (rule.payload.templates) {
        templates.push(...rule.payload.templates)
      }
    }

    const mergedRule: UniversalRule = {
      ...rules[0],
      rule_id: 'merged_notifications',
      payload: {
        ...rules[0].payload,
        templates
      }
    }

    return [mergedRule]
  }

  /**
   * Select experiment variant based on context hash
   */
  private selectExperiment(rules: UniversalRule[]): UniversalRule[] {
    // Use customer ID or session ID for consistent assignment
    const experimentKey = rules[0].payload.experiment_key || 'default'
    const hashInput = `${experimentKey}:${rules[0].scope.organization_id}`
    const hash = this.simpleHash(hashInput)

    // Distribute based on rule weights
    let totalWeight = 0
    for (const rule of rules) {
      totalWeight += rule.payload.weight || 1
    }

    const position = (hash % totalWeight) / totalWeight
    let cumulative = 0

    for (const rule of rules) {
      const weight = (rule.payload.weight || 1) / totalWeight
      cumulative += weight
      if (position <= cumulative) {
        return [rule]
      }
    }

    return [rules[0]] // Fallback
  }

  /**
   * Simple hash function for consistent distribution
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

// Export singleton instance
export const ruleResolver = new RuleResolver()
