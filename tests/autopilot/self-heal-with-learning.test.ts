import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

// Enhanced self-healing test framework with auto-learning capabilities
describe('Claude Autopilot - Self-Healing with Learning', () => {
  const MAX_HEALING_ATTEMPTS = 5
  const KNOWLEDGE_BASE_PATH = '.claude/learning/knowledge-base.json'
  const LEARNING_DIR = '.claude/learning'
  
  let healingAttempt = 0
  let learningSession: LearningSession

  interface TestFailure {
    test: string
    error: string
    stackTrace: string
    failureType: string
    currentCode?: string
  }

  interface TestResult {
    passed: boolean
    failures: TestFailure[]
    duration: number
    coverage?: number
  }

  interface LearningSession {
    sessionId: string
    startTime: Date
    failures: TestFailure[]
    fixes: FixAttempt[]
    patterns: string[]
    successRate: number
  }

  interface FixAttempt {
    attempt: number
    pattern: string
    strategy: string
    success: boolean
    duration: number
    changes: FileChange[]
  }

  interface FileChange {
    type: 'create' | 'update' | 'delete'
    path: string
    content?: string
    reason: string
  }

  beforeAll(async () => {
    // Initialize learning session
    learningSession = {
      sessionId: `session-${Date.now()}`,
      startTime: new Date(),
      failures: [],
      fixes: [],
      patterns: [],
      successRate: 0
    }

    // Ensure learning directory exists
    await fs.mkdir(LEARNING_DIR, { recursive: true })
    
    console.log(`🧠 Starting learning session: ${learningSession.sessionId}`)
  })

  afterEach(async () => {
    // Learn from success if test passed
    if (healingAttempt === 0) {
      await learnFromSuccess()
    }
  })

  async function runTestSuite(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const output = execSync('npm run test:enterprise', { 
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 300000 // 5 minutes
      })
      
      return {
        passed: true,
        failures: [],
        duration: Date.now() - startTime,
        coverage: extractCoverage(output)
      }
    } catch (error: any) {
      const output = error.stdout?.toString() || error.message
      return {
        passed: false,
        failures: parseFailures(output),
        duration: Date.now() - startTime
      }
    }
  }

  function parseFailures(output: string): TestFailure[] {
    const failures: TestFailure[] = []
    const lines = output.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      if (line.includes('FAIL') || line.includes('ERROR')) {
        const failure: TestFailure = {
          test: extractTestName(line),
          error: extractError(lines, i),
          stackTrace: extractStackTrace(lines, i),
          failureType: categorizeFailure(line)
        }
        
        failures.push(failure)
      }
    }
    
    return failures
  }

  function extractTestName(line: string): string {
    const match = line.match(/FAIL\\s+(.+?)\\s+/) || line.match(/ERROR\\s+(.+?)\\s+/)
    return match ? match[1] : 'Unknown test'
  }

  function extractError(lines: string[], startIndex: number): string {
    for (let i = startIndex; i < Math.min(startIndex + 10, lines.length); i++) {
      if (lines[i].includes('Error:') || lines[i].includes('Expected:')) {
        return lines[i].trim()
      }
    }
    return 'Unknown error'
  }

  function extractStackTrace(lines: string[], startIndex: number): string {
    const trace: string[] = []
    for (let i = startIndex; i < Math.min(startIndex + 15, lines.length); i++) {
      const line = lines[i].trim()
      if (line.startsWith('at ') || line.includes('.ts:') || line.includes('.js:')) {
        trace.push(line)
      }
      if (trace.length >= 5) break
    }
    return trace.join('\\n')
  }

  function categorizeFailure(line: string): string {
    if (line.includes('import') || line.includes('module')) return 'import_error'
    if (line.includes('type') || line.includes('TypeScript')) return 'type_error'
    if (line.includes('API') || line.includes('fetch')) return 'api_error'
    if (line.includes('database') || line.includes('SQL')) return 'database_error'
    if (line.includes('actor') || line.includes('auth')) return 'security_error'
    if (line.includes('balance') || line.includes('GL')) return 'business_logic_error'
    return 'unknown_error'
  }

  function extractCoverage(output: string): number {
    const match = output.match(/All files[\\s\\S]*?(\\d+\\.\\d+)%/)
    return match ? parseFloat(match[1]) : 0
  }

  async function loadKnowledgeBase(): Promise<any> {
    try {
      const data = await fs.readFile(KNOWLEDGE_BASE_PATH, 'utf-8')
      return JSON.parse(data)
    } catch {
      return { entries: { common_patterns: {} }, metrics: {} }
    }
  }

  async function analyzeFailuresWithKnowledge(failures: TestFailure[]): Promise<string[]> {
    const knowledgeBase = await loadKnowledgeBase()
    const patterns: string[] = []
    
    for (const failure of failures) {
      for (const [patternName, pattern] of Object.entries(knowledgeBase.entries?.common_patterns || {})) {
        const regex = new RegExp((pattern as any).pattern, 'i')
        if (regex.test(failure.error) || regex.test(failure.stackTrace)) {
          patterns.push(patternName)
          console.log(`🎯 Matched known pattern: ${patternName} (success rate: ${((pattern as any).success_rate * 100).toFixed(1)}%)`)
        }
      }
    }
    
    return patterns
  }

  async function healFailures(failures: TestFailure[]): Promise<boolean> {
    console.log(`🔧 Healing ${failures.length} failures (attempt ${healingAttempt + 1}/${MAX_HEALING_ATTEMPTS})`)
    
    // Analyze failures using knowledge base
    const matchedPatterns = await analyzeFailuresWithKnowledge(failures)
    learningSession.patterns.push(...matchedPatterns)
    
    // Prepare failure information for Claude
    const failureInfo = {
      failures,
      patterns: matchedPatterns,
      attempt: healingAttempt + 1,
      sessionId: learningSession.sessionId
    }
    
    const failureFile = path.join(LEARNING_DIR, `failure-${Date.now()}.json`)
    await fs.writeFile(failureFile, JSON.stringify(failureInfo, null, 2))
    
    try {
      // Call the enhanced healing script with learning
      const startTime = Date.now()
      execSync(`./scripts/claude-fix-with-learning.sh ${failureFile}`, { 
        stdio: 'inherit',
        timeout: 600000 // 10 minutes
      })
      
      const fixAttempt: FixAttempt = {
        attempt: healingAttempt + 1,
        pattern: matchedPatterns.join(', ') || 'unknown',
        strategy: 'claude_autopilot_with_learning',
        success: true,
        duration: Date.now() - startTime,
        changes: [] // Would be populated by the fix script
      }
      
      learningSession.fixes.push(fixAttempt)
      
      console.log(`✅ Fix attempt ${healingAttempt + 1} completed in ${fixAttempt.duration}ms`)
      return true
      
    } catch (error) {
      console.error(`❌ Fix attempt ${healingAttempt + 1} failed:`, error)
      
      const fixAttempt: FixAttempt = {
        attempt: healingAttempt + 1,
        pattern: matchedPatterns.join(', ') || 'unknown',
        strategy: 'claude_autopilot_with_learning',
        success: false,
        duration: Date.now() - startTime,
        changes: []
      }
      
      learningSession.fixes.push(fixAttempt)
      return false
    }
  }

  async function learnFromSuccess(): Promise<void> {
    console.log('🎓 Learning from successful test run...')
    
    try {
      execSync('./scripts/claude-learn-from-success.sh', { 
        stdio: 'inherit',
        timeout: 30000 // 30 seconds
      })
    } catch (error) {
      console.warn('Warning: Could not complete success learning:', error)
    }
  }

  async function updateLearningMetrics(): Promise<void> {
    const successfulFixes = learningSession.fixes.filter(f => f.success)
    learningSession.successRate = successfulFixes.length / Math.max(learningSession.fixes.length, 1)
    
    // Save learning session
    const sessionFile = path.join(LEARNING_DIR, `session-${learningSession.sessionId}.json`)
    await fs.writeFile(sessionFile, JSON.stringify(learningSession, null, 2))
    
    console.log(`📊 Learning Session Summary:`)
    console.log(`  • Session ID: ${learningSession.sessionId}`)
    console.log(`  • Failures encountered: ${learningSession.failures.length}`)
    console.log(`  • Fix attempts: ${learningSession.fixes.length}`)
    console.log(`  • Success rate: ${(learningSession.successRate * 100).toFixed(1)}%`)
    console.log(`  • Patterns learned: ${[...new Set(learningSession.patterns)].length}`)
  }

  it('should self-heal all test failures with continuous learning', async () => {
    let result = await runTestSuite()
    learningSession.failures = result.failures
    
    while (!result.passed && healingAttempt < MAX_HEALING_ATTEMPTS) {
      healingAttempt++
      console.log(`\\n🔄 Healing attempt ${healingAttempt}/${MAX_HEALING_ATTEMPTS}`)
      
      const healSuccess = await healFailures(result.failures)
      if (!healSuccess) {
        console.warn(`⚠️ Healing attempt ${healingAttempt} did not complete successfully`)
      }
      
      // Re-run tests to check if healing worked
      result = await runTestSuite()
      
      if (result.passed) {
        console.log(`✅ Tests passed after ${healingAttempt} healing attempts!`)
        await learnFromSuccess()
        break
      }
    }
    
    // Update learning metrics regardless of outcome
    await updateLearningMetrics()
    
    // Assertions
    expect(result.passed).toBe(true)
    expect(healingAttempt).toBeLessThan(MAX_HEALING_ATTEMPTS)
    
    // Learning assertions
    expect(learningSession.sessionId).toBeDefined()
    expect(learningSession.fixes.length).toBeGreaterThan(0)
    
    // If we had to heal, ensure we learned something
    if (healingAttempt > 0) {
      expect(learningSession.patterns.length).toBeGreaterThan(0)
    }
    
  }, 1800000) // 30 minute timeout for complex healing scenarios

  it('should maintain knowledge base integrity', async () => {
    const knowledgeBase = await loadKnowledgeBase()
    
    // Verify knowledge base structure
    expect(knowledgeBase).toHaveProperty('entries')
    expect(knowledgeBase).toHaveProperty('metrics')
    expect(knowledgeBase.entries).toHaveProperty('common_patterns')
    
    // Verify pattern quality
    for (const [name, pattern] of Object.entries(knowledgeBase.entries.common_patterns)) {
      expect((pattern as any).frequency).toBeGreaterThan(0)
      expect((pattern as any).success_rate).toBeGreaterThanOrEqual(0)
      expect((pattern as any).success_rate).toBeLessThanOrEqual(1)
      expect((pattern as any).pattern).toBeDefined()
      expect((pattern as any).typical_fix).toBeDefined()
    }
  })

  it('should improve success rate over time', async () => {
    const knowledgeBase = await loadKnowledgeBase()
    const totalFixes = knowledgeBase.metrics?.total_fixes_applied || 0
    const successRate = knowledgeBase.metrics?.overall_success_rate || 0
    
    // If we have historical data, success rate should be reasonable
    if (totalFixes > 5) {
      expect(successRate).toBeGreaterThan(0.5) // At least 50% success rate
    }
    
    // Knowledge base should contain useful patterns
    const patternCount = Object.keys(knowledgeBase.entries?.common_patterns || {}).length
    expect(patternCount).toBeGreaterThan(0)
  })
})