import fs from 'fs/promises'
import path from 'path'

// Claude Autopilot Learning Utilities
export interface LearningPattern {
  id: string
  name: string
  category: 'typescript' | 'api' | 'database' | 'security' | 'performance' | 'business_logic'
  pattern: string | RegExp
  frequency: number
  success_rate: number
  typical_fix: string
  prevention: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  first_seen: string
  last_seen: string
  examples: Array<{
    test_name: string
    error_message: string
    fix_applied: string
    success: boolean
    timestamp: string
  }>
}

export interface LearningSession {
  session_id: string
  started_at: string
  completed_at?: string
  trigger: 'test_failure' | 'scheduled_analysis' | 'manual_trigger'
  patterns_discovered: string[]
  fixes_attempted: number
  fixes_successful: number
  knowledge_updates: number
  performance_metrics: {
    avg_fix_time: number
    total_test_time: number
    success_rate: number
  }
}

export interface KnowledgeBase {
  version: string
  created: string
  last_updated: string
  entries: {
    common_patterns: { [key: string]: LearningPattern }
    successful_fixes: Array<{
      timestamp: string
      pattern_id: string
      test_name: string
      fix_description: string
      files_changed: string[]
      validation_passed: boolean
    }>
    failed_fixes: Array<{
      timestamp: string
      pattern_id: string
      test_name: string
      attempted_fix: string
      failure_reason: string
      requires_manual_intervention: boolean
    }>
  }
  metrics: {
    total_fixes_applied: number
    successful_fixes: number
    overall_success_rate: number
    patterns_learned: number
    last_learning_session: string
    knowledge_base_size: number
  }
}

export class ClaudeLearningManager {
  private knowledgeBasePath: string
  private learningDir: string
  private currentSession: LearningSession | null = null

  constructor(baseDir: string = '.claude/learning') {
    this.learningDir = baseDir
    this.knowledgeBasePath = path.join(baseDir, 'knowledge-base.json')
  }

  async initializeLearning(): Promise<void> {
    // Ensure learning directory exists
    await fs.mkdir(this.learningDir, { recursive: true })
    await fs.mkdir(path.join(this.learningDir, 'sessions'), { recursive: true })
    await fs.mkdir(path.join(this.learningDir, 'patterns'), { recursive: true })
    await fs.mkdir(path.join(this.learningDir, 'fixes'), { recursive: true })

    // Initialize knowledge base if it doesn't exist
    try {
      await fs.access(this.knowledgeBasePath)
    } catch {
      await this.createEmptyKnowledgeBase()
    }
  }

  private async createEmptyKnowledgeBase(): Promise<void> {
    const emptyKB: KnowledgeBase = {
      version: '1.0',
      created: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      entries: {
        common_patterns: {},
        successful_fixes: [],
        failed_fixes: []
      },
      metrics: {
        total_fixes_applied: 0,
        successful_fixes: 0,
        overall_success_rate: 0,
        patterns_learned: 0,
        last_learning_session: '',
        knowledge_base_size: 0
      }
    }

    await fs.writeFile(this.knowledgeBasePath, JSON.stringify(emptyKB, null, 2))
  }

  async loadKnowledgeBase(): Promise<KnowledgeBase> {
    try {
      const data = await fs.readFile(this.knowledgeBasePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.warn('Failed to load knowledge base, creating new one:', error)
      await this.createEmptyKnowledgeBase()
      return this.loadKnowledgeBase()
    }
  }

  async saveKnowledgeBase(kb: KnowledgeBase): Promise<void> {
    kb.last_updated = new Date().toISOString()
    kb.metrics.knowledge_base_size = JSON.stringify(kb).length
    await fs.writeFile(this.knowledgeBasePath, JSON.stringify(kb, null, 2))
  }

  async startLearningSession(trigger: LearningSession['trigger']): Promise<string> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    this.currentSession = {
      session_id: sessionId,
      started_at: new Date().toISOString(),
      trigger,
      patterns_discovered: [],
      fixes_attempted: 0,
      fixes_successful: 0,
      knowledge_updates: 0,
      performance_metrics: {
        avg_fix_time: 0,
        total_test_time: 0,
        success_rate: 0
      }
    }

    // Save session metadata
    const sessionPath = path.join(this.learningDir, 'sessions', `${sessionId}.json`)
    await fs.writeFile(sessionPath, JSON.stringify(this.currentSession, null, 2))

    return sessionId
  }

  async endLearningSession(): Promise<void> {
    if (!this.currentSession) return

    this.currentSession.completed_at = new Date().toISOString()
    this.currentSession.performance_metrics.success_rate = 
      this.currentSession.fixes_attempted > 0 
        ? this.currentSession.fixes_successful / this.currentSession.fixes_attempted 
        : 0

    // Save final session data
    const sessionPath = path.join(this.learningDir, 'sessions', `${this.currentSession.session_id}.json`)
    await fs.writeFile(sessionPath, JSON.stringify(this.currentSession, null, 2))

    this.currentSession = null
  }

  async analyzeFailure(testName: string, errorMessage: string, stackTrace: string): Promise<{
    matchedPatterns: LearningPattern[]
    recommendedFixes: string[]
    confidence: number
  }> {
    const kb = await this.loadKnowledgeBase()
    const matchedPatterns: LearningPattern[] = []
    const recommendedFixes: string[] = []

    // Check against known patterns
    for (const [id, pattern] of Object.entries(kb.entries.common_patterns)) {
      const matches = this.patternMatches(pattern, errorMessage, stackTrace)
      if (matches) {
        matchedPatterns.push(pattern)
        recommendedFixes.push(pattern.typical_fix)
      }
    }

    // Calculate confidence based on pattern frequency and success rate
    const confidence = matchedPatterns.length > 0
      ? matchedPatterns.reduce((sum, p) => sum + p.success_rate, 0) / matchedPatterns.length
      : 0

    return { matchedPatterns, recommendedFixes, confidence }
  }

  private patternMatches(pattern: LearningPattern, errorMessage: string, stackTrace: string): boolean {
    const text = `${errorMessage} ${stackTrace}`.toLowerCase()
    
    if (pattern.pattern instanceof RegExp) {
      return pattern.pattern.test(text)
    } else if (typeof pattern.pattern === 'string') {
      return text.includes(pattern.pattern.toLowerCase())
    }
    
    return false
  }

  async recordSuccessfulFix(
    testName: string,
    patternId: string,
    fixDescription: string,
    filesChanged: string[],
    fixTime: number
  ): Promise<void> {
    const kb = await this.loadKnowledgeBase()

    // Record successful fix
    kb.entries.successful_fixes.push({
      timestamp: new Date().toISOString(),
      pattern_id: patternId,
      test_name: testName,
      fix_description: fixDescription,
      files_changed: filesChanged,
      validation_passed: true
    })

    // Update pattern success rate
    if (kb.entries.common_patterns[patternId]) {
      const pattern = kb.entries.common_patterns[patternId]
      const newTotal = pattern.frequency + 1
      const newSuccessful = Math.round(pattern.success_rate * pattern.frequency) + 1
      
      pattern.frequency = newTotal
      pattern.success_rate = newSuccessful / newTotal
      pattern.last_seen = new Date().toISOString()

      // Add example
      pattern.examples.push({
        test_name: testName,
        error_message: '', // Could be filled from context
        fix_applied: fixDescription,
        success: true,
        timestamp: new Date().toISOString()
      })

      // Keep only last 10 examples
      if (pattern.examples.length > 10) {
        pattern.examples = pattern.examples.slice(-10)
      }
    }

    // Update metrics
    kb.metrics.total_fixes_applied++
    kb.metrics.successful_fixes++
    kb.metrics.overall_success_rate = kb.metrics.successful_fixes / kb.metrics.total_fixes_applied

    // Update session
    if (this.currentSession) {
      this.currentSession.fixes_attempted++
      this.currentSession.fixes_successful++
      this.currentSession.knowledge_updates++
      
      // Update average fix time
      const totalTime = this.currentSession.performance_metrics.avg_fix_time * (this.currentSession.fixes_attempted - 1) + fixTime
      this.currentSession.performance_metrics.avg_fix_time = totalTime / this.currentSession.fixes_attempted
    }

    await this.saveKnowledgeBase(kb)
  }

  async recordFailedFix(
    testName: string,
    patternId: string,
    attemptedFix: string,
    failureReason: string,
    requiresManualIntervention: boolean = false
  ): Promise<void> {
    const kb = await this.loadKnowledgeBase()

    // Record failed fix
    kb.entries.failed_fixes.push({
      timestamp: new Date().toISOString(),
      pattern_id: patternId,
      test_name: testName,
      attempted_fix: attemptedFix,
      failure_reason: failureReason,
      requires_manual_intervention: requiresManualIntervention
    })

    // Update pattern (increase frequency but don't improve success rate)
    if (kb.entries.common_patterns[patternId]) {
      const pattern = kb.entries.common_patterns[patternId]
      const newTotal = pattern.frequency + 1
      const successfulCount = Math.round(pattern.success_rate * pattern.frequency)
      
      pattern.frequency = newTotal
      pattern.success_rate = successfulCount / newTotal // This will decrease
      pattern.last_seen = new Date().toISOString()

      // Add failed example
      pattern.examples.push({
        test_name: testName,
        error_message: failureReason,
        fix_applied: attemptedFix,
        success: false,
        timestamp: new Date().toISOString()
      })

      if (pattern.examples.length > 10) {
        pattern.examples = pattern.examples.slice(-10)
      }
    }

    // Update metrics
    kb.metrics.total_fixes_applied++
    kb.metrics.overall_success_rate = kb.metrics.successful_fixes / kb.metrics.total_fixes_applied

    // Update session
    if (this.currentSession) {
      this.currentSession.fixes_attempted++
    }

    await this.saveKnowledgeBase(kb)
  }

  async discoverNewPattern(
    name: string,
    category: LearningPattern['category'],
    pattern: string | RegExp,
    typicalFix: string,
    prevention: string,
    severity: LearningPattern['severity'] = 'MEDIUM'
  ): Promise<string> {
    const kb = await this.loadKnowledgeBase()
    const patternId = `pattern_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`

    const newPattern: LearningPattern = {
      id: patternId,
      name,
      category,
      pattern,
      frequency: 1,
      success_rate: 0, // Will be updated as fixes are applied
      typical_fix: typicalFix,
      prevention,
      severity,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      examples: []
    }

    kb.entries.common_patterns[patternId] = newPattern
    kb.metrics.patterns_learned++

    // Update session
    if (this.currentSession) {
      this.currentSession.patterns_discovered.push(patternId)
      this.currentSession.knowledge_updates++
    }

    await this.saveKnowledgeBase(kb)
    return patternId
  }

  async getRecommendations(): Promise<Array<{
    type: 'fix' | 'prevention' | 'investigation'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    description: string
    action: string
  }>> {
    const kb = await this.loadKnowledgeBase()
    const recommendations: any[] = []

    // Analyze failure patterns
    const failedFixes = kb.entries.failed_fixes.slice(-10) // Last 10 failures
    const criticalPatterns = Object.values(kb.entries.common_patterns)
      .filter(p => p.severity === 'CRITICAL' && p.success_rate < 0.8)

    // Recommendations for critical patterns with low success rates
    for (const pattern of criticalPatterns) {
      recommendations.push({
        type: 'investigation',
        priority: 'CRITICAL',
        description: `Critical pattern "${pattern.name}" has low success rate (${(pattern.success_rate * 100).toFixed(1)}%)`,
        action: `Review and improve fix strategy for: ${pattern.typical_fix}`
      })
    }

    // Recommendations for frequent failures
    const frequentFailures = failedFixes
      .filter(f => f.requires_manual_intervention)
      .reduce((acc, f) => {
        acc[f.pattern_id] = (acc[f.pattern_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    for (const [patternId, count] of Object.entries(frequentFailures)) {
      if (count >= 3) {
        const pattern = kb.entries.common_patterns[patternId]
        if (pattern) {
          recommendations.push({
            type: 'fix',
            priority: 'HIGH',
            description: `Pattern "${pattern.name}" failing frequently (${count} recent failures)`,
            action: `Manual review required: ${pattern.typical_fix}`
          })
        }
      }
    }

    // Recommendations for low overall success rate
    if (kb.metrics.overall_success_rate < 0.7 && kb.metrics.total_fixes_applied > 5) {
      recommendations.push({
        type: 'investigation',
        priority: 'HIGH',
        description: `Overall fix success rate is low (${(kb.metrics.overall_success_rate * 100).toFixed(1)}%)`,
        action: 'Review fix strategies and consider improving pattern matching'
      })
    }

    // Prevention recommendations
    const patterns = Object.values(kb.entries.common_patterns)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3)

    for (const pattern of patterns) {
      recommendations.push({
        type: 'prevention',
        priority: 'MEDIUM',
        description: `Frequent pattern: "${pattern.name}" (${pattern.frequency} occurrences)`,
        action: pattern.prevention
      })
    }

    return recommendations.sort((a, b) => {
      const priorities = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
      return priorities[b.priority] - priorities[a.priority]
    })
  }

  async exportLearningReport(): Promise<{
    summary: {
      session_id: string | null
      knowledge_base_metrics: KnowledgeBase['metrics']
      recent_activity: {
        successful_fixes_last_24h: number
        failed_fixes_last_24h: number
        new_patterns_last_7d: number
      }
    }
    top_patterns: Array<{
      name: string
      frequency: number
      success_rate: number
      severity: string
    }>
    recommendations: Awaited<ReturnType<typeof this.getRecommendations>>
    learning_effectiveness: {
      pattern_diversity: number
      knowledge_growth_rate: number
      fix_accuracy_trend: number
    }
  }> {
    const kb = await this.loadKnowledgeBase()
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Calculate recent activity
    const successfulFixesLast24h = kb.entries.successful_fixes
      .filter(f => new Date(f.timestamp) > yesterday).length
    
    const failedFixesLast24h = kb.entries.failed_fixes
      .filter(f => new Date(f.timestamp) > yesterday).length

    const newPatternsLast7d = Object.values(kb.entries.common_patterns)
      .filter(p => new Date(p.first_seen) > lastWeek).length

    // Top patterns by frequency
    const topPatterns = Object.values(kb.entries.common_patterns)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        frequency: p.frequency,
        success_rate: p.success_rate,
        severity: p.severity
      }))

    // Learning effectiveness metrics
    const patternDiversity = Object.keys(kb.entries.common_patterns).length
    const knowledgeGrowthRate = newPatternsLast7d / 7 // patterns per day
    
    // Calculate fix accuracy trend (simplified)
    const recentFixes = [...kb.entries.successful_fixes, ...kb.entries.failed_fixes]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
    
    const recentSuccessRate = recentFixes.length > 0
      ? recentFixes.filter(f => 'validation_passed' in f && f.validation_passed).length / recentFixes.length
      : 0

    const fixAccuracyTrend = recentSuccessRate - kb.metrics.overall_success_rate

    const recommendations = await this.getRecommendations()

    return {
      summary: {
        session_id: this.currentSession?.session_id || null,
        knowledge_base_metrics: kb.metrics,
        recent_activity: {
          successful_fixes_last_24h: successfulFixesLast24h,
          failed_fixes_last_24h: failedFixesLast24h,
          new_patterns_last_7d: newPatternsLast7d
        }
      },
      top_patterns: topPatterns,
      recommendations,
      learning_effectiveness: {
        pattern_diversity: patternDiversity,
        knowledge_growth_rate: knowledgeGrowthRate,
        fix_accuracy_trend: fixAccuracyTrend
      }
    }
  }
}

// Export singleton instance
export const claudeLearning = new ClaudeLearningManager()