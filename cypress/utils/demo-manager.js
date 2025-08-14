// HERA Demo Environment Manager
// Manages demo data lifecycle, environment configuration, and monitoring

export class DemoManager {
  constructor() {
    this.scenarios = new Map()
    this.dataGenerated = new Map()
    this.executionMetrics = new Map()
  }
  
  // **Environment Management**
  
  initializeDemoEnvironment(config = {}) {
    const defaultConfig = {
      environment: 'demo',
      persistData: true,
      cleanupStrategy: 'selective',
      monitoringEnabled: true,
      screenshotCapture: true,
      performanceTracking: true
    }
    
    this.config = { ...defaultConfig, ...config }
    
    console.log('🚀 HERA Demo Environment Initialized', this.config)
    
    return this.config
  }
  
  // **Scenario Management**
  
  registerScenario(name, config) {
    this.scenarios.set(name, {
      name,
      config,
      status: 'registered',
      createdAt: new Date().toISOString(),
      dataGenerated: [],
      metrics: {}
    })
    
    console.log(`📋 Registered demo scenario: ${name}`)
    return this.scenarios.get(name)
  }
  
  executeScenario(name) {
    const scenario = this.scenarios.get(name)
    if (!scenario) {
      throw new Error(`Scenario '${name}' not found`)
    }
    
    scenario.status = 'executing'
    scenario.startTime = Date.now()
    
    console.log(`▶️ Executing demo scenario: ${name}`)
    return scenario
  }
  
  completeScenario(name, results = {}) {
    const scenario = this.scenarios.get(name)
    if (!scenario) {
      throw new Error(`Scenario '${name}' not found`)
    }
    
    scenario.status = 'completed'
    scenario.endTime = Date.now()
    scenario.duration = scenario.endTime - scenario.startTime
    scenario.results = results
    
    console.log(`✅ Completed demo scenario: ${name} (${scenario.duration}ms)`)
    
    this.recordMetrics(name, scenario)
    return scenario
  }
  
  // **Data Management**
  
  trackDataGeneration(scenario, dataType, data) {
    if (!this.dataGenerated.has(scenario)) {
      this.dataGenerated.set(scenario, [])
    }
    
    const dataRecord = {
      type: dataType,
      data,
      createdAt: new Date().toISOString(),
      scenario
    }
    
    this.dataGenerated.get(scenario).push(dataRecord)
    
    console.log(`📊 Data generated: ${dataType} for scenario ${scenario}`)
    return dataRecord
  }
  
  getGeneratedData(scenario = null) {
    if (scenario) {
      return this.dataGenerated.get(scenario) || []
    }
    
    // Return all data across scenarios
    const allData = []
    for (const [scenarioName, data] of this.dataGenerated) {
      allData.push({ scenario: scenarioName, data })
    }
    return allData
  }
  
  // **Performance Monitoring**
  
  recordMetrics(scenario, metrics) {
    this.executionMetrics.set(scenario, {
      ...metrics,
      recordedAt: new Date().toISOString()
    })
    
    console.log(`📈 Recorded metrics for scenario: ${scenario}`)
  }
  
  getPerformanceReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      scenarios: {},
      summary: {
        totalScenarios: this.scenarios.size,
        completedScenarios: 0,
        totalDataRecords: 0,
        averageDuration: 0
      }
    }
    
    let totalDuration = 0
    let completedCount = 0
    
    for (const [name, scenario] of this.scenarios) {
      report.scenarios[name] = {
        status: scenario.status,
        duration: scenario.duration || 0,
        dataGenerated: this.dataGenerated.get(name)?.length || 0,
        results: scenario.results || {}
      }
      
      if (scenario.status === 'completed') {
        completedCount++
        totalDuration += scenario.duration || 0
      }
      
      report.summary.totalDataRecords += this.dataGenerated.get(name)?.length || 0
    }
    
    report.summary.completedScenarios = completedCount
    report.summary.averageDuration = completedCount > 0 ? totalDuration / completedCount : 0
    
    return report
  }
  
  // **Data Cleanup**
  
  cleanupDemoData(strategy = 'selective') {
    console.log(`🧹 Starting demo data cleanup (${strategy})`)
    
    switch (strategy) {
      case 'all':
        this.dataGenerated.clear()
        this.scenarios.clear()
        this.executionMetrics.clear()
        break
        
      case 'selective':
        // Keep recent data, remove old data
        this.cleanupOldData(7) // Keep last 7 days
        break
        
      case 'scenarios_only':
        // Keep data but clear scenario configs
        this.scenarios.clear()
        break
        
      default:
        console.log('Unknown cleanup strategy, skipping cleanup')
    }
    
    console.log('✅ Demo data cleanup completed')
  }
  
  cleanupOldData(daysToKeep = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    for (const [scenario, dataArray] of this.dataGenerated) {
      const filteredData = dataArray.filter(record => 
        new Date(record.createdAt) > cutoffDate
      )
      this.dataGenerated.set(scenario, filteredData)
    }
  }
  
  // **Validation & Health Checks**
  
  validateDemoEnvironment() {
    const issues = []
    
    // Check scenario configurations
    for (const [name, scenario] of this.scenarios) {
      if (!scenario.config) {
        issues.push(`Scenario '${name}' missing configuration`)
      }
      
      if (scenario.status === 'executing' && 
          Date.now() - scenario.startTime > 300000) { // 5 minutes
        issues.push(`Scenario '${name}' has been executing for over 5 minutes`)
      }
    }
    
    // Check data integrity
    const totalDataRecords = Array.from(this.dataGenerated.values())
      .reduce((sum, arr) => sum + arr.length, 0)
    
    if (totalDataRecords === 0) {
      issues.push('No demo data has been generated')
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      checkedAt: new Date().toISOString()
    }
  }
  
  // **Export & Import**
  
  exportDemoConfiguration() {
    return {
      config: this.config,
      scenarios: Object.fromEntries(this.scenarios),
      dataGenerated: Object.fromEntries(this.dataGenerated),
      metrics: Object.fromEntries(this.executionMetrics),
      exportedAt: new Date().toISOString()
    }
  }
  
  importDemoConfiguration(exportedData) {
    this.config = exportedData.config || {}
    this.scenarios = new Map(Object.entries(exportedData.scenarios || {}))
    this.dataGenerated = new Map(Object.entries(exportedData.dataGenerated || {}))
    this.executionMetrics = new Map(Object.entries(exportedData.metrics || {}))
    
    console.log('📥 Demo configuration imported successfully')
  }
  
  // **Reporting**
  
  generateExecutionReport() {
    const report = {
      summary: this.getPerformanceReport().summary,
      scenarios: [],
      dataBreakdown: {},
      recommendations: []
    }
    
    // Scenario details
    for (const [name, scenario] of this.scenarios) {
      report.scenarios.push({
        name,
        status: scenario.status,
        duration: scenario.duration,
        dataGenerated: this.dataGenerated.get(name)?.length || 0,
        success: scenario.status === 'completed'
      })
    }
    
    // Data breakdown by type
    for (const [scenario, dataArray] of this.dataGenerated) {
      for (const record of dataArray) {
        if (!report.dataBreakdown[record.type]) {
          report.dataBreakdown[record.type] = 0
        }
        report.dataBreakdown[record.type]++
      }
    }
    
    // Performance recommendations
    const avgDuration = report.summary.averageDuration
    if (avgDuration > 30000) { // 30 seconds
      report.recommendations.push('Consider optimizing scenario execution time')
    }
    
    if (report.summary.totalDataRecords < 10) {
      report.recommendations.push('Generate more demo data for comprehensive testing')
    }
    
    return report
  }
}

// **Demo Utilities**

export const DemoUtils = {
  // Generate demo environment ID
  generateDemoId: () => {
    return `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Format demo data for display
  formatDemoData: (data) => {
    return {
      ...data,
      _metadata: {
        generatedAt: new Date().toISOString(),
        demoId: DemoUtils.generateDemoId(),
        type: 'demo_data'
      }
    }
  },
  
  // Create demo timeline
  createDemoTimeline: (scenarioName, steps) => {
    return {
      scenario: scenarioName,
      steps: steps.map((step, index) => ({
        step: index + 1,
        name: step,
        timestamp: new Date().toISOString(),
        status: 'pending'
      })),
      createdAt: new Date().toISOString()
    }
  },
  
  // Validate demo data structure
  validateDemoData: (data, schema) => {
    const errors = []
    
    if (schema.required) {
      for (const field of schema.required) {
        if (!data.hasOwnProperty(field)) {
          errors.push(`Missing required field: ${field}`)
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// **Global Demo Manager Instance**
export const globalDemoManager = new DemoManager()

// Cypress command integration
if (typeof Cypress !== 'undefined') {
  Cypress.Commands.add('initDemo', (config) => {
    return cy.wrap(globalDemoManager.initializeDemoEnvironment(config))
  })
  
  Cypress.Commands.add('registerDemoScenario', (name, config) => {
    return cy.wrap(globalDemoManager.registerScenario(name, config))
  })
  
  Cypress.Commands.add('executeDemoScenario', (name) => {
    return cy.wrap(globalDemoManager.executeScenario(name))
  })
  
  Cypress.Commands.add('completeDemoScenario', (name, results) => {
    return cy.wrap(globalDemoManager.completeScenario(name, results))
  })
  
  Cypress.Commands.add('trackDemoData', (scenario, type, data) => {
    return cy.wrap(globalDemoManager.trackDataGeneration(scenario, type, data))
  })
  
  Cypress.Commands.add('getDemoReport', () => {
    return cy.wrap(globalDemoManager.generateExecutionReport())
  })
}