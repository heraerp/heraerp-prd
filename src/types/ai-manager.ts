// AI Manager Types for ISP
export interface AIManagerResponse {
  answer: string
  confidence: number
  sources: string[]
  suggestions?: string[]
  relatedQueries?: string[]
  metrics?: {
    [key: string]: any
  }
  visualizations?: Array<{
    type: 'chart' | 'table' | 'metric'
    data: any
    title: string
  }>
  actions?: Array<{
    label: string
    action: string
    params?: any
  }>
}

export interface AIManagerQuery {
  query: string
  context?: {
    userId?: string
    organizationId?: string
    sessionId?: string
    previousQueries?: string[]
  }
  filters?: {
    timeRange?: string
    departments?: string[]
    metrics?: string[]
  }
}

export interface AIManagerConfig {
  apiKey?: string
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-2' | 'claude-instant'
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}
