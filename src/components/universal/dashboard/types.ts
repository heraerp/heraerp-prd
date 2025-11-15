/**
 * Universal Dashboard TypeScript Interfaces
 * Shared types for HERA app dashboards (Retail, Agro, Waste, Salon, etc.)
 */

import { LucideIcon } from 'lucide-react'

// Main dashboard configuration interface
export interface DashboardConfig {
  appCode: string                                    // 'RETAIL' | 'AGRO' | 'WASTE' | 'SALON'
  appName: string                                    // 'HERA Retail' | 'HERA Agro'
  theme: AppTheme                                    // Color scheme and branding
  navItems: string[]                                 // Header navigation menu items
  insightsTiles: InsightTileConfig[]                // KPI tiles configuration
  insightsCards: InsightCardConfig[]                // Chart cards configuration
  aiGreeting: string                                 // AI assistant welcome message
  newsItems: NewsItemConfig[]                        // News feed items
  domainIconOverrides?: Record<string, IconConfig>   // Custom icon mapping for domains
}

// App theme configuration
export interface AppTheme {
  primaryColor: string        // Tailwind color class (e.g., 'indigo-600', 'green-600')
  logoBgClass: string        // Logo background class (e.g., 'bg-indigo-600')
  accentColor: string        // Hex color for charts (e.g., '#3B82F6')
}

// Insight tile configuration (small KPI cards)
export interface InsightTileConfig {
  id: string
  iconName: string           // Icon name as string (e.g., 'TrendingUp', 'CheckCircle')
  iconColor: string          // Tailwind color class (e.g., 'text-emerald-600')
  title: string              // Tile title
  value: string | number     // Main metric value
  subtitle: string           // Subtitle/change indicator
  subtitleColor?: string     // Subtitle text color
}

// Insight card configuration (larger analytical cards)
export interface InsightCardConfig {
  id: string
  type: 'bar' | 'line' | 'pie' | 'donut' | 'table'
  title: string
  description: string
  data: any                  // Chart data (structure depends on type)
  config?: ChartConfig       // Optional chart-specific configuration
}

// Chart configuration options
export interface ChartConfig {
  colors?: string[]          // Custom color palette
  dataKeys?: string[]        // Keys to display in chart
  xAxisKey?: string         // X-axis data key
  yAxisDomain?: [number, number]  // Y-axis range
  showLegend?: boolean      // Show/hide legend
  innerRadius?: number      // For donut charts
  outerRadius?: number      // For pie/donut charts
}

// News item configuration
export interface NewsItemConfig {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'featured' | 'standard'
  borderColor?: string       // Left border color for standard items
}

// Icon configuration
export interface IconConfig {
  icon: LucideIcon
  bgColor: string            // Background color class
}

// Dynamic module interface (for domain tiles)
export interface DynamicModule {
  id: string
  entity_id: string
  title: string
  subtitle: string
  icon: LucideIcon
  bgColor: string
  textColor: string
  domain: string
  section: string
  workspace: string
  roles: string[]
  entity_code: string
  smart_code: string
}

// AI chat message interface
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
