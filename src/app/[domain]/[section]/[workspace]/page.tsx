/**
 * Universal Workspace Page
 * Smart Code: HERA.UNIVERSAL.WORKSPACE.OVERVIEW.v1
 * 
 * Dynamic workspace page that works for ANY domain/section/workspace combination
 * Route: /[domain]/[section]/[workspace]
 * Examples: /retail/pos/main, /wholesale/ordering/processing, /finance/accounting/main
 * 
 * NOTE: NO /apps prefix - direct universal routing only
 */

'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  ArrowRight, 
  Loader2, 
  AlertTriangle,
  ShoppingBag,
  Package,
  DollarSign,
  Factory,
  Users,
  CreditCard,
  Tags,
  ShoppingCart,
  Book,
  Calculator,
  BarChart3,
  LayoutDashboard,
  Smartphone,
  Cog,
  Building2,
  Database,
  FileText,
  Settings,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Globe
} from 'lucide-react'
import { resolveUniversalConfig, generateUniversalSmartCode, generateUniversalBreadcrumbs, UNIVERSAL_CONFIG } from '@/lib/universal/config'

// Icon mapping for dynamic icon rendering
const iconMap = {
  'ShoppingBag': ShoppingBag,
  'Package': Package,
  'DollarSign': DollarSign,
  'Factory': Factory,
  'Users': Users,
  'CreditCard': CreditCard,
  'Tags': Tags,
  'ShoppingCart': ShoppingCart,
  'Book': Book,
  'Calculator': Calculator,
  'BarChart3': BarChart3,
  'LayoutDashboard': LayoutDashboard,
  'Smartphone': Smartphone,
  'Cog': Cog,
  'Building2': Building2,
  'Database': Database,
  'FileText': FileText,
  'Settings': Settings,
  'Edit': Settings // Fallback for Edit icon
}

export default function UniversalWorkspacePage() {
  const router = useRouter()
  const params = useParams()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [activeTab, setActiveTab] = useState('entities')
  
  const domain = params.domain as string
  const section = params.section as string
  const workspace = params.workspace as string

  // Three-layer auth check
  if (!isAuthenticated) return <Alert><AlertDescription>Please log in</AlertDescription></Alert>
  if (contextLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!organization?.id) return <Alert><AlertDescription>No organization context</AlertDescription></Alert>

  // Resolve universal configuration
  const config = resolveUniversalConfig(domain, section, workspace)
  
  if (!config.domain) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Domain "{domain}" not found. Available domains: {UNIVERSAL_CONFIG.domains.map(d => d.name).join(', ')}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/')} className="mt-4">
          ← Back to Home
        </Button>
      </div>
    )
  }

  if (!config.section) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Section "{section}" not found in domain "{domain}". Available sections: {UNIVERSAL_CONFIG.sections.filter(s => s.domains.includes(domain)).map(s => s.name).join(', ')}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push(`/${domain}`)} className="mt-4">
          ← Back to {config.domain.name}
        </Button>
      </div>
    )
  }

  if (!config.workspace) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Workspace "{workspace}" not found. Available workspaces: {UNIVERSAL_CONFIG.workspaces.filter(w => w.sections.includes(section) && w.domains.includes(domain)).map(w => w.name).join(', ')}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push(`/${domain}/${section}`)} className="mt-4">
          ← Back to {config.section.name}
        </Button>
      </div>
    )
  }

  // Get breadcrumbs
  const breadcrumbs = generateUniversalBreadcrumbs(domain, section, workspace)

  // Get icons
  const DomainIcon = iconMap[config.domain.icon.name as keyof typeof iconMap] || Package
  const SectionIcon = iconMap[config.section.icon.name as keyof typeof iconMap] || Package
  const WorkspaceIcon = iconMap[config.workspace.icon.name as keyof typeof iconMap] || LayoutDashboard

  const handleBackClick = () => {
    router.push(`/${domain}/${section}`)
  }

  const handleEntityClick = (entityId: string) => {
    // Navigate to entity management (NO /apps prefix)
    router.push(`/${domain}/${section}/${workspace}/entities/${entityId}`)
  }

  const handleTransactionClick = (transactionId: string) => {
    // Navigate to transaction management (NO /apps prefix)
    router.push(`/${domain}/${section}/${workspace}/transactions/${transactionId}`)
  }

  const handleWorkflowClick = (workflowId: string) => {
    // Navigate to workflow management (NO /apps prefix)
    router.push(`/${domain}/${section}/${workspace}/workflows/${workflowId}`)
  }

  const handleAnalyticsClick = (analyticsId: string) => {
    // Navigate to analytics (NO /apps prefix)
    router.push(`/${domain}/${section}/${workspace}/analytics/${analyticsId}`)
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span>/</span>}
            <button
              onClick={() => router.push(crumb.href)}
              className="hover:text-blue-600 transition-colors"
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Workspace Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleBackClick}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {config.section.name}
          </Button>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-xl bg-${config.workspace.color}-100`}>
            <WorkspaceIcon className={`w-8 h-8 text-${config.workspace.color}-600`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {config.workspace.name}
            </h1>
            <p className="text-gray-600">
              {config.workspace.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {config.workspace.personaLabel}
          </Badge>
          <Badge variant="outline">
            {config.domain.name} • {config.section.name} • {config.workspace.name}
          </Badge>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="mb-8">
        <Card className={`border-l-4 border-l-${config.workspace.color}-500 bg-gradient-to-r from-${config.workspace.color}-50 to-${config.workspace.color}-100`}>
          <CardContent className="pt-6">
            <h2 className={`text-xl font-semibold text-${config.workspace.color}-900 mb-2`}>
              Welcome to {config.workspace.name}
            </h2>
            <p className={`text-${config.workspace.color}-700`}>
              Access and manage {config.section.name.toLowerCase()} operations through this workspace. 
              Use the tabs below to navigate between entities, transactions, workflows, and analytics.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Entities Tab */}
        <TabsContent value="entities" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Available Entity Types</h3>
            <p className="text-gray-600">Manage master data and entities available in this workspace.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.entityTypes.map((entityType) => {
              const EntityIcon = iconMap[entityType.icon.name as keyof typeof iconMap] || Database
              
              return (
                <Card 
                  key={entityType.id}
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleEntityClick(entityType.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${entityType.color}-50`}>
                          <EntityIcon className={`w-5 h-5 text-${entityType.color}-600`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{entityType.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">{entityType.fields.length} fields</Badge>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-3">{entityType.description}</p>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700">Available Actions:</div>
                      <div className="flex flex-wrap gap-1">
                        {entityType.actions.map((action) => (
                          <Badge key={action} variant="secondary" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Available Transaction Types</h3>
            <p className="text-gray-600">Process business transactions and manage operational data.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.transactionTypes.map((transactionType) => {
              const TransactionIcon = iconMap[transactionType.icon.name as keyof typeof iconMap] || FileText
              
              return (
                <Card 
                  key={transactionType.id}
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleTransactionClick(transactionType.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${transactionType.color}-50`}>
                          <TransactionIcon className={`w-5 h-5 text-${transactionType.color}-600`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{transactionType.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {transactionType.hasLines ? 'Multi-line' : 'Single'}
                          </Badge>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-3">{transactionType.description}</p>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700">Status Flow:</div>
                      <div className="flex flex-wrap gap-1">
                        {transactionType.statuses.map((status) => (
                          <Badge key={status} variant="secondary" className="text-xs">
                            {status}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Available Workflow Types</h3>
            <p className="text-gray-600">Automate business processes and manage operational workflows.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.workflowTypes.map((workflowType) => {
              const WorkflowIcon = iconMap[workflowType.icon.name as keyof typeof iconMap] || Zap
              
              return (
                <Card 
                  key={workflowType.id}
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleWorkflowClick(workflowType.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${workflowType.color}-50`}>
                          <WorkflowIcon className={`w-5 h-5 text-${workflowType.color}-600`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{workflowType.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">{workflowType.steps.length} steps</Badge>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-3">{workflowType.description}</p>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700">Triggers:</div>
                      <div className="flex flex-wrap gap-1">
                        {workflowType.triggers.map((trigger) => (
                          <Badge key={trigger} variant="secondary" className="text-xs">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Available Relationship Types</h3>
            <p className="text-gray-600">Define and manage relationships between entities.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.relationshipTypes.map((relationshipType) => (
              <Card key={relationshipType.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <Globe className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{relationshipType.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">{relationshipType.cardinality}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-3">{relationshipType.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Source Types:</div>
                      {relationshipType.sourceTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs mr-1 mb-1">
                          {type}
                        </Badge>
                      ))}
                    </div>
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Target Types:</div>
                      {relationshipType.targetTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs mr-1 mb-1">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Available Analytics Types</h3>
            <p className="text-gray-600">View reports and analyze business performance.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.analyticsTypes.map((analyticsType) => {
              const AnalyticsIcon = iconMap[analyticsType.icon.name as keyof typeof iconMap] || TrendingUp
              
              return (
                <Card 
                  key={analyticsType.id}
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleAnalyticsClick(analyticsType.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${analyticsType.color}-50`}>
                          <AnalyticsIcon className={`w-5 h-5 text-${analyticsType.color}-600`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{analyticsType.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">{analyticsType.chartTypes.length} charts</Badge>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-3">{analyticsType.description}</p>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700">Chart Types:</div>
                      <div className="flex flex-wrap gap-1">
                        {analyticsType.chartTypes.map((chartType) => (
                          <Badge key={chartType} variant="secondary" className="text-xs">
                            {chartType}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Workspace Overview Stats */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Workspace Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-2xl font-bold text-${config.workspace.color}-600`}>
                  {config.entityTypes.length}
                </div>
                <div className="text-sm text-gray-600">Entity Types</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {config.transactionTypes.length}
                </div>
                <div className="text-sm text-gray-600">Transaction Types</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {config.workflowTypes.length}
                </div>
                <div className="text-sm text-gray-600">Workflow Types</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {config.relationshipTypes.length}
                </div>
                <div className="text-sm text-gray-600">Relationship Types</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {config.analyticsTypes.length}
                </div>
                <div className="text-sm text-gray-600">Analytics Types</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Domain:</strong> {domain}</div>
            <div><strong>Section:</strong> {section}</div>
            <div><strong>Workspace:</strong> {workspace}</div>
            <div><strong>Smart Code:</strong> {generateUniversalSmartCode(domain, section, workspace, 'OVERVIEW')}</div>
            <div><strong>Visible Roles:</strong> {config.workspace.visibleRoles.join(', ')}</div>
            <div><strong>Organization ID:</strong> {organization.id}</div>
            <div><strong>User ID:</strong> {user?.id}</div>
            <div><strong>Route Pattern:</strong> /{domain}/{section}/{workspace} (NO /apps prefix)</div>
          </div>
        </div>
      )}
    </div>
  )
}