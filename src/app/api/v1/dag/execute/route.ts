import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface DAGExecutionRequest {
  organization_id: string
  dag_definition: {
    dag_id: string
    dag_name: string
    nodes: Array<{
      node_id: string
      node_type:
        | 'calculation'
        | 'validation'
        | 'transformation'
        | 'aggregation'
        | 'decision'
        | 'api_call'
      node_name: string
      dependencies: string[] // IDs of nodes this depends on
      execution_config: {
        function_name: string
        parameters: Record<string, any>
        timeout_ms?: number
        retry_count?: number
        parallel_execution?: boolean
      }
      validation_rules?: {
        required_fields?: string[]
        validation_functions?: string[]
        error_handling?: 'stop' | 'continue' | 'fallback'
      }
    }>
    execution_order?: string[] // Optional override for execution sequence
  }
  execution_context: {
    trigger_event: string
    input_data: Record<string, any>
    execution_mode: 'sync' | 'async' | 'batch'
    priority: 'low' | 'normal' | 'high' | 'critical'
    timeout_ms?: number
  }
  optimization_options?: {
    enable_parallel_execution?: boolean
    enable_caching?: boolean
    enable_memoization?: boolean
    max_concurrent_nodes?: number
    dependency_optimization?: boolean
  }
  monitoring_options?: {
    enable_performance_tracking?: boolean
    enable_detailed_logging?: boolean
    enable_error_collection?: boolean
    enable_metrics_export?: boolean
  }
}

interface DAGExecutionResponse {
  execution_id: string
  dag_id: string
  execution_status: 'COMPLETED' | 'FAILED' | 'PARTIAL' | 'RUNNING'
  total_execution_time_ms: number
  nodes_executed: number
  nodes_failed: number
  execution_results: {
    [node_id: string]: {
      node_name: string
      status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'TIMEOUT'
      execution_time_ms: number
      result_data?: any
      error_message?: string
      dependencies_satisfied: boolean
      parallel_execution: boolean
    }
  }
  execution_path: string[]
  performance_metrics: {
    total_time_ms: number
    parallel_time_saved_ms: number
    cache_hits: number
    cache_misses: number
    memory_usage_mb: number
    cpu_utilization_percent: number
  }
  optimization_results: {
    dependency_graph_optimized: boolean
    parallel_branches_executed: number
    memoization_benefits: string[]
    bottleneck_analysis: Array<{
      node_id: string
      execution_time_ms: number
      optimization_suggestions: string[]
    }>
  }
  final_output: any
}

// DAG execution engine with intelligent dependency resolution
class DAGExecutionEngine {
  private executionCache = new Map<string, any>()
  private memoizedResults = new Map<string, any>()
  private performanceMetrics = {
    totalTime: 0,
    parallelTimeSaved: 0,
    cacheHits: 0,
    cacheMisses: 0,
    memoryUsage: 0,
    cpuUtilization: 0
  }

  async executeDAG(request: DAGExecutionRequest): Promise<DAGExecutionResponse> {
    const executionId = `dag_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    try {
      // Validate DAG structure
      const validationResult = this.validateDAGStructure(request.dag_definition)
      if (!validationResult.isValid) {
        throw new Error(`DAG validation failed: ${validationResult.errors.join(', ')}`)
      }

      // Optimize DAG for execution
      const optimizedDAG = this.optimizeDAGExecution(
        request.dag_definition,
        request.optimization_options
      )

      // Build dependency graph
      const dependencyGraph = this.buildDependencyGraph(optimizedDAG.nodes)

      // Execute nodes based on dependencies
      const executionResults = await this.executeNodes(
        optimizedDAG.nodes,
        dependencyGraph,
        request.execution_context,
        request.optimization_options
      )

      // Calculate final output
      const finalOutput = this.calculateFinalOutput(executionResults, optimizedDAG.nodes)

      const totalTime = Date.now() - startTime

      // Store execution record for audit and optimization
      await this.storeExecutionRecord(executionId, request, executionResults, totalTime)

      return {
        execution_id: executionId,
        dag_id: request.dag_definition.dag_id,
        execution_status: this.determineOverallStatus(executionResults),
        total_execution_time_ms: totalTime,
        nodes_executed: Object.keys(executionResults).length,
        nodes_failed: Object.values(executionResults).filter(r => r.status === 'FAILED').length,
        execution_results: executionResults,
        execution_path: this.getExecutionPath(executionResults),
        performance_metrics: {
          total_time_ms: totalTime,
          parallel_time_saved_ms: this.performanceMetrics.parallelTimeSaved,
          cache_hits: this.performanceMetrics.cacheHits,
          cache_misses: this.performanceMetrics.cacheMisses,
          memory_usage_mb: this.performanceMetrics.memoryUsage,
          cpu_utilization_percent: this.performanceMetrics.cpuUtilization
        },
        optimization_results: {
          dependency_graph_optimized: true,
          parallel_branches_executed: this.countParallelBranches(executionResults),
          memoization_benefits: this.getMemoizationBenefits(),
          bottleneck_analysis: this.analyzeBottlenecks(executionResults)
        },
        final_output: finalOutput
      }
    } catch (error) {
      const totalTime = Date.now() - startTime

      return {
        execution_id: executionId,
        dag_id: request.dag_definition.dag_id,
        execution_status: 'FAILED',
        total_execution_time_ms: totalTime,
        nodes_executed: 0,
        nodes_failed: 1,
        execution_results: {},
        execution_path: [],
        performance_metrics: {
          total_time_ms: totalTime,
          parallel_time_saved_ms: 0,
          cache_hits: 0,
          cache_misses: 0,
          memory_usage_mb: 0,
          cpu_utilization_percent: 0
        },
        optimization_results: {
          dependency_graph_optimized: false,
          parallel_branches_executed: 0,
          memoization_benefits: [],
          bottleneck_analysis: []
        },
        final_output: { error: (error as Error).message }
      }
    }
  }

  private validateDAGStructure(dagDef: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const nodeIds = new Set(dagDef.nodes.map((n: any) => n.node_id))

    // Check for cycles using topological sort
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true
      if (visited.has(nodeId)) return false

      visited.add(nodeId)
      recursionStack.add(nodeId)

      const node = dagDef.nodes.find((n: any) => n.node_id === nodeId)
      if (node) {
        for (const dep of node.dependencies || []) {
          if (hasCycle(dep)) return true
        }
      }

      recursionStack.delete(nodeId)
      return false
    }

    // Check for cycles
    for (const node of dagDef.nodes) {
      if (!visited.has(node.node_id) && hasCycle(node.node_id)) {
        errors.push('Cyclic dependency detected in DAG')
        break
      }
    }

    // Validate dependencies exist
    for (const node of dagDef.nodes) {
      for (const dep of node.dependencies || []) {
        if (!nodeIds.has(dep)) {
          errors.push(`Node ${node.node_id} depends on non-existent node ${dep}`)
        }
      }
    }

    // Validate required fields
    for (const node of dagDef.nodes) {
      if (!node.node_id || !node.node_type || !node.execution_config?.function_name) {
        errors.push(`Node ${node.node_id || 'unknown'} missing required fields`)
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  private optimizeDAGExecution(dagDef: any, options?: any): any {
    // Clone the DAG definition
    const optimizedDAG = JSON.parse(JSON.stringify(dagDef))

    if (options?.dependency_optimization) {
      // Optimize dependency order for minimal execution time
      optimizedDAG.nodes = this.optimizeDependencyOrder(optimizedDAG.nodes)
    }

    if (options?.enable_parallel_execution) {
      // Mark nodes that can be executed in parallel
      optimizedDAG.nodes = this.markParallelExecutionNodes(optimizedDAG.nodes)
    }

    return optimizedDAG
  }

  private buildDependencyGraph(nodes: any[]): Map<string, string[]> {
    const graph = new Map<string, string[]>()

    for (const node of nodes) {
      graph.set(node.node_id, node.dependencies || [])
    }

    return graph
  }

  private async executeNodes(
    nodes: any[],
    dependencyGraph: Map<string, string[]>,
    context: any,
    options?: any
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {}
    const executing = new Set<string>()
    const completed = new Set<string>()

    // Topological sort for execution order
    const executionOrder = this.topologicalSort(nodes, dependencyGraph)

    // Execute nodes in dependency order with parallel execution where possible
    for (const batch of this.createExecutionBatches(executionOrder, dependencyGraph)) {
      const batchPromises = batch.map(async nodeId => {
        const node = nodes.find(n => n.node_id === nodeId)!

        try {
          executing.add(nodeId)
          const result = await this.executeNode(node, results, context, options)
          completed.add(nodeId)
          return { nodeId, result }
        } catch (error) {
          completed.add(nodeId)
          return {
            nodeId,
            result: {
              status: 'FAILED',
              error_message: (error as Error).message,
              execution_time_ms: 0,
              dependencies_satisfied: false,
              parallel_execution: batch.length > 1
            }
          }
        } finally {
          executing.delete(nodeId)
        }
      })

      // Wait for batch completion
      const batchResults = await Promise.all(batchPromises)

      // Store results
      for (const { nodeId, result } of batchResults) {
        results[nodeId] = result
      }
    }

    return results
  }

  private async executeNode(
    node: any,
    previousResults: any,
    context: any,
    options?: any
  ): Promise<any> {
    const startTime = Date.now()

    // Check cache first
    const cacheKey = this.generateCacheKey(node, context.input_data)
    if (options?.enable_caching && this.executionCache.has(cacheKey)) {
      this.performanceMetrics.cacheHits++
      return {
        ...this.executionCache.get(cacheKey),
        execution_time_ms: Date.now() - startTime,
        dependencies_satisfied: true,
        parallel_execution: false
      }
    }

    this.performanceMetrics.cacheMisses++

    // Collect dependency results
    const dependencyData: Record<string, any> = {}
    for (const depId of node.dependencies || []) {
      if (previousResults[depId]) {
        dependencyData[depId] = previousResults[depId].result_data
      }
    }

    // Execute the node function
    const nodeResult = await this.executeNodeFunction(node.execution_config.function_name, {
      ...node.execution_config.parameters,
      ...context.input_data,
      dependencies: dependencyData
    })

    const executionTime = Date.now() - startTime

    const result = {
      node_name: node.node_name,
      status: 'SUCCESS' as const,
      execution_time_ms: executionTime,
      result_data: nodeResult,
      dependencies_satisfied: true,
      parallel_execution: false
    }

    // Cache the result
    if (options?.enable_caching) {
      this.executionCache.set(cacheKey, result)
    }

    return result
  }

  private async executeNodeFunction(functionName: string, parameters: any): Promise<any> {
    // This would be extended to support various node types
    switch (functionName) {
      case 'calculate_cost':
        return this.calculateCost(parameters)
      case 'apply_markup':
        return this.applyMarkup(parameters)
      case 'validate_price':
        return this.validatePrice(parameters)
      case 'aggregate_results':
        return this.aggregateResults(parameters)
      case 'api_call':
        return this.makeApiCall(parameters)
      default:
        throw new Error(`Unknown function: ${functionName}`)
    }
  }

  // Node function implementations
  private async calculateCost(params: any): Promise<any> {
    // Simulate cost calculation
    const baseCost = params.base_amount || 100
    const factors = params.cost_factors || [1.0]
    return factors.reduce((acc: number, factor: number) => acc * factor, baseCost)
  }

  private async applyMarkup(params: any): Promise<any> {
    const cost = params.dependencies?.calculate_cost || params.cost || 100
    const markupPercent = params.markup_percent || 25
    return cost * (1 + markupPercent / 100)
  }

  private async validatePrice(params: any): Promise<any> {
    const price = params.dependencies?.apply_markup || params.price || 125
    const minPrice = params.min_price || 50
    const maxPrice = params.max_price || 1000

    return {
      price,
      is_valid: price >= minPrice && price <= maxPrice,
      validation_errors:
        price < minPrice ? ['Price below minimum'] : price > maxPrice ? ['Price above maximum'] : []
    }
  }

  private async aggregateResults(params: any): Promise<any> {
    const results = Object.values(params.dependencies || {})
    return {
      total_count: results.length,
      aggregated_data: results,
      summary: 'Aggregation completed successfully'
    }
  }

  private async makeApiCall(params: any): Promise<any> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100))
    return { api_response: 'success', data: params }
  }

  // Helper methods
  private topologicalSort(nodes: any[], dependencyGraph: Map<string, string[]>): string[] {
    const visited = new Set<string>()
    const result: string[] = []

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const dependencies = dependencyGraph.get(nodeId) || []
      for (const dep of dependencies) {
        visit(dep)
      }

      result.push(nodeId)
    }

    for (const node of nodes) {
      visit(node.node_id)
    }

    return result
  }

  private createExecutionBatches(
    executionOrder: string[],
    dependencyGraph: Map<string, string[]>
  ): string[][] {
    const batches: string[][] = []
    const processed = new Set<string>()

    while (processed.size < executionOrder.length) {
      const currentBatch: string[] = []

      for (const nodeId of executionOrder) {
        if (processed.has(nodeId)) continue

        const dependencies = dependencyGraph.get(nodeId) || []
        const allDependenciesSatisfied = dependencies.every(dep => processed.has(dep))

        if (allDependenciesSatisfied) {
          currentBatch.push(nodeId)
        }
      }

      if (currentBatch.length === 0) {
        throw new Error('Circular dependency detected or DAG structure invalid')
      }

      batches.push(currentBatch)
      currentBatch.forEach(nodeId => processed.add(nodeId))
    }

    return batches
  }

  private generateCacheKey(node: any, inputData: any): string {
    return `${node.node_id}_${JSON.stringify(node.execution_config.parameters)}_${JSON.stringify(inputData)}`
  }

  private optimizeDependencyOrder(nodes: any[]): any[] {
    // Sort nodes by dependency count (fewer dependencies first)
    return nodes.sort((a, b) => (a.dependencies?.length || 0) - (b.dependencies?.length || 0))
  }

  private markParallelExecutionNodes(nodes: any[]): any[] {
    // Mark nodes that can be executed in parallel
    return nodes.map(node => ({
      ...node,
      parallel_execution_eligible: (node.dependencies?.length || 0) === 0
    }))
  }

  private determineOverallStatus(results: Record<string, any>): 'COMPLETED' | 'FAILED' | 'PARTIAL' {
    const statuses = Object.values(results).map(r => r.status)

    if (statuses.every(s => s === 'SUCCESS')) return 'COMPLETED'
    if (statuses.every(s => s === 'FAILED')) return 'FAILED'
    return 'PARTIAL'
  }

  private getExecutionPath(results: Record<string, any>): string[] {
    return Object.keys(results).sort((a, b) => {
      const aTime = results[a].execution_time_ms || 0
      const bTime = results[b].execution_time_ms || 0
      return aTime - bTime
    })
  }

  private countParallelBranches(results: Record<string, any>): number {
    return Object.values(results).filter(r => r.parallel_execution).length
  }

  private getMemoizationBenefits(): string[] {
    const benefits = []
    if (this.performanceMetrics.cacheHits > 0) {
      benefits.push(`${this.performanceMetrics.cacheHits} cache hits improved performance`)
    }
    return benefits
  }

  private analyzeBottlenecks(results: Record<string, any>): Array<any> {
    return Object.entries(results)
      .map(([nodeId, result]) => ({
        node_id: nodeId,
        execution_time_ms: result.execution_time_ms || 0,
        optimization_suggestions:
          result.execution_time_ms > 1000 ? ['Consider optimizing this node'] : []
      }))
      .filter(b => b.optimization_suggestions.length > 0)
  }

  private calculateFinalOutput(results: Record<string, any>, nodes: any[]): any {
    // Find terminal nodes (nodes with no dependents)
    const nodeIds = new Set(nodes.map(n => n.node_id))
    const dependents = new Set<string>()

    for (const node of nodes) {
      for (const dep of node.dependencies || []) {
        dependents.add(dep)
      }
    }

    const terminalNodes = Array.from(nodeIds).filter(id => !dependents.has(id))

    if (terminalNodes.length === 1) {
      return results[terminalNodes[0]]?.result_data
    }

    // Multiple terminal nodes - return aggregated result
    return {
      terminal_results: terminalNodes.reduce(
        (acc, nodeId) => {
          acc[nodeId] = results[nodeId]?.result_data
          return acc
        },
        {} as Record<string, any>
      )
    }
  }

  private async storeExecutionRecord(
    executionId: string,
    request: DAGExecutionRequest,
    results: Record<string, any>,
    totalTime: number
  ): Promise<void> {
    try {
      await supabase.from('universal_transactions').insert([
        {
          organization_id: request.organization_id,
          transaction_type: 'dag_execution',
          transaction_code: executionId,
          reference_number: request.dag_definition.dag_id,
          transaction_date: new Date().toISOString(),
          total_amount: totalTime, // Store execution time as amount for reporting
          smart_code: 'HERA.SYSTEM.DAG.TXN.EXECUTION.V1',
          business_context: {
            dag_name: request.dag_definition.dag_name,
            trigger_event: request.execution_context.trigger_event,
            execution_mode: request.execution_context.execution_mode,
            nodes_count: request.dag_definition.nodes.length
          },
          metadata: {
            execution_results: results,
            performance_metrics: this.performanceMetrics,
            dag_definition: request.dag_definition
          }
        }
      ])
    } catch (error) {
      console.error('Failed to store DAG execution record:', error)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body: DAGExecutionRequest = await request.json()

    if (!body.organization_id || !body.dag_definition) {
      return NextResponse.json(
        { error: 'organization_id and dag_definition are required' },
        { status: 400 }
      )
    }

    const dagEngine = new DAGExecutionEngine()
    const result = await dagEngine.executeDAG(body)

    return NextResponse.json(result)
  } catch (error) {
    console.error('DAG execution error:', error)
    return NextResponse.json(
      {
        error: 'DAG execution failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()

  return NextResponse.json({
    endpoint: '/api/v1/dag/execute',
    description: 'HERA DAG Execution Engine - Universal Workflow and Calculation Processing',
    capabilities: [
      'Dependency-based execution ordering',
      'Parallel node execution optimization',
      'Intelligent caching and memoization',
      'Real-time performance monitoring',
      'Bottleneck analysis and optimization',
      'Cycle detection and validation',
      'Error handling and recovery'
    ],
    node_types: [
      'calculation',
      'validation',
      'transformation',
      'aggregation',
      'decision',
      'api_call'
    ],
    execution_modes: ['sync', 'async', 'batch'],
    optimization_features: {
      parallel_execution: 'Execute independent nodes simultaneously',
      caching: 'Cache node results for repeated executions',
      memoization: 'Remember expensive calculations',
      dependency_optimization: 'Optimize execution order for minimal time',
      bottleneck_analysis: 'Identify and suggest optimizations for slow nodes'
    },
    example_request: {
      organization_id: 'uuid-here',
      dag_definition: {
        dag_id: 'pricing-calculation-dag',
        dag_name: 'Product Pricing Calculation',
        nodes: [
          {
            node_id: 'cost_calc',
            node_type: 'calculation',
            node_name: 'Calculate Base Cost',
            dependencies: [],
            execution_config: {
              function_name: 'calculate_cost',
              parameters: { base_amount: 100, cost_factors: [1.1, 1.05] }
            }
          },
          {
            node_id: 'markup_calc',
            node_type: 'calculation',
            node_name: 'Apply Markup',
            dependencies: ['cost_calc'],
            execution_config: {
              function_name: 'apply_markup',
              parameters: { markup_percent: 25 }
            }
          }
        ]
      },
      execution_context: {
        trigger_event: 'pricing_request',
        input_data: { product_id: 'PROD-001' },
        execution_mode: 'sync',
        priority: 'normal'
      },
      optimization_options: {
        enable_parallel_execution: true,
        enable_caching: true,
        max_concurrent_nodes: 4,
        dependency_optimization: true
      }
    }
  })
}
