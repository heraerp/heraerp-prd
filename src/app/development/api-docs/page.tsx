'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Book,
  Code,
  Search,
  Copy,
  CheckCircle,
  Zap,
  Database,
  GitBranch,
  Settings,
  Layers,
  BarChart3,
  TrendingUp,
  Cpu,
  Play
} from 'lucide-react'

export default function APIDocsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEndpoint, setSelectedEndpoint] = useState('smart-code-validate')
  const [copiedCode, setCopiedCode] = useState('')

  const handleLogin = () => {
    if (password === 'developer@123') {
      setIsAuthenticated(true)
    } else {
      const input = document.querySelector('input[type="password"]') as HTMLInputElement
      input?.classList.add('shake')
      setTimeout(() => input?.classList.remove('shake'), 600)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-background/10 backdrop-blur-xl rounded-3xl border border-border/20 shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Book className="w-8 h-8 text-foreground" />
              </div>
              <h1 className="text-2xl font-light text-foreground mb-2">HERA API Documentation</h1>
              <p className="text-gray-300 text-sm">Developer Reference Portal</p>
            </div>

            <div className="space-y-4">
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="bg-background/10 border-border/20 text-foreground placeholder-white/50 focus:bg-background/20"
                placeholder="Enter developer access code"
              />

              <Button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-foreground border-0 py-3 rounded-xl font-medium"
              >
                Access Documentation
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Complete API documentation - Jobs would want this to be comprehensive and beautiful
  const apiDocumentation = {
    phase1: [
      {
        id: 'smart-code-validate',
        name: 'Smart Code Validation',
        endpoint: '/api/v1/smart-code/validate',
        method: 'POST',
        icon: CheckCircle,
        description:
          'Validates smart codes using 4-level validation system (L1-L4) with performance benchmarks',
        sapEquivalent: 'SAP Data Quality Management + Validation Framework',
        performanceBenchmark: '< 50ms for L2_SEMANTIC validation',
        request: {
          smart_code: 'string (required) - Smart code to validate',
          validation_level:
            'enum (optional) - L1_SYNTAX | L2_SEMANTIC | L3_PERFORMANCE | L4_INTEGRATION',
          organization_id: 'string (optional) - Organization context for validation'
        },
        response: {
          is_valid: 'boolean - Validation result',
          validation_level: 'string - Level of validation performed',
          errors: 'array - List of validation errors',
          warnings: 'array - List of warnings',
          suggestions: 'array - Optimization suggestions',
          metadata: 'object - Parsed smart code components',
          performance_metrics: 'object - Validation timing and complexity'
        },
        example: `curl -X POST "http://localhost:3001/api/v1/smart-code/validate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "smart_code": "HERA.REST.FIN.TXN.SALE.V1",
    "validation_level": "L2_SEMANTIC",
    "organization_id": "719dfed1-09b4-4ca8-bfda-f682460de945"
  }'`
      },
      {
        id: 'smart-code-generate',
        name: 'Smart Code Generation',
        endpoint: '/api/v1/smart-code/generate',
        method: 'POST',
        icon: Zap,
        description:
          'Generates industry-specific smart codes with automatic validation and similar code detection',
        sapEquivalent: 'SAP Code Generation Framework + Business Object Builder',
        performanceBenchmark: '< 100ms with auto-validation',
        request: {
          organization_id: 'string (required) - Target organization',
          business_context: 'object (required) - Industry and module context',
          options: 'object (optional) - Generation and validation options'
        },
        response: {
          generated_smart_code: 'string - Generated smart code',
          is_valid: 'boolean - Auto-validation result',
          validation_results: 'object - Detailed validation output',
          metadata: 'object - Generation context and timing',
          suggestions: 'array - Related code suggestions',
          similar_codes: 'array - Existing similar codes'
        },
        example: `curl -X POST "http://localhost:3001/api/v1/smart-code/generate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "organization_id": "719dfed1-09b4-4ca8-bfda-f682460de945",
    "business_context": {
      "industry": "restaurant",
      "module": "REST",
      "sub_module": "FIN",
      "function_type": "TXN",
      "entity_type": "SALE"
    }
  }'`
      },
      {
        id: 'validation-4level',
        name: '4-Level Validation Engine',
        endpoint: '/api/v1/validation/4-level',
        method: 'POST',
        icon: Layers,
        description:
          'Comprehensive validation engine supporting entities, transactions, BOMs, pricing, and DAGs',
        sapEquivalent: 'SAP Data Quality Management + Process Validation + Performance Testing',
        performanceBenchmark: 'L1:<10ms, L2:<50ms, L3:<100ms, L4:<200ms',
        request: {
          organization_id: 'string (required) - Organization context',
          validation_target: 'object (required) - Target to validate',
          validation_levels: 'array (required) - Levels to execute',
          options: 'object (optional) - Validation options'
        },
        response: {
          validation_id: 'string - Unique validation identifier',
          overall_result: 'enum - PASSED | FAILED | PARTIAL',
          total_execution_time_ms: 'number - Total execution time',
          results: 'array - Results for each validation level',
          performance_summary: 'object - Performance benchmarks',
          suggestions: 'array - Optimization recommendations',
          certification: 'object - Validation certification details'
        },
        example: `curl -X POST "http://localhost:3001/api/v1/validation/4-level" \\
  -H "Content-Type: application/json" \\
  -d '{
    "organization_id": "719dfed1-09b4-4ca8-bfda-f682460de945",
    "validation_target": {
      "type": "smart_code",
      "target_id": "test-001",
      "smart_code": "HERA.REST.FIN.TXN.SALE.V1"
    },
    "validation_levels": ["L1_SYNTAX", "L2_SEMANTIC"]
  }'`
      }
    ],
    phase2: [
      {
        id: 'dag-execute',
        name: 'DAG Execution Engine',
        endpoint: '/api/v1/dag/execute',
        method: 'POST',
        icon: GitBranch,
        description:
          'Universal workflow processing with intelligent dependency resolution and parallel execution',
        sapEquivalent: 'SAP Workflow Engine + Business Process Management + Parallel Processing',
        performanceBenchmark: '< 100ms for complex DAGs with parallel optimization',
        request: {
          organization_id: 'string (required) - Organization context',
          dag_definition: 'object (required) - DAG structure and nodes',
          execution_context: 'object (required) - Execution parameters',
          optimization_options: 'object (optional) - Performance optimizations',
          monitoring_options: 'object (optional) - Monitoring settings'
        },
        response: {
          execution_id: 'string - Unique execution identifier',
          execution_status: 'enum - COMPLETED | FAILED | PARTIAL | RUNNING',
          total_execution_time_ms: 'number - Total execution time',
          execution_results: 'object - Results for each node',
          performance_metrics: 'object - Execution performance data',
          optimization_results: 'object - Optimization analysis',
          final_output: 'any - Final calculation result'
        },
        example: `curl -X POST "http://localhost:3001/api/v1/dag/execute" \\
  -H "Content-Type: application/json" \\
  -d '{
    "organization_id": "719dfed1-09b4-4ca8-bfda-f682460de945",
    "dag_definition": {
      "dag_id": "pricing-dag",
      "nodes": [
        {
          "node_id": "cost_calc",
          "node_type": "calculation",
          "execution_config": {
            "function_name": "calculate_cost",
            "parameters": {"base_amount": 100}
          }
        }
      ]
    },
    "execution_context": {
      "trigger_event": "test",
      "execution_mode": "sync"
    }
  }'`
      },
      {
        id: 'templates-list',
        name: 'Template Management',
        endpoint: '/api/v1/templates',
        method: 'GET/POST',
        icon: Database,
        description:
          'Complete template lifecycle management with copy, customize, and validation capabilities',
        sapEquivalent: 'SAP Template Management + Configuration + Transport System',
        performanceBenchmark: '< 200ms for template operations',
        request: {
          organization_id: 'string (optional) - Organization filter',
          template_types: 'array (optional) - Template type filter',
          include_system: 'boolean (optional) - Include system templates',
          industry: 'array (optional) - Industry filter'
        },
        response: {
          templates_by_type: 'object - Templates grouped by type',
          total_templates: 'number - Total template count',
          system_templates: 'number - System template count',
          hera_advantages: 'object - HERA vs SAP comparison'
        },
        example: `# List Templates
curl -X GET "http://localhost:3001/api/v1/templates?include_system=true&industry=restaurant"

# Copy Templates  
curl -X POST "http://localhost:3001/api/v1/templates" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "copy",
    "source_organization_id": "719dfed1-09b4-4ca8-bfda-f682460de945",
    "target_organization_id": "target-org-id",
    "template_codes": ["TEMPLATE-BOM-REST-001"]
  }'`
      },
      {
        id: 'bom-calculate',
        name: 'BOM Calculation Engine',
        endpoint: '/api/v1/bom/calculate',
        method: 'POST',
        icon: BarChart3,
        description:
          'SAP PC Module equivalent with real-time costing, variance analysis, and optimization',
        sapEquivalent: 'SAP PC (Product Cost Management) + Material Ledger + CO-PA',
        performanceBenchmark: '< 200ms vs SAP 30-60 seconds',
        request: {
          organization_id: 'string (required) - Organization context',
          bom_data: 'object (required) - BOM calculation parameters',
          cost_components: 'object (optional) - Cost component options',
          sap_compatibility: 'object (optional) - SAP compatibility settings'
        },
        response: {
          calculation_id: 'string - Unique calculation identifier',
          total_cost: 'number - Total calculated cost',
          cost_breakdown: 'object - Detailed cost analysis',
          sap_equivalent_data: 'object - SAP format data',
          ai_insights: 'object - Cost optimization suggestions',
          performance_metrics: 'object - Calculation performance'
        },
        example: `curl -X POST "http://localhost:3001/api/v1/bom/calculate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "organization_id": "719dfed1-09b4-4ca8-bfda-f682460de945",
    "bom_data": {
      "item_id": "BURGER-001",
      "item_name": "Classic Burger",
      "quantity": 100,
      "calculation_type": "standard_cost",
      "costing_method": "full_absorption"
    }
  }'`
      },
      {
        id: 'pricing-calculate',
        name: 'Pricing Calculation Engine',
        endpoint: '/api/v1/pricing/calculate',
        method: 'POST',
        icon: TrendingUp,
        description:
          'SAP CO-PA + SD Pricing equivalent with dynamic pricing and profitability analysis',
        sapEquivalent: 'SAP CO-PA + SD Pricing + Condition Technique + CRM Pricing',
        performanceBenchmark: '< 150ms vs SAP 5-10 minutes',
        request: {
          organization_id: 'string (required) - Organization context',
          pricing_data: 'object (required) - Pricing calculation parameters',
          pricing_components: 'object (optional) - Pricing component options',
          dag_execution: 'object (optional) - DAG optimization settings'
        },
        response: {
          calculation_id: 'string - Unique calculation identifier',
          final_price: 'number - Final calculated price',
          pricing_breakdown: 'object - Detailed pricing analysis',
          profitability_analysis: 'object - Margin and profitability data',
          sap_equivalent_data: 'object - SAP format pricing data',
          dag_execution_metadata: 'object - DAG performance metrics'
        },
        example: `curl -X POST "http://localhost:3001/api/v1/pricing/calculate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "organization_id": "719dfed1-09b4-4ca8-bfda-f682460de945",
    "pricing_data": {
      "product_id": "BURGER-001",
      "quantity": 50,
      "calculation_type": "dynamic_pricing",
      "pricing_method": "cost_plus"
    }
  }'`
      },
      {
        id: 'industry-configure',
        name: 'Industry Configuration Engine',
        endpoint: '/api/v1/industry/configure',
        method: 'POST',
        icon: Settings,
        description:
          '24-hour ERP implementation with complete SAP migration and industry-specific deployment',
        sapEquivalent: 'SAP Implementation + Industry Solutions + Migration Tools',
        performanceBenchmark: '24 hours vs SAP 12-21 months (95% faster)',
        request: {
          organization_id: 'string (required) - Target organization',
          industry_type: 'enum (required) - Industry selection',
          configuration_options: 'object (required) - Deployment configuration',
          sap_migration: 'object (optional) - SAP migration settings',
          validation_requirements: 'object (optional) - Validation settings'
        },
        response: {
          configuration_id: 'string - Configuration identifier',
          deployment_plan: 'object - 24-hour implementation plan',
          sap_replacement_analysis: 'object - SAP module replacement analysis',
          go_live_checklist: 'object - Go-live validation checklist',
          support_framework: 'object - Ongoing support plan'
        },
        example: `curl -X POST "http://localhost:3001/api/v1/industry/configure" \\
  -H "Content-Type: application/json" \\
  -d '{
    "organization_id": "719dfed1-09b4-4ca8-bfda-f682460de945",
    "industry_type": "restaurant",
    "configuration_options": {
      "business_model": "casual_dining",
      "deployment_mode": "24_hour_rapid",
      "template_customization_level": "standard"
    }
  }'`
      }
    ]
  }

  const filteredDocs = (docs: any[]) => {
    if (!searchTerm) return docs
    return docs.filter(
      doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.endpoint.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const selectedDoc = [...apiDocumentation.phase1, ...apiDocumentation.phase2].find(
    doc => doc.id === selectedEndpoint
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 text-foreground">
      {/* Header */}
      <div className="border-b border-border/10 bg-background/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Book className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-light">HERA API Documentation</h1>
                <p className="text-sm text-muted-foreground">Complete Developer Reference</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search APIs..."
                  className="pl-10 bg-background/10 border-border/20 text-foreground placeholder-white/50 w-64"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - API List */}
          <div className="lg:col-span-1">
            <Card className="bg-background/5 border-border/10 backdrop-blur-xl sticky top-6">
              <CardHeader>
                <CardTitle className="text-foreground text-lg">API Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Tabs defaultValue="phase1" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 bg-background/10">
                    <TabsTrigger value="phase1" className="text-xs">
                      Phase 1
                    </TabsTrigger>
                    <TabsTrigger value="phase2" className="text-xs">
                      Phase 2
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="phase1" className="space-y-2">
                    {filteredDocs(apiDocumentation.phase1).map(doc => {
                      const Icon = doc.icon
                      return (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedEndpoint(doc.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedEndpoint === doc.id
                              ? 'bg-blue-500/20 border-blue-500/50'
                              : 'bg-background/5 border-border/10 hover:bg-background/10'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4 text-blue-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {doc.name}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {doc.method}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </TabsContent>

                  <TabsContent value="phase2" className="space-y-2">
                    {filteredDocs(apiDocumentation.phase2).map(doc => {
                      const Icon = doc.icon
                      return (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedEndpoint(doc.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedEndpoint === doc.id
                              ? 'bg-purple-500/20 border-purple-500/50'
                              : 'bg-background/5 border-border/10 hover:bg-background/10'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4 text-purple-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {doc.name}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {doc.method}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Selected API Documentation */}
          <div className="lg:col-span-3">
            {selectedDoc && (
              <div className="space-y-6">
                {/* API Header */}
                <Card className="bg-background/5 border-border/10 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <selectedDoc.icon className="w-6 h-6 text-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-foreground text-xl">
                            {selectedDoc.name}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-mono text-xs">
                              {selectedDoc.method}
                            </Badge>
                            <code className="text-sm text-muted-foreground bg-background/10 px-2 py-1 rounded">
                              {selectedDoc.endpoint}
                            </code>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(selectedDoc.endpoint, selectedDoc.id)}
                        variant="outline"
                        size="sm"
                        className="bg-background/10 border-border/20 text-foreground hover:bg-background/20"
                      >
                        {copiedCode === selectedDoc.id ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <CardDescription className="text-gray-300 text-base mt-3">
                      {selectedDoc.description}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Performance & SAP Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-emerald-500/10 border-emerald-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">Performance</span>
                      </div>
                      <p className="text-sm text-gray-300">{selectedDoc.performanceBenchmark}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Database className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-amber-400">SAP Equivalent</span>
                      </div>
                      <p className="text-sm text-gray-300">{selectedDoc.sapEquivalent}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Request/Response Documentation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Request */}
                  <Card className="bg-background/5 border-border/10">
                    <CardHeader>
                      <CardTitle className="text-foreground text-lg">Request Parameters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(selectedDoc.request).map(([key, value]) => (
                        <div key={key} className="p-3 bg-background/5 rounded-lg">
                          <div className="flex items-start justify-between mb-1">
                            <code className="text-blue-400 font-mono text-sm">{key}</code>
                          </div>
                          <p className="text-xs text-muted-foreground">{value as string}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Response */}
                  <Card className="bg-background/5 border-border/10">
                    <CardHeader>
                      <CardTitle className="text-foreground text-lg">Response Fields</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(selectedDoc.response).map(([key, value]) => (
                        <div key={key} className="p-3 bg-background/5 rounded-lg">
                          <div className="flex items-start justify-between mb-1">
                            <code className="text-emerald-400 font-mono text-sm">{key}</code>
                          </div>
                          <p className="text-xs text-muted-foreground">{value as string}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Code Example */}
                <Card className="bg-background/5 border-border/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground text-lg flex items-center space-x-2">
                        <Play className="w-5 h-5" />
                        <span>Example Usage</span>
                      </CardTitle>
                      <Button
                        onClick={() =>
                          copyToClipboard(selectedDoc.example, `example-${selectedDoc.id}`)
                        }
                        variant="outline"
                        size="sm"
                        className="bg-background/10 border-border/20 text-foreground hover:bg-background/20"
                      >
                        {copiedCode === `example-${selectedDoc.id}` ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-background/30 border border-border/10 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto font-mono">
                      <code>{selectedDoc.example}</code>
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .shake {
          animation: shake 0.6s ease-in-out;
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
      `}</style>
    </div>
  )
}
