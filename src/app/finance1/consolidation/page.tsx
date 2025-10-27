'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { 
  Building2, Plus, Search, Filter, Download, Upload, ArrowLeft,
  RefreshCw, Settings, Eye, Edit, MoreHorizontal, TrendingUp,
  TrendingDown, Target, AlertTriangle, CheckCircle, Calculator,
  BarChart3, PieChart, Clock, DollarSign, Calendar, 
  Star, Package, Factory, ArrowRight, FileText,
  ChevronDown, ChevronRight, Maximize2, CircleDollarSign,
  Percent, CalendarDays, UserCheck, ClipboardList, Banknote,
  Users, Activity, MapPin, Award, Database,
  Layers, Zap, Grid, Table, Monitor, Briefcase, Shield,
  Globe, Bookmark, LineChart, Gauge, Box,
  ArrowUpRight, Bell, Hash, Timer, Workflow, Wrench,
  Brain, Bot, Sparkles, Lightbulb, Radar, Microscope,
  ArrowUpDown, BarChart2, Mail, Send, Archive, // TrendingUpDown not in this lucide version
  FilePlus, FileSpreadsheet, Presentation, Image,
  CheckSquare, XCircle, Pause, Play, RotateCcw, Copy,
  Network, Combine, Split, ArrowLeftRight, GitMerge
} from 'lucide-react'

interface ConsolidationGroup {
  id: string
  group_code: string
  group_name: string
  description: string
  consolidation_method: 'full' | 'proportional' | 'equity'
  reporting_currency: string
  fiscal_year: number
  consolidation_version: string
  status: 'active' | 'inactive' | 'locked'
  entities: ConsolidationEntity[]
  elimination_rules: EliminationRule[]
  created_by: string
  created_at: string
  last_consolidated: string
}

interface ConsolidationEntity {
  id: string
  entity_code: string
  entity_name: string
  entity_type: 'parent' | 'subsidiary' | 'associate' | 'joint_venture'
  ownership_percentage: number
  functional_currency: string
  consolidation_method: 'full' | 'proportional' | 'equity'
  first_consolidation: string
  elimination_scope: string[]
  reporting_entity: boolean
  data_source: string
  last_data_load: string
  status: 'active' | 'inactive'
}

interface EliminationRule {
  id: string
  rule_code: string
  rule_name: string
  rule_type: 'intercompany_sales' | 'intercompany_profits' | 'investments' | 'dividends' | 'loans' | 'custom'
  description: string
  from_entity: string
  to_entity: string
  account_mapping: AccountMapping[]
  elimination_percentage: number
  automatic_processing: boolean
  priority: number
  status: 'active' | 'inactive'
  created_by: string
}

interface AccountMapping {
  id: string
  source_account: string
  target_account: string
  mapping_type: 'elimination' | 'reclassification' | 'adjustment'
  mapping_rule: string
}

interface ConsolidationRun {
  id: string
  run_number: string
  group_id: string
  consolidation_date: string
  period: string
  fiscal_year: number
  version: string
  run_type: 'full' | 'incremental' | 'test'
  status: 'planning' | 'running' | 'completed' | 'failed' | 'cancelled'
  entities_processed: number
  total_entities: number
  eliminations_processed: number
  total_eliminations: number
  currency_translations: number
  validation_errors: number
  started_at: string
  completed_at?: string
  processing_time?: number
  started_by: string
}

interface IntercompanyTransaction {
  id: string
  transaction_id: string
  from_entity: string
  to_entity: string
  transaction_type: 'sales' | 'purchases' | 'loans' | 'dividends' | 'services' | 'other'
  transaction_date: string
  amount: number
  currency: string
  account_debit: string
  account_credit: string
  elimination_status: 'pending' | 'eliminated' | 'partially_eliminated' | 'exception'
  elimination_amount: number
  reconciliation_status: 'matched' | 'unmatched' | 'disputed'
  notes?: string
}

interface CurrencyTranslation {
  id: string
  entity_id: string
  from_currency: string
  to_currency: string
  translation_date: string
  translation_method: 'current_rate' | 'historical_rate' | 'average_rate'
  exchange_rate: number
  original_amount: number
  translated_amount: number
  translation_difference: number
  account_code: string
  created_at: string
}

interface ConsolidationAdjustment {
  id: string
  adjustment_code: string
  adjustment_name: string
  adjustment_type: 'elimination' | 'reclassification' | 'fair_value' | 'goodwill' | 'minority_interest'
  description: string
  entities_affected: string[]
  debit_account: string
  credit_account: string
  adjustment_amount: number
  currency: string
  period: string
  fiscal_year: number
  status: 'draft' | 'approved' | 'posted' | 'reversed'
  supporting_documents: string[]
  created_by: string
  approved_by?: string
  created_at: string
}

interface ConsolidationMetrics {
  total_groups: number
  active_entities: number
  pending_eliminations: number
  last_run_success_rate: number
  intercompany_volume: number
  currency_translations: number
  consolidation_accuracy: number
  average_processing_time: number
}

// Group Consolidation (FI-CONSOLIDATION) Module
export default function GroupConsolidationPage() {
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<ConsolidationGroup[]>([])
  const [runs, setRuns] = useState<ConsolidationRun[]>([])
  const [intercompanyTxns, setIntercompanyTxns] = useState<IntercompanyTransaction[]>([])
  const [currencyTranslations, setCurrencyTranslations] = useState<CurrencyTranslation[]>([])
  const [adjustments, setAdjustments] = useState<ConsolidationAdjustment[]>([])
  const [metrics, setMetrics] = useState<ConsolidationMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'groups' | 'entities' | 'eliminations' | 'runs' | 'intercompany' | 'currency' | 'adjustments'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [selectedGroup, setSelectedGroup] = useState<ConsolidationGroup | null>(null)

  // Mock data for demonstration
  useEffect(() => {
    const loadConsolidationData = async () => {
      if (!organization?.id) return
      
      setLoading(true)
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Mock consolidation groups
        const mockGroups: ConsolidationGroup[] = [
          {
            id: '1',
            group_code: 'GRP-CORP-001',
            group_name: 'Corporate Group Consolidation',
            description: 'Main corporate group including all subsidiaries and joint ventures',
            consolidation_method: 'full',
            reporting_currency: 'INR',
            fiscal_year: 2024,
            consolidation_version: 'ACTUAL',
            status: 'active',
            entities: [
              {
                id: '1',
                entity_code: 'PARENT-001',
                entity_name: 'Parent Company Ltd',
                entity_type: 'parent',
                ownership_percentage: 100,
                functional_currency: 'INR',
                consolidation_method: 'full',
                first_consolidation: '2020-01-01',
                elimination_scope: ['intercompany_sales', 'intercompany_profits', 'investments'],
                reporting_entity: true,
                data_source: 'SAP_ERP',
                last_data_load: '2024-01-25T20:00:00Z',
                status: 'active'
              },
              {
                id: '2',
                entity_code: 'SUB-001',
                entity_name: 'Manufacturing Subsidiary',
                entity_type: 'subsidiary',
                ownership_percentage: 100,
                functional_currency: 'INR',
                consolidation_method: 'full',
                first_consolidation: '2021-06-01',
                elimination_scope: ['intercompany_sales', 'intercompany_profits'],
                reporting_entity: false,
                data_source: 'SAP_ERP',
                last_data_load: '2024-01-25T20:00:00Z',
                status: 'active'
              },
              {
                id: '3',
                entity_code: 'SUB-002',
                entity_name: 'International Subsidiary',
                entity_type: 'subsidiary',
                ownership_percentage: 75,
                functional_currency: 'USD',
                consolidation_method: 'full',
                first_consolidation: '2022-01-01',
                elimination_scope: ['intercompany_sales', 'investments'],
                reporting_entity: false,
                data_source: 'ORACLE_ERP',
                last_data_load: '2024-01-25T19:30:00Z',
                status: 'active'
              },
              {
                id: '4',
                entity_code: 'JV-001',
                entity_name: 'Technology Joint Venture',
                entity_type: 'joint_venture',
                ownership_percentage: 50,
                functional_currency: 'EUR',
                consolidation_method: 'proportional',
                first_consolidation: '2023-04-01',
                elimination_scope: ['intercompany_profits'],
                reporting_entity: false,
                data_source: 'EXTERNAL_API',
                last_data_load: '2024-01-25T18:45:00Z',
                status: 'active'
              }
            ],
            elimination_rules: [
              {
                id: '1',
                rule_code: 'ELIM-IC-SALES-001',
                rule_name: 'Intercompany Sales Elimination',
                rule_type: 'intercompany_sales',
                description: 'Eliminate sales between group entities',
                from_entity: 'ALL',
                to_entity: 'ALL',
                account_mapping: [
                  {
                    id: '1',
                    source_account: '400000',
                    target_account: '500000',
                    mapping_type: 'elimination',
                    mapping_rule: 'full_elimination'
                  }
                ],
                elimination_percentage: 100,
                automatic_processing: true,
                priority: 1,
                status: 'active',
                created_by: 'consolidation_admin'
              }
            ],
            created_by: 'finance_manager',
            created_at: '2023-01-15T10:00:00Z',
            last_consolidated: '2024-01-25T22:00:00Z'
          },
          {
            id: '2',
            group_code: 'GRP-REG-001',
            group_name: 'Regional Operations Group',
            description: 'Regional subsidiaries consolidation for local reporting',
            consolidation_method: 'full',
            reporting_currency: 'INR',
            fiscal_year: 2024,
            consolidation_version: 'BUDGET',
            status: 'active',
            entities: [],
            elimination_rules: [],
            created_by: 'regional_manager',
            created_at: '2023-03-20T14:30:00Z',
            last_consolidated: '2024-01-20T18:30:00Z'
          }
        ]

        // Mock consolidation runs
        const mockRuns: ConsolidationRun[] = [
          {
            id: '1',
            run_number: 'CONS-2024-001',
            group_id: '1',
            consolidation_date: '2024-01-31',
            period: '001.2024',
            fiscal_year: 2024,
            version: 'ACTUAL',
            run_type: 'full',
            status: 'completed',
            entities_processed: 4,
            total_entities: 4,
            eliminations_processed: 12,
            total_eliminations: 12,
            currency_translations: 8,
            validation_errors: 0,
            started_at: '2024-01-25T22:00:00Z',
            completed_at: '2024-01-25T22:35:00Z',
            processing_time: 35.2,
            started_by: 'consolidation_manager'
          },
          {
            id: '2',
            run_number: 'CONS-2024-002',
            group_id: '1',
            consolidation_date: '2024-01-31',
            period: '001.2024',
            fiscal_year: 2024,
            version: 'FORECAST',
            run_type: 'incremental',
            status: 'running',
            entities_processed: 2,
            total_entities: 4,
            eliminations_processed: 6,
            total_eliminations: 12,
            currency_translations: 4,
            validation_errors: 1,
            started_at: '2024-01-26T09:00:00Z',
            started_by: 'forecast_analyst'
          },
          {
            id: '3',
            run_number: 'CONS-2024-003',
            group_id: '2',
            consolidation_date: '2024-01-31',
            period: '001.2024',
            fiscal_year: 2024,
            version: 'BUDGET',
            run_type: 'test',
            status: 'failed',
            entities_processed: 0,
            total_entities: 2,
            eliminations_processed: 0,
            total_eliminations: 5,
            currency_translations: 0,
            validation_errors: 3,
            started_at: '2024-01-25T16:30:00Z',
            completed_at: '2024-01-25T16:32:00Z',
            processing_time: 2.1,
            started_by: 'test_user'
          }
        ]

        // Mock intercompany transactions
        const mockIntercompanyTxns: IntercompanyTransaction[] = [
          {
            id: '1',
            transaction_id: 'IC-2024-0001',
            from_entity: 'PARENT-001',
            to_entity: 'SUB-001',
            transaction_type: 'sales',
            transaction_date: '2024-01-15',
            amount: 2500000,
            currency: 'INR',
            account_debit: '130000',
            account_credit: '400000',
            elimination_status: 'eliminated',
            elimination_amount: 2500000,
            reconciliation_status: 'matched',
            notes: 'Product sales to subsidiary'
          },
          {
            id: '2',
            transaction_id: 'IC-2024-0002',
            from_entity: 'SUB-002',
            to_entity: 'PARENT-001',
            transaction_type: 'loans',
            transaction_date: '2024-01-20',
            amount: 1000000,
            currency: 'USD',
            account_debit: '150000',
            account_credit: '250000',
            elimination_status: 'pending',
            elimination_amount: 0,
            reconciliation_status: 'unmatched',
            notes: 'Intercompany loan requiring elimination'
          },
          {
            id: '3',
            transaction_id: 'IC-2024-0003',
            from_entity: 'JV-001',
            to_entity: 'SUB-001',
            transaction_type: 'services',
            transaction_date: '2024-01-22',
            amount: 750000,
            currency: 'EUR',
            account_debit: '140000',
            account_credit: '410000',
            elimination_status: 'partially_eliminated',
            elimination_amount: 375000,
            reconciliation_status: 'matched',
            notes: 'Technology services - 50% ownership'
          }
        ]

        // Mock currency translations
        const mockCurrencyTranslations: CurrencyTranslation[] = [
          {
            id: '1',
            entity_id: 'SUB-002',
            from_currency: 'USD',
            to_currency: 'INR',
            translation_date: '2024-01-31',
            translation_method: 'current_rate',
            exchange_rate: 83.25,
            original_amount: 1200000,
            translated_amount: 99900000,
            translation_difference: 1500000,
            account_code: '110000',
            created_at: '2024-01-25T22:15:00Z'
          },
          {
            id: '2',
            entity_id: 'JV-001',
            from_currency: 'EUR',
            to_currency: 'INR',
            translation_date: '2024-01-31',
            translation_method: 'average_rate',
            exchange_rate: 89.45,
            original_amount: 850000,
            translated_amount: 76032500,
            translation_difference: -850000,
            account_code: '120000',
            created_at: '2024-01-25T22:20:00Z'
          }
        ]

        // Mock consolidation adjustments
        const mockAdjustments: ConsolidationAdjustment[] = [
          {
            id: '1',
            adjustment_code: 'ADJ-ELIM-001',
            adjustment_name: 'Goodwill Impairment Adjustment',
            adjustment_type: 'goodwill',
            description: 'Annual goodwill impairment testing adjustment',
            entities_affected: ['SUB-002'],
            debit_account: '601000',
            credit_account: '171000',
            adjustment_amount: 5000000,
            currency: 'INR',
            period: '001.2024',
            fiscal_year: 2024,
            status: 'approved',
            supporting_documents: ['goodwill_impairment_test_2024.pdf'],
            created_by: 'valuation_specialist',
            approved_by: 'cfo',
            created_at: '2024-01-20T14:00:00Z'
          },
          {
            id: '2',
            adjustment_code: 'ADJ-FAIR-001',
            adjustment_name: 'Fair Value Adjustment - Investment Property',
            adjustment_type: 'fair_value',
            description: 'Mark-to-market adjustment for investment properties',
            entities_affected: ['PARENT-001'],
            debit_account: '160000',
            credit_account: '930000',
            adjustment_amount: 2500000,
            currency: 'INR',
            period: '001.2024',
            fiscal_year: 2024,
            status: 'posted',
            supporting_documents: ['property_valuation_2024.pdf'],
            created_by: 'asset_manager',
            approved_by: 'finance_director',
            created_at: '2024-01-18T11:30:00Z'
          }
        ]

        // Mock metrics
        const mockMetrics: ConsolidationMetrics = {
          total_groups: 2,
          active_entities: 6,
          pending_eliminations: 8,
          last_run_success_rate: 83.3,
          intercompany_volume: 4250000,
          currency_translations: 10,
          consolidation_accuracy: 97.8,
          average_processing_time: 28.7
        }

        setGroups(mockGroups)
        setRuns(mockRuns)
        setIntercompanyTxns(mockIntercompanyTxns)
        setCurrencyTranslations(mockCurrencyTranslations)
        setAdjustments(mockAdjustments)
        setMetrics(mockMetrics)
        
      } catch (error) {
        console.error('Error loading consolidation data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConsolidationData()
  }, [organization?.id])

  // Filter groups based on search and filters
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.group_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || group.status === statusFilter
    const matchesMethod = methodFilter === 'all' || group.consolidation_method === methodFilter
    return matchesSearch && matchesStatus && matchesMethod
  })

  // Auth Guard
  if (!isAuthenticated) {
    return (
      <div className="sap-font min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access Group Consolidation.</p>
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
      {/* Consolidation KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Consolidation Groups',
            value: metrics?.total_groups?.toString() || '0',
            subtitle: `${metrics?.active_entities || 0} entities`,
            icon: Network,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            title: 'Success Rate',
            value: `${metrics?.last_run_success_rate?.toFixed(1) || '0'}%`,
            subtitle: 'Last consolidation run',
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          {
            title: 'Pending Eliminations',
            value: metrics?.pending_eliminations?.toString() || '0',
            subtitle: 'Require processing',
            icon: AlertTriangle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
          },
          {
            title: 'Avg Processing Time',
            value: `${metrics?.average_processing_time?.toFixed(1) || '0'}min`,
            subtitle: 'Consolidation runs',
            icon: Clock,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
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

      {/* Consolidation Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GitMerge className="w-5 h-5" />
            Recent Consolidation Runs
          </h3>
          <div className="space-y-4">
            {runs.slice(0, 4).map((run) => {
              const group = groups.find(g => g.id === run.group_id)
              return (
                <div key={run.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        run.status === 'completed' ? 'bg-green-100' :
                        run.status === 'running' ? 'bg-blue-100' :
                        run.status === 'failed' ? 'bg-red-100' :
                        'bg-gray-100'
                      }`}>
                        {run.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {run.status === 'running' && <Play className="w-4 h-4 text-blue-600" />}
                        {run.status === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                        {(run.status === 'planning' || run.status === 'cancelled') && <Pause className="w-4 h-4 text-gray-600" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{run.run_number}</h4>
                        <p className="text-xs text-gray-600">{group?.group_name}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      run.status === 'completed' ? 'bg-green-100 text-green-800' :
                      run.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      run.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Entities:</span>
                      <span className="font-medium ml-1">{run.entities_processed}/{run.total_entities}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Eliminations:</span>
                      <span className="font-medium ml-1">{run.eliminations_processed}/{run.total_eliminations}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium ml-1">{run.processing_time?.toFixed(1) || '--'}min</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Started {new Date(run.started_at).toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Intercompany Transactions
          </h3>
          <div className="space-y-4">
            {intercompanyTxns.slice(0, 4).map((txn) => (
              <div key={txn.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{txn.transaction_id}</h4>
                    <p className="text-xs text-gray-600">{txn.from_entity} → {txn.to_entity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">₹{txn.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">{txn.currency}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    txn.elimination_status === 'eliminated' ? 'bg-green-100 text-green-800' :
                    txn.elimination_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    txn.elimination_status === 'partially_eliminated' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {txn.elimination_status.replace('_', ' ').charAt(0).toUpperCase() + txn.elimination_status.replace('_', ' ').slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">{txn.transaction_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Consolidation Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { title: 'Run Consolidation', icon: Play, color: 'bg-green-600' },
            { title: 'New Group', icon: Plus, color: 'bg-blue-600' },
            { title: 'Elimination Rules', icon: Split, color: 'bg-purple-600' },
            { title: 'Currency Translation', icon: Globe, color: 'bg-orange-600' },
            { title: 'Intercompany Matching', icon: ArrowLeftRight, color: 'bg-indigo-600' },
            { title: 'Adjustments', icon: Edit, color: 'bg-gray-600' }
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

      {/* Entity Structure Visualization */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Network className="w-5 h-5" />
          Group Structure Overview
        </h3>
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">{group.group_name}</h4>
                <span className="text-sm text-gray-600">{group.entities.length} entities</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {group.entities.map((entity) => (
                  <div key={entity.id} className={`p-3 rounded-lg border ${
                    entity.entity_type === 'parent' ? 'bg-blue-50 border-blue-200' :
                    entity.entity_type === 'subsidiary' ? 'bg-green-50 border-green-200' :
                    entity.entity_type === 'associate' ? 'bg-orange-50 border-orange-200' :
                    'bg-purple-50 border-purple-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className={`w-4 h-4 ${
                        entity.entity_type === 'parent' ? 'text-blue-600' :
                        entity.entity_type === 'subsidiary' ? 'text-green-600' :
                        entity.entity_type === 'associate' ? 'text-orange-600' :
                        'text-purple-600'
                      }`} />
                      <span className="text-sm font-medium text-gray-900">{entity.entity_name}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <p>{entity.ownership_percentage}% ownership</p>
                      <p>{entity.functional_currency} • {entity.consolidation_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderGroups = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search consolidation groups..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="locked">Locked</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">All Methods</option>
            <option value="full">Full Consolidation</option>
            <option value="proportional">Proportional</option>
            <option value="equity">Equity Method</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            New Group
          </button>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Group Code</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Group Name</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Method</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Entities</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Currency</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Last Consolidated</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGroups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-blue-600">{group.group_code}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{group.group_name}</div>
                      <div className="text-sm text-gray-600">{group.description}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      group.consolidation_method === 'full' ? 'bg-blue-100 text-blue-800' :
                      group.consolidation_method === 'proportional' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {group.consolidation_method.charAt(0).toUpperCase() + group.consolidation_method.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900">{group.entities.length}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900">{group.reporting_currency}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="text-sm text-gray-900">{new Date(group.last_consolidated).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-600">{new Date(group.last_consolidated).toLocaleTimeString()}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      group.status === 'active' ? 'bg-green-100 text-green-800' :
                      group.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-gray-400 hover:text-green-600" title="Run Consolidation">
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-blue-600" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-purple-600" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600" title="More">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div className="sap-font min-h-screen bg-gray-100">
      <SapNavbar 
        title="HERA Finance" 
        breadcrumb="Finance • Group Consolidation"
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
                  <Building2 className="w-8 h-8 text-blue-600" />
                  Group Consolidation
                </h1>
                <p className="text-gray-600 mt-1">
                  Enterprise-grade financial consolidation with intercompany eliminations and currency translation
                </p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Play className="w-4 h-4" />
                  Run Consolidation
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  New Group
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
                  { key: 'groups', label: 'Groups', icon: Network },
                  { key: 'entities', label: 'Entities', icon: Building2 },
                  { key: 'eliminations', label: 'Eliminations', icon: Split },
                  { key: 'runs', label: 'Runs', icon: Play },
                  { key: 'intercompany', label: 'Intercompany', icon: ArrowLeftRight },
                  { key: 'currency', label: 'Currency', icon: Globe },
                  { key: 'adjustments', label: 'Adjustments', icon: Edit }
                ].map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && renderOverview()}
                  {activeTab === 'groups' && renderGroups()}
                  {activeTab === 'entities' && (
                    <div className="text-center py-12">
                      <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Entity Management</h3>
                      <p className="text-gray-600">Consolidation entity management and configuration coming soon</p>
                    </div>
                  )}
                  {activeTab === 'eliminations' && (
                    <div className="text-center py-12">
                      <Split className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Elimination Rules</h3>
                      <p className="text-gray-600">Intercompany elimination rules and processing coming soon</p>
                    </div>
                  )}
                  {activeTab === 'runs' && (
                    <div className="text-center py-12">
                      <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Consolidation Runs</h3>
                      <p className="text-gray-600">Consolidation execution and monitoring coming soon</p>
                    </div>
                  )}
                  {activeTab === 'intercompany' && (
                    <div className="text-center py-12">
                      <ArrowLeftRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Intercompany Transactions</h3>
                      <p className="text-gray-600">Intercompany matching and reconciliation coming soon</p>
                    </div>
                  )}
                  {activeTab === 'currency' && (
                    <div className="text-center py-12">
                      <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Currency Translation</h3>
                      <p className="text-gray-600">Multi-currency translation and rate management coming soon</p>
                    </div>
                  )}
                  {activeTab === 'adjustments' && (
                    <div className="text-center py-12">
                      <Edit className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Consolidation Adjustments</h3>
                      <p className="text-gray-600">Manual adjustments and fair value entries coming soon</p>
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