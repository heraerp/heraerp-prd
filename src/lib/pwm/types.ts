// PWM-specific TypeScript interfaces using HERA's universal entities

// Core wealth entity types that map to HERA's core_entities table
export type WealthEntityType =
  | 'asset'
  | 'portfolio'
  | 'account'
  | 'investment'
  | 'real_estate'
  | 'crypto'
  | 'commodity'
  | 'private_equity'
  | 'hedge_fund'
  | 'trust'
  | 'foundation'

// Wealth-specific entity extending HERA's core_entities
export interface WealthEntity {
  entity_id: string
  organization_id: string
  entity_type: WealthEntityType
  entity_name: string
  entity_code: string
  parent_entity_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Computed fields from dynamic_data
  current_value?: number
  cost_basis?: number
  currency?: string
  risk_score?: number
  liquidity_score?: number
}

// Dynamic data fields specific to wealth management
export interface WealthDynamicData {
  data_id: string
  entity_id: string
  field_name: string
  field_value: any
  data_type: 'number' | 'string' | 'boolean' | 'date' | 'json'
  is_current: boolean
  valid_from: string
  valid_to?: string
}

// Transaction types for wealth management
export type WealthTransactionType =
  | 'buy'
  | 'sell'
  | 'dividend'
  | 'interest'
  | 'fee'
  | 'tax'
  | 'transfer'
  | 'rebalance'
  | 'valuation_update'

// Wealth transaction extending HERA's universal_transactions
export interface WealthTransaction {
  transaction_id: string
  organization_id: string
  transaction_type: WealthTransactionType
  transaction_date: string
  description: string
  total_amount: number
  currency: string
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  lines?: WealthTransactionLine[]
}

// Transaction line for wealth management
export interface WealthTransactionLine {
  line_id: string
  transaction_id: string
  entity_id: string
  quantity: number
  unit_price: number
  total_amount: number
  fee_amount?: number
  tax_amount?: number
  notes?: string
}

// Aggregated wealth data for dashboard
export interface WealthOverview {
  totalWealth: number
  currency: string
  lastUpdated: string
  dailyChange: number
  dailyChangePercent: number
  monthlyChange: number
  yearlyChange: number
  assetAllocation: AssetAllocation[]
  topHoldings: WealthEntity[]
  recentTransactions: WealthTransaction[]
}

// Asset allocation breakdown
export interface AssetAllocation {
  category: string
  value: number
  percentage: number
  change24h: number
  riskScore: number
  entities: WealthEntity[]
}

// AI-generated insights
export interface AIInsight {
  id: string
  type: 'opportunity' | 'risk' | 'recommendation' | 'prediction'
  title: string
  description: string
  impact: number // Potential financial impact
  confidence: number // AI confidence score 0-1
  priority: 'high' | 'medium' | 'low'
  created_at: string
  actions?: AIAction[]
}

// Actionable items from AI
export interface AIAction {
  id: string
  action_type: 'buy' | 'sell' | 'rebalance' | 'review'
  description: string
  target_entity?: string
  suggested_amount?: number
  deadline?: string
}

// Performance metrics
export interface PerformanceMetrics {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all'
  startValue: number
  endValue: number
  absoluteReturn: number
  percentageReturn: number
  benchmarkReturn?: number
  alpha?: number
  sharpeRatio?: number
  volatility?: number
}

// Real-time update via WebSocket
export interface WealthUpdate {
  type: 'valuation' | 'transaction' | 'insight' | 'alert'
  entity_id?: string
  data: any
  timestamp: string
}

// User preferences for PWM
export interface PWMPreferences {
  defaultCurrency: string
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  investmentHorizon: 'short' | 'medium' | 'long'
  notificationPreferences: {
    priceAlerts: boolean
    aiInsights: boolean
    transactions: boolean
    performance: boolean
  }
  dashboardLayout: {
    widgets: string[]
    theme: 'light' | 'dark'
  }
}
