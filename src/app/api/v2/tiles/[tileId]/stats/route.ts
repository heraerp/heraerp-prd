/**
 * HERA Universal Tile System - Tile Statistics API
 * GET/POST /api/v2/tiles/:tileId/stats
 * Executes stat queries from resolved tile configurations and returns real-time data
 * Smart Code: HERA.PLATFORM.API.TILE.STATS.v1
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  ResolvedStatTemplate,
  ResolvedTileConfig 
} from '@/lib/tiles/resolved-tile-config'
import { 
  evaluateConditionExpression,
  resolveDynamicValue,
  EvaluationContext
} from '@/lib/tiles/dsl-evaluator'

// ================================================================================
// TYPES
// ================================================================================

export interface TileStatResult {
  statId: string
  label: string
  value: number | string | null
  formattedValue: string
  format: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    percentage: number
    comparisonValue: number | string
  }
  executionTime: number
  error?: string
}

export interface TileStatsResponse {
  tileId: string
  stats: TileStatResult[]
  executedAt: string
  totalExecutionTime: number
  cacheHit: boolean
}

interface StatsRequestBody {
  refresh?: boolean
  statsFilter?: string[]  // Only execute specific stats
  context?: {
    timeRange?: 'today' | 'week' | 'month' | 'year'
    filters?: Record<string, any>
  }
}

// ================================================================================
// ROUTE HANDLERS
// ================================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { tileId: string } }
) {
  return handleStatsRequest(request, params, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tileId: string } }
) {
  return handleStatsRequest(request, params, 'POST')
}

async function handleStatsRequest(
  request: NextRequest,
  { tileId }: { tileId: string },
  method: 'GET' | 'POST'
) {
  const startTime = Date.now()
  
  try {
    // Get organization_id and actor from headers (set by API v2 gateway)
    const organizationId = request.headers.get('x-organization-id')
    const actorUserId = request.headers.get('x-actor-user-id')
    
    if (!organizationId) {
      return Response.json(
        { error: 'Missing organization context' },
        { status: 400 }
      )
    }

    if (!actorUserId) {
      return Response.json(
        { error: 'Missing actor context' },
        { status: 401 }
      )
    }

    // Parse request body for POST
    let requestBody: StatsRequestBody = {}
    if (method === 'POST') {
      try {
        requestBody = await request.json()
      } catch {
        return Response.json(
          { error: 'Invalid request body' },
          { status: 400 }
        )
      }
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get tile configuration
    const tileConfig = await getTileConfiguration({
      tileId,
      organizationId,
      supabase
    })

    if (!tileConfig) {
      return Response.json(
        { error: 'Tile not found or access denied' },
        { status: 404 }
      )
    }

    // Build evaluation context
    const context = await buildEvaluationContext({
      organizationId,
      actorUserId,
      tileConfig,
      requestContext: requestBody.context,
      supabase
    })

    // Execute stats queries
    const statsResults = await executeStatsQueries({
      tileConfig,
      context,
      statsFilter: requestBody.statsFilter,
      refresh: requestBody.refresh ?? false,
      supabase
    })

    const totalExecutionTime = Date.now() - startTime

    const response: TileStatsResponse = {
      tileId,
      stats: statsResults,
      executedAt: new Date().toISOString(),
      totalExecutionTime,
      cacheHit: false // TODO: Implement caching
    }

    // Log telemetry
    await logStatsTelemetry({
      tileId,
      organizationId,
      actorUserId,
      statsCount: statsResults.length,
      executionTime: totalExecutionTime,
      method,
      supabase
    })

    return Response.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Stats-Count': statsResults.length.toString(),
        'X-Execution-Time': totalExecutionTime.toString(),
        'Cache-Control': 'private, max-age=60' // 1 minute cache
      }
    })

  } catch (error) {
    console.error('Error executing tile stats:', error)
    
    const totalExecutionTime = Date.now() - startTime
    
    return Response.json(
      { 
        error: 'Failed to execute tile statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        executionTime: totalExecutionTime
      },
      { status: 500 }
    )
  }
}

// ================================================================================
// CORE STATS EXECUTION LOGIC
// ================================================================================

interface ExecuteStatsParams {
  tileConfig: ResolvedTileConfig
  context: EvaluationContext
  statsFilter?: string[]
  refresh: boolean
  supabase: any
}

async function executeStatsQueries({
  tileConfig,
  context,
  statsFilter,
  refresh,
  supabase
}: ExecuteStatsParams): Promise<TileStatResult[]> {
  
  const results: TileStatResult[] = []
  
  // Filter stats if requested
  const statsToExecute = statsFilter 
    ? tileConfig.stats.filter(stat => statsFilter.includes(stat.statId))
    : tileConfig.stats

  // Execute each stat query
  for (const statTemplate of statsToExecute) {
    const statStartTime = Date.now()
    
    try {
      const result = await executeSingleStat({
        statTemplate,
        context,
        tileConfig,
        supabase
      })
      
      const executionTime = Date.now() - statStartTime
      
      results.push({
        statId: statTemplate.statId,
        label: statTemplate.label,
        value: result.value,
        formattedValue: formatStatValue(result.value, statTemplate.format),
        format: statTemplate.format || 'number',
        executionTime,
        trend: result.trend
      })
      
    } catch (error) {
      const executionTime = Date.now() - statStartTime
      console.error(`Error executing stat ${statTemplate.statId}:`, error)
      
      results.push({
        statId: statTemplate.statId,
        label: statTemplate.label,
        value: null,
        formattedValue: 'Error',
        format: statTemplate.format || 'number',
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  return results
}

interface StatExecutionResult {
  value: number | string | null
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    percentage: number
    comparisonValue: number | string
  }
}

async function executeSingleStat({
  statTemplate,
  context,
  tileConfig,
  supabase
}: {
  statTemplate: ResolvedStatTemplate
  context: EvaluationContext
  tileConfig: ResolvedTileConfig
  supabase: any
}): Promise<StatExecutionResult> {
  
  // Resolve dynamic values in the filter
  const resolvedFilter = resolveDynamicValuesInCondition(statTemplate.filter, context)
  
  // Convert condition to SQL WHERE clause
  const whereClause = buildSQLWhereFromCondition(resolvedFilter, context)
  
  // Build and execute SQL query
  const sql = buildStatsSQL({
    statTemplate,
    whereClause,
    tileConfig
  })
  
  console.log(`Executing stats SQL for ${statTemplate.statId}:`, sql)
  
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: sql.query,
    params: sql.params || []
  })
  
  if (error) {
    throw new Error(`SQL execution failed: ${error.message}`)
  }
  
  // Extract result value
  const resultValue = extractStatValue(data, statTemplate.queryType)
  
  return {
    value: resultValue,
    // TODO: Implement trend calculation
    trend: undefined
  }
}

// ================================================================================
// SQL QUERY BUILDING
// ================================================================================

function buildStatsSQL({
  statTemplate,
  whereClause,
  tileConfig
}: {
  statTemplate: ResolvedStatTemplate
  whereClause: string
  tileConfig: ResolvedTileConfig
}): { query: string; params?: any[] } {
  
  const tableName = getTableNameForTileType(tileConfig.tileType)
  
  let selectClause: string
  
  switch (statTemplate.queryType) {
    case 'count':
      selectClause = 'COUNT(*) as result'
      break
    
    case 'sum':
      if (!statTemplate.aggregation?.field) {
        throw new Error('Sum operation requires aggregation field')
      }
      selectClause = `SUM(${statTemplate.aggregation.field}) as result`
      break
    
    case 'avg':
      if (!statTemplate.aggregation?.field) {
        throw new Error('Average operation requires aggregation field')
      }
      selectClause = `AVG(${statTemplate.aggregation.field}) as result`
      break
    
    case 'min':
      if (!statTemplate.aggregation?.field) {
        throw new Error('Min operation requires aggregation field')
      }
      selectClause = `MIN(${statTemplate.aggregation.field}) as result`
      break
    
    case 'max':
      if (!statTemplate.aggregation?.field) {
        throw new Error('Max operation requires aggregation field')
      }
      selectClause = `MAX(${statTemplate.aggregation.field}) as result`
      break
    
    case 'count_distinct':
      if (!statTemplate.aggregation?.field) {
        throw new Error('Count distinct operation requires aggregation field')
      }
      selectClause = `COUNT(DISTINCT ${statTemplate.aggregation.field}) as result`
      break
    
    default:
      throw new Error(`Unsupported query type: ${statTemplate.queryType}`)
  }
  
  const query = `
    SELECT ${selectClause}
    FROM ${tableName}
    WHERE ${whereClause}
  `.trim()
  
  return { query }
}

function getTableNameForTileType(tileType: string): string {
  switch (tileType) {
    case 'ENTITIES':
      return 'core_entities'
    case 'TRANSACTIONS':
      return 'universal_transactions'
    case 'WORKFLOW':
      return 'universal_transactions' // Workflow tasks are stored as transactions
    case 'RELATIONSHIPS':
      return 'core_relationships'
    default:
      return 'core_entities' // Default fallback
  }
}

// ================================================================================
// CONDITION RESOLUTION & SQL CONVERSION
// ================================================================================

function resolveDynamicValuesInCondition(
  condition: any, 
  context: EvaluationContext
): any {
  if (typeof condition !== 'object' || condition === null) {
    return condition
  }
  
  if (Array.isArray(condition)) {
    return condition.map(item => resolveDynamicValuesInCondition(item, context))
  }
  
  const resolved: any = {}
  
  for (const [key, value] of Object.entries(condition)) {
    if (key === 'value' && typeof value === 'string' && 
        (value.startsWith('{{') || value.startsWith('$'))) {
      // Resolve dynamic value
      resolved[key] = resolveDynamicValue(value as any, context)
    } else if (typeof value === 'object') {
      resolved[key] = resolveDynamicValuesInCondition(value, context)
    } else {
      resolved[key] = value
    }
  }
  
  return resolved
}

function buildSQLWhereFromCondition(
  condition: any,
  context: EvaluationContext
): string {
  // Simple implementation - convert basic conditions to SQL
  // This is a simplified version - production would need full DSL to SQL conversion
  
  if (condition.all && Array.isArray(condition.all)) {
    const clauses = condition.all.map((cond: any) => 
      buildSingleConditionSQL(cond, context)
    ).filter(Boolean)
    
    return clauses.length > 0 ? `(${clauses.join(' AND ')})` : '1=1'
  }
  
  if (condition.any && Array.isArray(condition.any)) {
    const clauses = condition.any.map((cond: any) => 
      buildSingleConditionSQL(cond, context)
    ).filter(Boolean)
    
    return clauses.length > 0 ? `(${clauses.join(' OR ')})` : '1=1'
  }
  
  return buildSingleConditionSQL(condition, context)
}

function buildSingleConditionSQL(condition: any, context: EvaluationContext): string {
  if (!condition.field || !condition.operator) {
    return '1=1'
  }
  
  const field = condition.field
  const operator = condition.operator
  const value = condition.value
  
  switch (operator) {
    case 'eq':
      return `${field} = ${formatSQLValue(value)}`
    case 'neq':
      return `${field} != ${formatSQLValue(value)}`
    case 'gt':
      return `${field} > ${formatSQLValue(value)}`
    case 'gte':
      return `${field} >= ${formatSQLValue(value)}`
    case 'lt':
      return `${field} < ${formatSQLValue(value)}`
    case 'lte':
      return `${field} <= ${formatSQLValue(value)}`
    case 'in':
      if (Array.isArray(value)) {
        const values = value.map(v => formatSQLValue(v)).join(', ')
        return `${field} IN (${values})`
      }
      return '1=1'
    case 'is_null':
      return `${field} IS NULL`
    case 'is_not_null':
      return `${field} IS NOT NULL`
    default:
      return '1=1'
  }
}

function formatSQLValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  
  if (typeof value === 'string') {
    // Escape single quotes and wrap in quotes
    return `'${value.replace(/'/g, "''")}'`
  }
  
  if (typeof value === 'number') {
    return value.toString()
  }
  
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE'
  }
  
  // For dates, arrays, objects - convert to string
  return `'${String(value).replace(/'/g, "''")}'`
}

// ================================================================================
// RESULT PROCESSING & FORMATTING
// ================================================================================

function extractStatValue(data: any[], queryType: string): number | string | null {
  if (!data || data.length === 0) {
    return null
  }
  
  const result = data[0]?.result
  
  if (result === null || result === undefined) {
    return null
  }
  
  // Convert string numbers back to numbers for numeric operations
  if (queryType !== 'count' && typeof result === 'string' && !isNaN(Number(result))) {
    return Number(result)
  }
  
  return result
}

function formatStatValue(value: number | string | null, format?: string): string {
  if (value === null || value === undefined) {
    return '—'
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  switch (format) {
    case 'currency':
      if (typeof numValue === 'number' && !isNaN(numValue)) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(numValue)
      }
      break
    
    case 'number':
      if (typeof numValue === 'number' && !isNaN(numValue)) {
        return new Intl.NumberFormat('en-US').format(numValue)
      }
      break
    
    case 'percentage':
      if (typeof numValue === 'number' && !isNaN(numValue)) {
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(numValue / 100)
      }
      break
    
    case 'duration':
      if (typeof numValue === 'number' && !isNaN(numValue)) {
        const hours = Math.floor(numValue / 3600)
        const minutes = Math.floor((numValue % 3600) / 60)
        return `${hours}h ${minutes}m`
      }
      break
    
    case 'relative_time':
      // TODO: Implement relative time formatting
      return String(value)
      
    default:
      return String(value)
  }
  
  return String(value)
}

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

async function getTileConfiguration({
  tileId,
  organizationId,
  supabase
}: {
  tileId: string
  organizationId: string
  supabase: any
}): Promise<ResolvedTileConfig | null> {
  
  // Get workspace tile
  const { data: tile, error: tileError } = await supabase
    .from('core_entities')
    .select('id, entity_code, entity_name, parent_entity_id, organization_id')
    .eq('id', tileId)
    .eq('entity_type', 'APP_WORKSPACE_TILE')
    .eq('organization_id', organizationId)
    .single()

  if (tileError || !tile) {
    return null
  }

  // For now, return a simplified configuration
  // In production, this should call the resolved tiles endpoint or reuse that logic
  return {
    tileId: tile.id,
    workspaceId: tile.parent_entity_id,
    organizationId: tile.organization_id,
    tileCode: tile.entity_code,
    tileName: tile.entity_name,
    tileType: 'ENTITIES', // TODO: Get from template
    operationCategory: 'MASTER_DATA',
    templateCode: 'TILE_TPL_ENTITIES',
    templateSmartCode: 'HERA.PLATFORM.UI.TILE.TPL.ENTITIES.v1',
    layout: { position: 1, size: 'medium', resizable: true },
    ui: { icon: 'Database', color: '#6B7280', title: tile.entity_name },
    actions: [],
    stats: [] // TODO: Load actual stats from template
  }
}

async function buildEvaluationContext({
  organizationId,
  actorUserId,
  tileConfig,
  requestContext,
  supabase
}: {
  organizationId: string
  actorUserId: string
  tileConfig: ResolvedTileConfig
  requestContext?: any
  supabase: any
}): Promise<EvaluationContext> {
  
  // TODO: Load actual user and organization data
  return {
    user: {
      id: actorUserId,
      entity_id: actorUserId,
      organization_id: organizationId,
      role: 'admin',
      permissions: ['entity.read', 'entity.create'],
    },
    organization: {
      id: organizationId,
      name: 'Test Organization',
      type: 'BUSINESS',
      plan: 'pro',
      settings: {},
      features: [],
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV as any || 'development',
      FEATURE_FLAGS: {},
    },
    templates: {
      entity_type: 'CUSTOMER',
      organization_id: organizationId,
      user_id: actorUserId,
      today: new Date().toISOString().split('T')[0],
      ...requestContext
    }
  }
}

async function logStatsTelemetry({
  tileId,
  organizationId,
  actorUserId,
  statsCount,
  executionTime,
  method,
  supabase
}: {
  tileId: string
  organizationId: string
  actorUserId: string
  statsCount: number
  executionTime: number
  method: string
  supabase: any
}) {
  try {
    await supabase
      .from('universal_transactions')
      .insert({
        transaction_type: 'TILE_STATS_EXECUTED',
        smart_code: 'HERA.PLATFORM.TELEMETRY.TILE.STATS.v1',
        organization_id: organizationId,
        source_entity_id: tileId,
        created_by: actorUserId,
        updated_by: actorUserId,
        metadata: {
          stats_count: statsCount,
          execution_time: executionTime,
          method: method
        }
      })
  } catch (error) {
    console.error('Failed to log stats telemetry:', error)
    // Don't fail the request for telemetry errors
  }
}