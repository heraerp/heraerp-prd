'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { 
  BarChart3, Plus, Search, Filter, Download, Upload, ArrowLeft,
  RefreshCw, Settings, Eye, Edit, MoreHorizontal, TrendingUp,
  TrendingDown, Target, AlertTriangle, CheckCircle, Calculator,
  PieChart, Clock, DollarSign, Calendar, 
  Star, Package, Factory, ArrowRight, FileText,
  ChevronDown, ChevronRight, Maximize2, CircleDollarSign,
  Percent, CalendarDays, UserCheck, ClipboardList, Banknote,
  Building2, Users, Activity, MapPin, Award, Database,
  Layers, Zap, Grid, Table, Monitor, Briefcase, Shield,
  Globe, Bookmark, LineChart, Gauge, Box,
  ArrowUpRight, Bell, Hash, Timer, Workflow, Wrench,
  Brain, Bot, Sparkles, Lightbulb, Radar, Microscope,
  TrendingUpDown, BarChart2, Activity as ActivityIcon,
  PieChart as PieChartIcon, Signal, Wifi, Cpu, Thermometer
} from 'lucide-react'

interface AIInsight {
  id: string
  insight_type: 'prediction' | 'anomaly' | 'recommendation' | 'trend' | 'risk'
  title: string
  description: string
  confidence_score: number
  impact_level: 'low' | 'medium' | 'high' | 'critical'
  category: 'revenue' | 'expense' | 'cash_flow' | 'variance' | 'performance'
  data_source: string
  affected_entities: string[]
  recommended_actions: string[]
  created_at: string
  status: 'new' | 'reviewed' | 'action_taken' | 'dismissed'
  created_by_ai: boolean
}

interface PredictiveModel {
  id: string
  model_name: string
  model_type: 'cash_flow' | 'revenue' | 'expense' | 'variance' | 'budget_utilization'
  description: string
  accuracy_score: number
  last_trained: string
  prediction_horizon: number
  input_features: string[]
  model_status: 'active' | 'training' | 'inactive' | 'error'
  predictions_count: number
  created_by: string
  created_at: string
}

interface Dashboard {
  id: string
  dashboard_name: string
  description: string
  dashboard_type: 'executive' | 'operational' | 'analytical' | 'compliance'
  widgets: DashboardWidget[]
  target_audience: string[]
  refresh_frequency: 'real_time' | 'hourly' | 'daily' | 'weekly'
  last_updated: string
  created_by: string
  is_public: boolean
  favorite_count: number
}

interface DashboardWidget {
  id: string
  widget_type: 'kpi' | 'chart' | 'table' | 'gauge' | 'heatmap' | 'trend'
  title: string
  data_source: string
  visualization_config: any
  position: { x: number; y: number; width: number; height: number }
  refresh_interval: number
}

interface AnomalyDetection {
  id: string
  anomaly_type: 'statistical' | 'pattern' | 'threshold' | 'seasonal'
  entity_type: 'transaction' | 'budget' | 'cost_center' | 'profit_center' | 'account'
  entity_id: string
  entity_name: string
  detected_at: string
  anomaly_score: number
  deviation_amount: number
  deviation_percent: number
  expected_value: number
  actual_value: number
  detection_method: string
  investigation_status: 'pending' | 'investigating' | 'resolved' | 'false_positive'
  assigned_to?: string
  resolution_notes?: string
}

interface PerformanceMetric {
  id: string
  metric_name: string
  metric_category: 'financial' | 'operational' | 'strategic' | 'compliance'
  current_value: number
  target_value: number
  benchmark_value?: number
  variance_amount: number
  variance_percent: number
  trend_direction: 'up' | 'down' | 'stable'
  measurement_unit: string
  period: string
  last_updated: string
  performance_status: 'excellent' | 'good' | 'warning' | 'critical'
}

interface AnalyticsMetrics {
  total_insights: number
  active_models: number
  anomalies_detected: number
  dashboards_count: number
  data_quality_score: number
  model_accuracy_avg: number
  insights_implemented: number
  cost_savings_identified: number
}

// Financial Analytics (FI-ANALYTICS) Module
export default function FinancialAnalyticsPage() {
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [models, setModels] = useState<PredictiveModel[]>([])
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'predictions' | 'dashboards' | 'anomalies' | 'performance' | 'models'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [insightFilter, setInsightFilter] = useState<string>('all')
  const [impactFilter, setImpactFilter] = useState<string>('all')

  // Mock data for demonstration
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!organization?.id) return
      
      setLoading(true)
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Mock AI insights
        const mockInsights: AIInsight[] = [
          {
            id: '1',
            insight_type: 'anomaly',
            title: 'Unusual Expense Pattern Detected',
            description: 'Marketing cost center CC-MKT003 showing 34% increase in expenses compared to historical pattern. Recommend immediate investigation.',
            confidence_score: 92.5,
            impact_level: 'high',
            category: 'expense',
            data_source: 'Cost Center Transactions',
            affected_entities: ['CC-MKT003', 'Marketing Budget 2024'],
            recommended_actions: [
              'Review marketing campaign expenses for Q1 2024',
              'Compare against approved budget allocations',
              'Check for unauthorized spending or data entry errors'
            ],
            created_at: '2024-01-25T14:30:00Z',
            status: 'new',
            created_by_ai: true
          },
          {
            id: '2',
            insight_type: 'prediction',
            title: 'Cash Flow Shortage Forecast',
            description: 'Predictive model indicates potential cash flow shortage of ₹2.3M in March 2024 based on current spending patterns and receivables collection trends.',
            confidence_score: 87.3,
            impact_level: 'critical',
            category: 'cash_flow',
            data_source: 'Cash Flow Prediction Model',
            affected_entities: ['Main Operating Account', 'Working Capital'],
            recommended_actions: [
              'Accelerate accounts receivable collections',
              'Consider short-term credit line activation',
              'Defer non-critical capital expenditures'
            ],
            created_at: '2024-01-24T09:15:00Z',
            status: 'reviewed',
            created_by_ai: true
          },
          {
            id: '3',
            insight_type: 'recommendation',
            title: 'Cost Optimization Opportunity',
            description: 'Analysis shows 15% cost reduction potential in IT services across multiple cost centers through vendor consolidation.',
            confidence_score: 78.9,
            impact_level: 'medium',
            category: 'expense',
            data_source: 'Spend Analysis Engine',
            affected_entities: ['CC-IT001', 'CC-IT002', 'CC-IT003'],
            recommended_actions: [
              'Conduct vendor consolidation analysis',
              'Negotiate volume discounts with preferred vendors',
              'Standardize IT service contracts'
            ],
            created_at: '2024-01-23T16:45:00Z',
            status: 'action_taken',
            created_by_ai: true
          },
          {
            id: '4',
            insight_type: 'trend',
            title: 'Revenue Growth Acceleration',
            description: 'Product line electronics showing consistent 12% month-over-month growth, exceeding forecasts by 8%. Consider capacity expansion.',
            confidence_score: 94.1,
            impact_level: 'high',
            category: 'revenue',
            data_source: 'Revenue Analytics Model',
            affected_entities: ['Electronics Product Line', 'Production Capacity'],
            recommended_actions: [
              'Assess production capacity constraints',
              'Evaluate market expansion opportunities',
              'Update revenue forecasts and budgets'
            ],
            created_at: '2024-01-22T11:20:00Z',
            status: 'reviewed',
            created_by_ai: true
          },
          {
            id: '5',
            insight_type: 'risk',
            title: 'Budget Variance Risk Alert',
            description: 'R&D budget showing early signs of potential 18% overrun based on Q1 spending velocity. Intervention recommended.',
            confidence_score: 83.7,
            impact_level: 'medium',
            category: 'variance',
            data_source: 'Budget Variance Predictor',
            affected_entities: ['R&D Budget 2024', 'Innovation Projects'],
            recommended_actions: [
              'Review R&D project priorities and timelines',
              'Implement tighter budget controls',
              'Consider project timeline adjustments'
            ],
            created_at: '2024-01-21T13:10:00Z',
            status: 'new',
            created_by_ai: true
          }
        ]

        // Mock predictive models
        const mockModels: PredictiveModel[] = [
          {
            id: '1',
            model_name: 'Cash Flow Predictor v2.1',
            model_type: 'cash_flow',
            description: 'Advanced LSTM neural network predicting cash flow with 13-week horizon',
            accuracy_score: 91.2,
            last_trained: '2024-01-20T08:00:00Z',
            prediction_horizon: 13,
            input_features: ['Historical cash flow', 'Receivables aging', 'Payables schedule', 'Seasonal patterns'],
            model_status: 'active',
            predictions_count: 1247,
            created_by: 'ai_team',
            created_at: '2023-11-15T10:30:00Z'
          },
          {
            id: '2',
            model_name: 'Revenue Forecast Engine',
            model_type: 'revenue',
            description: 'Ensemble model combining time series and regression for revenue prediction',
            accuracy_score: 88.7,
            last_trained: '2024-01-18T14:15:00Z',
            prediction_horizon: 12,
            input_features: ['Sales pipeline', 'Market indicators', 'Seasonal trends', 'Economic factors'],
            model_status: 'active',
            predictions_count: 892,
            created_by: 'analytics_team',
            created_at: '2023-10-01T12:00:00Z'
          },
          {
            id: '3',
            model_name: 'Expense Anomaly Detector',
            model_type: 'expense',
            description: 'Real-time anomaly detection using isolation forests and statistical methods',
            accuracy_score: 94.3,
            last_trained: '2024-01-22T10:45:00Z',
            prediction_horizon: 1,
            input_features: ['Transaction patterns', 'Historical baselines', 'Cost center behaviors'],
            model_status: 'active',
            predictions_count: 2156,
            created_by: 'ml_ops',
            created_at: '2023-12-05T16:20:00Z'
          }
        ]

        // Mock dashboards
        const mockDashboards: Dashboard[] = [
          {
            id: '1',
            dashboard_name: 'Executive Financial Dashboard',
            description: 'High-level financial KPIs and trends for executive decision making',
            dashboard_type: 'executive',
            widgets: [
              {
                id: '1',
                widget_type: 'kpi',
                title: 'Revenue YTD',
                data_source: 'revenue_analytics',
                visualization_config: { format: 'currency' },
                position: { x: 0, y: 0, width: 3, height: 2 },
                refresh_interval: 300
              },
              {
                id: '2',
                widget_type: 'chart',
                title: 'Cash Flow Trend',
                data_source: 'cash_flow_predictor',
                visualization_config: { type: 'line', period: '12_months' },
                position: { x: 3, y: 0, width: 6, height: 4 },
                refresh_interval: 600
              }
            ],
            target_audience: ['CEO', 'CFO', 'Board Members'],
            refresh_frequency: 'hourly',
            last_updated: '2024-01-25T15:30:00Z',
            created_by: 'bi_team',
            is_public: false,
            favorite_count: 23
          },
          {
            id: '2',
            dashboard_name: 'Cost Center Performance',
            description: 'Detailed cost center analysis with budget variance and trend analysis',
            dashboard_type: 'operational',
            widgets: [],
            target_audience: ['Cost Center Managers', 'Controllers'],
            refresh_frequency: 'daily',
            last_updated: '2024-01-25T08:00:00Z',
            created_by: 'finance_team',
            is_public: true,
            favorite_count: 15
          },
          {
            id: '3',
            dashboard_name: 'AI Insights Hub',
            description: 'Centralized view of all AI-generated insights and recommendations',
            dashboard_type: 'analytical',
            widgets: [],
            target_audience: ['Data Scientists', 'Business Analysts'],
            refresh_frequency: 'real_time',
            last_updated: '2024-01-25T16:45:00Z',
            created_by: 'ai_team',
            is_public: true,
            favorite_count: 31
          }
        ]

        // Mock anomalies
        const mockAnomalies: AnomalyDetection[] = [
          {
            id: '1',
            anomaly_type: 'statistical',
            entity_type: 'cost_center',
            entity_id: 'CC-MKT003',
            entity_name: 'Marketing Digital Campaigns',
            detected_at: '2024-01-25T14:30:00Z',
            anomaly_score: 87.3,
            deviation_amount: 245000,
            deviation_percent: 34.2,
            expected_value: 715000,
            actual_value: 960000,
            detection_method: 'Z-Score Analysis',
            investigation_status: 'investigating',
            assigned_to: 'Sarah Wilson'
          },
          {
            id: '2',
            anomaly_type: 'pattern',
            entity_type: 'transaction',
            entity_id: 'TXN-456789',
            entity_name: 'Office Supplies Purchase',
            detected_at: '2024-01-24T16:20:00Z',
            anomaly_score: 92.1,
            deviation_amount: 8500,
            deviation_percent: 850.0,
            expected_value: 1000,
            actual_value: 9500,
            detection_method: 'Isolation Forest',
            investigation_status: 'resolved',
            assigned_to: 'Mike Johnson',
            resolution_notes: 'Bulk purchase for new office setup - approved by facilities manager'
          },
          {
            id: '3',
            anomaly_type: 'threshold',
            entity_type: 'account',
            entity_id: 'GL-620100',
            entity_name: 'Direct Labor Costs',
            detected_at: '2024-01-23T11:45:00Z',
            anomaly_score: 78.9,
            deviation_amount: 125000,
            deviation_percent: 15.6,
            expected_value: 800000,
            actual_value: 925000,
            detection_method: 'Threshold Breach',
            investigation_status: 'pending'
          }
        ]

        // Mock performance metrics
        const mockMetrics: PerformanceMetric[] = [
          {
            id: '1',
            metric_name: 'Cash Conversion Cycle',
            metric_category: 'financial',
            current_value: 42,
            target_value: 35,
            benchmark_value: 38,
            variance_amount: 7,
            variance_percent: 20.0,
            trend_direction: 'down',
            measurement_unit: 'days',
            period: '2024-Q1',
            last_updated: '2024-01-25T10:00:00Z',
            performance_status: 'warning'
          },
          {
            id: '2',
            metric_name: 'EBITDA Margin',
            metric_category: 'financial',
            current_value: 23.8,
            target_value: 25.0,
            benchmark_value: 22.5,
            variance_amount: -1.2,
            variance_percent: -4.8,
            trend_direction: 'stable',
            measurement_unit: 'percent',
            period: '2024-Q1',
            last_updated: '2024-01-25T10:00:00Z',
            performance_status: 'good'
          },
          {
            id: '3',
            metric_name: 'Budget Variance',
            metric_category: 'operational',
            current_value: 3.2,
            target_value: 2.0,
            variance_amount: 1.2,
            variance_percent: 60.0,
            trend_direction: 'up',
            measurement_unit: 'percent',
            period: '2024-Q1',
            last_updated: '2024-01-25T10:00:00Z',
            performance_status: 'warning'
          }
        ]

        // Mock analytics metrics
        const mockAnalyticsMetrics: AnalyticsMetrics = {
          total_insights: 247,
          active_models: 8,
          anomalies_detected: 23,
          dashboards_count: 12,
          data_quality_score: 94.3,
          model_accuracy_avg: 89.7,
          insights_implemented: 156,
          cost_savings_identified: 2350000
        }

        setInsights(mockInsights)
        setModels(mockModels)
        setDashboards(mockDashboards)
        setAnomalies(mockAnomalies)
        setMetrics(mockMetrics)
        setAnalyticsMetrics(mockAnalyticsMetrics)
        
      } catch (error) {
        console.error('Error loading analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalyticsData()
  }, [organization?.id])

  // Filter insights based on search and filters
  const filteredInsights = insights.filter(insight => {
    const matchesSearch = insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         insight.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = insightFilter === 'all' || insight.insight_type === insightFilter
    const matchesImpact = impactFilter === 'all' || insight.impact_level === impactFilter
    return matchesSearch && matchesType && matchesImpact
  })

  // Auth Guard
  if (!isAuthenticated) {
    return (
      <div className="sap-font min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access Financial Analytics.</p>
        </div>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="sap-font min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization context...</p>
        </div>
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className="sap-font min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-red-600 mb-4">No Organization Context</h2>
          <p className="text-gray-600">Unable to determine organization context.</p>
        </div>
      </div>
    )
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* AI Analytics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'AI Insights Generated',
            value: analyticsMetrics?.total_insights?.toString() || '0',
            subtitle: `${analyticsMetrics?.insights_implemented || 0} implemented`,
            icon: Brain,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
          },
          {
            title: 'Model Accuracy',
            value: `${analyticsMetrics?.model_accuracy_avg?.toFixed(1) || '0'}%`,
            subtitle: `${analyticsMetrics?.active_models || 0} active models`,
            icon: Target,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            title: 'Anomalies Detected',
            value: analyticsMetrics?.anomalies_detected?.toString() || '0',
            subtitle: 'This month',
            icon: Radar,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
          },
          {
            title: 'Cost Savings Identified',
            value: `₹${(analyticsMetrics?.cost_savings_identified || 0) / 1000000}M`,
            subtitle: 'Through AI insights',
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          }
        ].map((metric, index) => {
          const IconComponent = metric.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-md border border-gray-300 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${metric.color}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{metric.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
              <p className="text-sm text-gray-500">{metric.subtitle}</p>
            </div>
          )
        })}
      </div>

      {/* AI Insights Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Latest AI Insights
          </h3>
          <div className="space-y-4">
            {insights.slice(0, 3).map((insight) => (
              <div key={insight.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      insight.impact_level === 'critical' ? 'bg-red-500' :
                      insight.impact_level === 'high' ? 'bg-orange-500' :
                      insight.impact_level === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      insight.insight_type === 'anomaly' ? 'bg-red-100 text-red-800' :
                      insight.insight_type === 'prediction' ? 'bg-blue-100 text-blue-800' :
                      insight.insight_type === 'recommendation' ? 'bg-green-100 text-green-800' :
                      insight.insight_type === 'trend' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {insight.insight_type.charAt(0).toUpperCase() + insight.insight_type.slice(1)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{insight.confidence_score}% confidence</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(insight.created_at).toLocaleDateString()}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All Insights ({insights.length})
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Recent Anomalies
          </h3>
          <div className="space-y-4">
            {anomalies.slice(0, 3).map((anomaly) => (
              <div key={anomaly.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      anomaly.anomaly_score >= 90 ? 'bg-red-100' :
                      anomaly.anomaly_score >= 70 ? 'bg-orange-100' :
                      'bg-yellow-100'
                    }`}>
                      <span className={`text-xs font-bold ${
                        anomaly.anomaly_score >= 90 ? 'text-red-600' :
                        anomaly.anomaly_score >= 70 ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        {Math.round(anomaly.anomaly_score)}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      anomaly.investigation_status === 'resolved' ? 'bg-green-100 text-green-800' :
                      anomaly.investigation_status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {anomaly.investigation_status.replace('_', ' ').charAt(0).toUpperCase() + anomaly.investigation_status.replace('_', ' ').slice(1)}
                    </span>
                  </div>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{anomaly.entity_name}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Deviation: ₹{Math.abs(anomaly.deviation_amount).toLocaleString()} ({anomaly.deviation_percent.toFixed(1)}%)
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(anomaly.detected_at).toLocaleDateString()}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                    Investigate →
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All Anomalies ({anomalies.length})
            </button>
          </div>
        </div>
      </div>

      {/* Performance Dashboard */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          Key Performance Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric) => (
            <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{metric.metric_name}</h4>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  metric.performance_status === 'excellent' ? 'bg-green-100 text-green-800' :
                  metric.performance_status === 'good' ? 'bg-blue-100 text-blue-800' :
                  metric.performance_status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {metric.performance_status.charAt(0).toUpperCase() + metric.performance_status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Current</span>
                    <span className="font-medium">{metric.current_value} {metric.measurement_unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Target</span>
                    <span className="font-medium">{metric.target_value} {metric.measurement_unit}</span>
                  </div>
                </div>
                <div className={`p-2 rounded-full ${
                  metric.trend_direction === 'up' ? 'bg-green-100' :
                  metric.trend_direction === 'down' ? 'bg-red-100' :
                  'bg-gray-100'
                }`}>
                  {metric.trend_direction === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : metric.trend_direction === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : (
                    <ActivityIcon className="w-4 h-4 text-gray-600" />
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    metric.performance_status === 'excellent' ? 'bg-green-500' :
                    metric.performance_status === 'good' ? 'bg-blue-500' :
                    metric.performance_status === 'warning' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((metric.current_value / metric.target_value) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Analytics Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { title: 'Run Analysis', icon: Brain, color: 'bg-purple-600' },
            { title: 'Train Model', icon: Bot, color: 'bg-blue-600' },
            { title: 'Create Dashboard', icon: Monitor, color: 'bg-green-600' },
            { title: 'Export Insights', icon: Download, color: 'bg-orange-600' },
            { title: 'Schedule Report', icon: Calendar, color: 'bg-indigo-600' },
            { title: 'View Anomalies', icon: AlertTriangle, color: 'bg-red-600' }
          ].map((action) => {
            const IconComponent = action.icon
            return (
              <button
                key={action.title}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-center"
              >
                <div className={`p-3 rounded-full ${action.color} mb-3`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">{action.title}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderInsights = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search insights..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={insightFilter}
            onChange={(e) => setInsightFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="anomaly">Anomaly</option>
            <option value="prediction">Prediction</option>
            <option value="recommendation">Recommendation</option>
            <option value="trend">Trend</option>
            <option value="risk">Risk</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
          >
            <option value="all">All Impact Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Brain className="w-4 h-4" />
            Generate Insights
          </button>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInsights.map((insight) => (
          <div key={insight.id} className="bg-white rounded-lg shadow-md border border-gray-300 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  insight.insight_type === 'anomaly' ? 'bg-red-100' :
                  insight.insight_type === 'prediction' ? 'bg-blue-100' :
                  insight.insight_type === 'recommendation' ? 'bg-green-100' :
                  insight.insight_type === 'trend' ? 'bg-purple-100' :
                  'bg-orange-100'
                }`}>
                  {insight.insight_type === 'anomaly' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                  {insight.insight_type === 'prediction' && <Brain className="w-5 h-5 text-blue-600" />}
                  {insight.insight_type === 'recommendation' && <Lightbulb className="w-5 h-5 text-green-600" />}
                  {insight.insight_type === 'trend' && <TrendingUp className="w-5 h-5 text-purple-600" />}
                  {insight.insight_type === 'risk' && <Shield className="w-5 h-5 text-orange-600" />}
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    insight.impact_level === 'critical' ? 'bg-red-100 text-red-800' :
                    insight.impact_level === 'high' ? 'bg-orange-100 text-orange-800' :
                    insight.impact_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {insight.impact_level.charAt(0).toUpperCase() + insight.impact_level.slice(1)} Impact
                  </span>
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">{insight.confidence_score}% confidence</span>
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                insight.status === 'new' ? 'bg-blue-100 text-blue-800' :
                insight.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                insight.status === 'action_taken' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {insight.status.replace('_', ' ').charAt(0).toUpperCase() + insight.status.replace('_', ' ').slice(1)}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{insight.title}</h3>
            <p className="text-gray-600 mb-4">{insight.description}</p>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Affected Entities</h4>
              <div className="flex flex-wrap gap-1">
                {insight.affected_entities.map((entity, index) => (
                  <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {entity}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Actions</h4>
              <ul className="space-y-1">
                {insight.recommended_actions.map((action, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span>AI Generated</span>
              </div>
              <span>{new Date(insight.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Take Action
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                Mark Reviewed
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="sap-font min-h-screen bg-gray-100">
      <SapNavbar 
        title="HERA Finance" 
        breadcrumb="Finance • Financial Analytics"
        showBack={true}
        userInitials={user?.email?.charAt(0).toUpperCase() || 'U'}
        showSearch={true}
      />
      
      <main className="mt-12 min-h-[calc(100vh-48px)] p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                  Financial Analytics
                </h1>
                <p className="text-gray-600 mt-1">
                  AI-powered financial insights, predictive analytics, and intelligent automation
                </p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  <Brain className="w-4 h-4" />
                  Run Analysis
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Monitor className="w-4 h-4" />
                  Dashboard
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-md border border-gray-300">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { key: 'overview', label: 'Overview', icon: BarChart3 },
                  { key: 'insights', label: 'AI Insights', icon: Brain },
                  { key: 'predictions', label: 'Predictions', icon: Target },
                  { key: 'dashboards', label: 'Dashboards', icon: Monitor },
                  { key: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
                  { key: 'performance', label: 'Performance', icon: Gauge },
                  { key: 'models', label: 'Models', icon: Cpu }
                ].map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`${
                        activeTab === tab.key
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && renderOverview()}
                  {activeTab === 'insights' && renderInsights()}
                  {activeTab === 'predictions' && (
                    <div className="text-center py-12">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Predictive Analytics</h3>
                      <p className="text-gray-600">Advanced prediction models and forecasting coming soon</p>
                    </div>
                  )}
                  {activeTab === 'dashboards' && (
                    <div className="text-center py-12">
                      <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Dashboards</h3>
                      <p className="text-gray-600">Custom dashboard builder and analytics workbench coming soon</p>
                    </div>
                  )}
                  {activeTab === 'anomalies' && (
                    <div className="text-center py-12">
                      <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Anomaly Detection</h3>
                      <p className="text-gray-600">Real-time anomaly detection and investigation tools coming soon</p>
                    </div>
                  )}
                  {activeTab === 'performance' && (
                    <div className="text-center py-12">
                      <Gauge className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Analytics</h3>
                      <p className="text-gray-600">KPI tracking and performance management tools coming soon</p>
                    </div>
                  )}
                  {activeTab === 'models' && (
                    <div className="text-center py-12">
                      <Cpu className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">AI Model Management</h3>
                      <p className="text-gray-600">Model training, deployment, and monitoring tools coming soon</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}