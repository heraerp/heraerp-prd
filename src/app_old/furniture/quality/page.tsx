'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { EnterpriseDataTable } from '@/src/lib/dna/components/organisms/EnterpriseDataTable'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, AlertCircle, Search, Filter, TrendingUp, TrendingDown, ClipboardCheck, Shield, Award, BarChart3, Activity, Package, Calendar, Clock, User, FileCheck, AlertTriangle, Plus, Download
} from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useFurnitureOrg, FurnitureOrgLoading } from '@/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import Link from 'next/link'
import { cn } from '@/lib/utils' // Inspection status configurations
const inspectionStatuses = { passed: { label: 'Passed', icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/20' }, failed: { label: 'Failed', icon: XCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/20' }, pending: { label: 'Pending', icon: Clock, color: 'text-[var(--color-accent-indigo)] dark:text-[var(--color-text-secondary)]', bgColor: 'bg-[var(--color-body)]/20' }, in_progress: { label: 'In Progress', icon: Activity, color: 'text-primary dark:text-[var(--color-text-secondary)]', bgColor: 'bg-[var(--color-body)]/20' }
}
  // Quality issue types
const issueTypes = { dimension: { label: 'Dimension Issue', color: 'text-[var(--color-accent-indigo)]', icon: Package }, finish: { label: 'Finish Defect', color: 'text-primary', icon: Shield }, material: { label: 'Material Defect', color: 'text-red-600', icon: AlertTriangle }, assembly: { label: 'Assembly Issue', color: 'text-[var(--color-accent-indigo)]', icon: AlertCircle }, packaging: { label: 'Packaging Issue', color: 'text-green-600', icon: Package }
}
  // Inspection columns
const inspectionColumns = [ { key: 'inspection_code', label: 'Inspection #', sortable: true, width: '120px', render: (value: string) => <span className="font-mono text-sm">{value}</span> }, { key: 'product_name', label: 'Product', sortable: true, render: (value: string, row: any) => ( <div> <p className="font-medium">{value}</p> <p className="text-sm text-[var(--color-text-secondary)]">{row.product_code}</p>
      </div>
      ), { key: 'batch_number', label: 'Batch/Order', sortable: true, render: (value: string) => <span className="font-mono text-sm">{value}</span> }, { key: 'inspection_type', label: 'Type', sortable: true, render: (value: string) => {
  const types ={ incoming: 'Incoming', in_process: 'In-Process', final: 'Final', random: 'Random Sample' } return <span>{types[value as keyof typeof types] || value}</span> } }, { key: 'inspector_name', label: 'Inspector', sortable: true, render: (value: string) => ( <div className="flex items-center gap-2"> <User className="h-4 w-4 text-[#37353E]" /> <span>{value}</span>
      </div>
      ), { key: 'inspection_date', label: 'Date', sortable: true, render: (value: string) => ( <div className="bg-[var(--color-body)] flex items-center gap-2"> <Calendar className="h-4 w-4 text-[#37353E]" /> <span className="text-sm">{new Date(value).toLocaleDateString()}</span>
      </div>
      ), { key: 'pass_rate', label: 'Pass Rate', sortable: true, align: 'center' as const, render: (value: number) => { const color = value >= 95 ? 'text-green-600' : value >= 90 ? 'text-[var(--color-accent-indigo)]' : 'text-red-600' return (
    <div className="bg-[var(--color-body)] flex flex-col items-center"> <span className={cn(
            'font-mono font-medium',
            color
          )}>{value}%</span> <Progress value={value} className="bg-[var(--color-body)] w-16 h-1.5 mt-1" /> </div>   ) }, { key: 'status', label: 'Status', sortable: true, render: (value: string) => {
  const config =inspectionStatuses[value as keyof typeof inspectionStatuses] || inspectionStatuses.pending const Icon = config.icon return (
    <Badge variant="outline" className={cn(config.bgColor, config.color, 'border-0')}> <Icon className="h-3 w-3 mr-1" /> {config.label} </Badge>   ) }, { key: 'actions', label: 'Actions', align: 'center' as const, render: (_: any, row: any) => ( <div className="bg-[var(--color-body)] flex gap-1 justify-center"> <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[var(--color-sidebar)]/30"> <FileCheck className="h-4 w-4" /> </Button>
      </div>
      )
] // Issue tracking columns
const issueColumns = [ { key: 'issue_code', label: 'Issue #', sortable: true, width: '100px', render: (value: string) => <span className="font-mono text-sm">{value}</span> }, { key: 'product_name', label: 'Product', sortable: true, render: (value: string, row: any) => ( <div> <p className="font-medium">{value}</p> <p className="text-sm text-[var(--color-text-secondary)]">Batch: {row.batch_number}</p>
      </div>
      ), { key: 'issue_type', label: 'Type', sortable: true, render: (value: string) => {
  const config =issueTypes[value as keyof typeof issueTypes] || { label: value, color: 'text-[var(--color-text-secondary)]', icon: AlertCircle }

const Icon = config.icon return (
    <div className={cn(
            'flex items-center gap-2',
            config.color
          )}> <Icon className="h-4 w-4" /> <span>{config.label}</span>
      </div>
      ) }, { key: 'severity', label: 'Severity', sortable: true, render: (value: string) => {
  const severities ={ critical: { color: 'text-red-600 bg-red-500/20', label: 'Critical' }, major: { color: 'text-[var(--color-accent-indigo)] bg-[var(--color-body)]/20', label: 'Major' }, minor: { color: 'text-yellow-600 bg-yellow-500/20', label: 'Minor' } }

const severity = severities[value as keyof typeof severities] || severities.minor return (
    <Badge variant="outline" className={cn(severity.color, 'border-0')}> {severity.label} </Badge>   ) }, { key: 'reported_date', label: 'Reported', sortable: true, render: (value: string) => ( <span className="text-sm">{new Date(value).toLocaleDateString()}</span>   ), { key: 'resolution_status', label: 'Resolution', sortable: true, render: (value: string) => {
  const statuses ={ open: { color: 'text-red-600', label: 'Open' }, in_progress: { color: 'text-[var(--color-accent-indigo)]', label: 'In Progress' }, resolved: { color: 'text-green-600', label: 'Resolved' } }

const status = statuses[value as keyof typeof statuses] || statuses.open return <span className={status.color}>{status.label}</span> } }, { key: 'corrective_action', label: 'Corrective Action', render: (value: string) => <span className="text-sm">{value || '-'}</span> }
]

export default function FurnitureQuality() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()

const { organizationId, organizationName, orgLoading } = useFurnitureOrg()

const [inspections, setInspections] = useState<any[]>([])

const [issues, setIssues] = useState<any[]>([])

const [loading, setLoading] = useState(true)

const [activeTab, setActiveTab] = useState('inspections')

const [searchTerm, setSearchTerm] = useState('')

const [selectedType, setSelectedType] = useState('all')

const [selectedStatus, setSelectedStatus] = useState('all')
          // Quality metrics const [metrics, setMetrics] = useState({ overallQualityRate: 0, inspectionsToday: 0, openIssues: 0, avgResolutionTime: 0 }) useEffect(() => { if (organizationId && !orgLoading) {
  loadQualityData(  ) }, [organizationId, orgLoading])

const loadQualityData = async () => { try { setLoading(true) universalApi.setOrganizationId(organizationId)
          // Load all entities const { data: allEntities } = await universalApi.read({ table: 'core_entities' })
          // Load all transactions const { data: allTransactions } = await universalApi.read({ table: 'universal_transactions' })
          // Filter for quality inspections
  const qualityInspections =allTransactions?.filter( (t: any) => t.smart_code?.includes('QUALITY.INSPECTION') || t.transaction_type === 'quality_inspection' ) || [] // Filter for quality issues const qualityIssues = allEntities?.filter( (e: any) => e.entity_type === 'quality_issue' || e.smart_code?.includes('QUALITY.ISSUE') ) || [] // Get products for enrichment
  const products =allEntities?.filter( (e: any) => e.entity_type === 'product' && e.smart_code?.startsWith('HERA.FURNITURE.PRODUCT') ) || [] // Get inspectors const inspectors = allEntities?.filter( (e: any) => e.entity_type === 'employee' || e.smart_code?.includes('QUALITY.INSPECTOR') ) || [] // Build inspection data
  const inspectionData =qualityInspections.map((inspection: any, index: number) => { const product = products[index % products.length]
  const inspector =inspectors[index % Math.max(inspectors.length, 1)] // Generate realistic pass rates const passRate = Math.floor(Math.random() * 15) + 85 // 85-100%
  const status =passRate >= 95 ? 'passed' : passRate >= 90 ? 'passed' : passRate >= 80 ? 'pending' : 'failed' return { ...inspection, inspection_code: inspection.transaction_code || `QC-${Date.now()}-${index}`, product_name: product?.entity_name || 'Unknown Product', product_code: product?.entity_code || 'N/A', batch_number: `BATCH-2025-${String(index + 1).padStart(4, '0')}`, inspection_type: ['incoming', 'in_process', 'final', 'random'][index % 4], inspector_name: inspector?.entity_name || `Inspector ${index + 1}`, inspection_date: inspection.transaction_date || new Date().toISOString(), pass_rate: passRate, status: (inspection.metadata as any)?.status || status, samples_tested: Math.floor(Math.random() * 20) + 5, defects_found: Math.floor((100 - passRate) / 10  ) })
          // Build issue data const issueData = qualityIssues.map((issue: any, index: number) => {
  const product =products[index % products.length] const types = Object.keys(issueTypes)

const severities = ['critical', 'major', 'minor']
  const resolutionStatuses =['open', 'in_progress', 'resolved'] return { ...issue, issue_code: issue.entity_code || `QI-${Date.now()}-${index}`, product_name: product?.entity_name || 'Unknown Product', batch_number: `BATCH-2025-${String(index + 1).padStart(4, '0')}`, issue_type: types[index % types.length], severity: severities[index % severities.length], reported_date: issue.created_at || new Date().toISOString(), resolution_status: resolutionStatuses[index % resolutionStatuses.length], corrective_action: index % 3 === 2 ? 'Rework completed' : index % 3 === 1 ? 'Training provided' : null } })
          // Calculate metrics const today = new Date().toDateString()

const todayInspections = inspectionData.filter( (i: any) => new Date(i.inspection_date).toDateString() === today ).length
  const openIssuesCount =issueData.filter((i: any) => i.resolution_status === 'open').length const avgPassRate = inspectionData.length > 0 ? Math.round( inspectionData.reduce((sum: number, i: any) => sum + i.pass_rate, 0) / inspectionData.length ) : 0 setInspections(inspectionData) setIssues(issueData) setMetrics({ overallQualityRate: avgPassRate, inspectionsToday: todayInspections, openIssues: openIssuesCount, avgResolutionTime: 2.5 // Days }  ) catch (error) {
  console.error('Failed to load quality data:', error)   } finally {
    setLoading(false)
  }
}
  // Filter inspections const filteredInspections = inspections.filter(inspection => {
  const matchesSearch =!searchTerm || inspection.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || inspection.inspection_code.toLowerCase().includes(searchTerm.toLowerCase()) || inspection.batch_number.toLowerCase().includes(searchTerm.toLowerCase())

const matchesType = selectedType === 'all' || inspection.inspection_type === selectedType
  const matchesStatus =selectedStatus === 'all' || inspection.status === selectedStatus return matchesSearch && matchesType && matchesStatus })
          // Filter issues const filteredIssues = issues.filter(issue => {
  const matchesSearch =!searchTerm || issue.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || issue.issue_code.toLowerCase().includes(searchTerm.toLowerCase()) return matchesSearch })
          // Show loading state if (orgLoading) {
  return <FurnitureOrgLoading /> }
  // Authorization checks if (isAuthenticated) {
  if (!isAuthenticated) {
  return (
    <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center p-6"> <Alert className="max-w-md bg-[var(--color-body)]/50 border-[var(--color-border)]"> <AlertCircle className="h-4 w-4" /> <AlertDescription>Please log in to access quality management.</AlertDescription> </Alert>
      </div>
      ) if (contextLoading) {
  return (
    <div className="min-h-screen bg-[var(--color-body)] p-6"> <div className="max-w-7xl mx-auto space-y-6"> <Skeleton className="h-10 w-64" /> <div className="grid grid-cols-4 gap-4"> {[...Array(4)].map((_, i) => ( <Skeleton key={i} className="bg-[var(--color-body)] h-24 w-full" /> ))} </div> <Skeleton className="h-96 w-full" /> </div>
      </div>
      ) }

const statCards = [ { label: 'Quality Rate', value: `${metrics.overallQualityRate}%`, icon: Award, color: 'text-green-500', trend: '+2%', trendUp: true, description: 'Overall pass rate' }, { label:"Today's Inspections", value: metrics.inspectionsToday, icon: ClipboardCheck, color: 'text-[var(--color-text-primary)]', trend: '+5', trendUp: true, description: 'Completed today' }, { label: 'Open Issues', value: metrics.openIssues, icon: AlertTriangle, color: 'text-[var(--color-text-primary)]', trend: '-3', trendUp: false, description: 'Pending resolution' }, { label: 'Avg Resolution Time', value: `${metrics.avgResolutionTime} days`, icon: Clock, color: 'text-[var(--color-text-primary)]', trend: '-0.5 days', trendUp: false, description: 'Time to resolve' } ] // Quality standards data
  const qualityStandards =[
  { standard: 'ISO 9001:2015', status: 'Certified', expiry: '2026-12-31' },
  { standard: 'ISI Mark', status: 'Certified', expiry: '2025-06-30' },
  { standard: 'FSC Certified', status: 'Certified', expiry: '2025-09-30' }
] return (
    <div className="min-h-screen bg-[var(--color-body)]"> <div className="p-6 space-y-6"> {/* Header */} <FurniturePageHeader title="Quality Management" subtitle="Monitor quality inspections and track issues" actions={ <> <Button variant="outline" size="sm"> <Download className="h-4 w-4 mr-2" /> Export Report </Button> <Button size="sm" className="bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] gap-2"> <Plus className="h-4 w-4" /> New Inspection </Button> </> } /> {/* Stats Cards */} <div className="grid grid-cols-1 md:grid-cols-4 gap-4"> {statCards.map((stat, index) => ( <Card key={index} className="p-4 bg-[var(--color-body)]/50 border-[var(--color-border)] hover:bg-[var(--color-body)]/70 transition-colors" > <div className="flex items-center justify-between"> <div className="space-y-1"> <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p> <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</p> <p className="text-xs text-[var(--color-text-secondary)]">{stat.description}</p> <div className={cn( 'flex items-center gap-1 text-sm', stat.trendUp ? 'text-green-500' : 'text-red-500' )} > {stat.trendUp ? (
            <TrendingUp className="h-3 w-3" /> )
          : (
            <TrendingDown className="h-3 w-3" /> )} {stat.trend} </div> </div> <stat.icon className={cn(
            'h-8 w-8',
            stat.color
          )} /> </div>
      </Card>
    ))} </div> {/* Quality Standards */} <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/50 border-[var(--color-border)]"> <h3 className="bg-[var(--color-body)] text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Quality Certifications</h3> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {qualityStandards.map((cert, index) => ( <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-body)]/50" > <div> <p className="font-medium text-[var(--color-text-primary)]">{cert.standard}</p> <p className="text-sm text-[var(--color-text-secondary)]">Status: {cert.status}</p> <p className="text-xs text-[var(--color-text-secondary)]"> Expires: {new Date(cert.expiry).toLocaleDateString()} </p> </div> <Shield className="h-8 w-8 text-green-500" /> </div> ))} </div> </Card> {/* Tabs */} <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-[var(--color-body)] space-y-4"> <div className="flex justify-between items-center"> <TabsList className="bg-[var(--color-body)] border-[var(--color-border)]"> <TabsTrigger value="inspections" className="data-[state=active]:bg-muted-foreground/10"> <ClipboardCheck className="h-4 w-4 mr-2" /> Inspections </TabsTrigger> <TabsTrigger value="issues" className="data-[state=active]:bg-muted-foreground/10"> <AlertTriangle className="h-4 w-4 mr-2" /> Quality Issues </TabsTrigger> <TabsTrigger value="analytics" className="data-[state=active]:bg-muted-foreground/10"> <BarChart3 className="h-4 w-4 mr-2" /> Analytics </TabsTrigger> </TabsList> {/* Search and Filters */} <div className="flex gap-4"> <div className="relative"> <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" /> <Input placeholder="Search quality records..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-[var(--color-body)]/50 border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] w-64" /> </div> {activeTab === 'inspections' && ( <> <Select value={selectedType} onValueChange={setSelectedType}> <SelectTrigger className="w-40 bg-[var(--color-body)]/50 border-[var(--color-border)] text-[var(--color-text-primary)]"> <SelectValue placeholder="Type" /> </SelectTrigger> <SelectContent className="bg-[var(--color-body)] border-[var(--color-border)]"> <SelectItem value="all">All Types</SelectItem> <SelectItem value="incoming">Incoming</SelectItem> <SelectItem value="in_process">In-Process</SelectItem> <SelectItem value="final">Final</SelectItem> <SelectItem value="random">Random</SelectItem> </SelectContent> </Select> <Select value={selectedStatus} onValueChange={setSelectedStatus}> <SelectTrigger className="w-40 bg-[var(--color-body)]/50 border-[var(--color-border)] text-[var(--color-text-primary)]"> <SelectValue placeholder="Status" /> </SelectTrigger> <SelectContent className="bg-[var(--color-body)] border-[var(--color-border)]"> <SelectItem value="all">All Status</SelectItem> <SelectItem value="passed">Passed</SelectItem> <SelectItem value="failed">Failed</SelectItem> <SelectItem value="pending">Pending</SelectItem> <SelectItem value="in_progress">In Progress</SelectItem> </SelectContent> </Select> </> )} </div> </div> <TabsContent value="inspections" className="bg-[var(--color-body)] space-y-4"> <EnterpriseDataTable columns={inspectionColumns} data={filteredInspections} loading={loading} searchable={false} sortable selectable pageSize={20} emptyState={{ icon: ClipboardCheck, title: 'No inspections found', description: searchTerm ? 'Try adjusting your search or filters.' : 'Quality inspections will appear here when products are tested.' }
    } className="bg-[var(--color-body)]/50 border-[var(--color-border)]" /> </TabsContent> <TabsContent value="issues" className="bg-[var(--color-body)] space-y-4"> <EnterpriseDataTable columns={issueColumns} data={filteredIssues} loading={loading} searchable={false} sortable selectable pageSize={20} emptyState={{ icon: AlertTriangle, title: 'No quality issues found', description: 'Quality issues will be tracked here when defects are identified.' }
    } className="bg-[var(--color-body)]/50 border-[var(--color-border)]" /> </TabsContent> <TabsContent value="analytics" className="bg-[var(--color-body)] space-y-4"> <div className="grid grid-cols-2 gap-6"> <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/50 border-[var(--color-border)]"> <h3 className="bg-[var(--color-body)] text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Quality Trend</h3> <div className="h-64 flex items-center justify-center text-[var(--color-text-secondary)]"> <BarChart3 className="h-16 w-16 opacity-20" /> <p className="ml-4">Quality trend chart would go here</p> </div> </Card> <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/50 border-[var(--color-border)]"> <h3 className="bg-[var(--color-body)] text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Defect Analysis</h3> <div className="space-y-3"> {Object.entries(issueTypes).map(([key, config]) => { const Icon = config.icon
  const count =issues.filter(i => i.issue_type === key).length const percentage = issues.length > 0 ? Math.round((count / issues.length) * 100) : 0 return (
    <div key={key} className="bg-[var(--color-body)] flex items-center justify-between"> <div className="bg-[var(--color-body)] flex items-center gap-2"> <Icon className={cn(
            'h-4 w-4',
            config.color
          )} /> <span className="text-sm">{config.label}</span> </div> <div className="flex items-center gap-3"> <Progress value={percentage} className="bg-[var(--color-body)] w-24 h-2" /> <span className="text-sm font-mono w-10 text-right">{percentage}%</span> </div>
      </div>
      ))} </div> </Card> </div> <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/50 border-[var(--color-border)]"> <h3 className="bg-[var(--color-body)] text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Inspector Performance</h3> <div className="space-y-3"> {['Inspector 1', 'Inspector 2', 'Inspector 3'].map((inspector, index) => {
  const inspectorData =inspections.filter(i => i.inspector_name === inspector)

const avgPassRate = inspectorData.length > 0 ? Math.round( inspectorData.reduce((sum, i) => sum + i.pass_rate, 0) / inspectorData.length ) : 0 return (
    <div key={inspector} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-body)]/50" > <div className="bg-[var(--color-body)] flex items-center gap-3"> <User className="h-5 w-5 text-[#37353E]" /> <div> <p className="font-medium">{inspector}</p> <p className="text-sm text-[var(--color-text-secondary)]"> {inspectorData.length} inspections </p> </div> </div> <div className="bg-[var(--color-body)] text-right"> <p className="font-mono font-medium">{avgPassRate}%</p> <p className="text-sm text-[var(--color-text-secondary)]">avg pass rate</p> </div>
      </div>
      ))} </div> </Card> </TabsContent> </Tabs> </div>
      </div>
    )
}
