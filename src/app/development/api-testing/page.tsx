'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Play,
  Zap,
  Cpu,
  Database,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Code,
  Layers,
  GitBranch,
  BarChart3,
  Gauge
} from 'lucide-react'

export default function APITestingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('phase1')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [selectedAPI, setSelectedAPI] = useState('')

  // Jobs-inspired authentication
  const handleLogin = () => {
    if (password === 'developer@123') {
      setIsAuthenticated(true)
    } else {
      // Elegant error handling - Jobs style
      const input = document.querySelector('input[type="password"]') as HTMLInputElement
      input?.classList.add('shake')
      setTimeout(() => input?.classList.remove('shake'), 600)
    }
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
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Code className="w-8 h-8 text-foreground" />
              </div>
              <h1 className="text-2xl font-light text-foreground mb-2">HERA API Laboratory</h1>
              <p className="text-gray-300 text-sm">Developer Access Portal</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-foreground/80 text-sm font-medium">
                  Access Code
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="mt-2 bg-background/10 border-border/20 text-foreground placeholder-white/50 focus:bg-background/20 transition-all duration-300"
                  placeholder="Enter developer access code"
                />
              </div>

              <Button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-foreground border-0 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02]"
              >
                Access API Laboratory
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                "Simplicity is the ultimate sophistication" - Leonardo da Vinci
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // API Test Configurations - Jobs would want these pre-configured perfectly
  const apiTests = {
    phase1: [
      {
        id: 'smart-code-validate',
        name: 'Smart Code Validation',
        icon: CheckCircle,
        endpoint: '/api/v1/smart-code/validate',
        method: 'POST',
        description: '4-Level validation system with performance benchmarks',
        defaultPayload: {
          smart_code: 'HERA.REST.FIN.TXN.SALE.V1',
          validation_level: 'L2_SEMANTIC',
          organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945'
        }
      },
      {
        id: 'smart-code-generate',
        name: 'Smart Code Generation',
        icon: Sparkles,
        endpoint: '/api/v1/smart-code/generate',
        method: 'POST',
        description: 'Intelligent code generation with industry patterns',
        defaultPayload: {
          organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
          business_context: {
            industry: 'restaurant',
            module: 'REST',
            sub_module: 'FIN',
            function_type: 'TXN',
            entity_type: 'SALE',
            business_description: 'restaurant sales transaction'
          },
          options: {
            version: 1,
            auto_validate: true,
            validation_level: 'L2_SEMANTIC'
          }
        }
      },
      {
        id: 'validation-4level',
        name: '4-Level Validation Engine',
        icon: Layers,
        endpoint: '/api/v1/validation/4-level',
        method: 'POST',
        description: 'Comprehensive validation with L1-L4 benchmarks',
        defaultPayload: {
          organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
          validation_target: {
            type: 'smart_code',
            target_id: 'test-validation-001',
            smart_code: 'HERA.REST.FIN.TXN.SALE.V1'
          },
          validation_levels: ['L1_SYNTAX', 'L2_SEMANTIC', 'L3_PERFORMANCE'],
          options: {
            auto_fix: false,
            generate_report: true,
            include_suggestions: true,
            performance_benchmarks: true
          }
        }
      }
    ],
    phase2: [
      {
        id: 'dag-execute',
        name: 'DAG Execution Engine',
        icon: GitBranch,
        endpoint: '/api/v1/dag/execute',
        method: 'POST',
        description: 'Parallel workflow processing with optimization',
        defaultPayload: {
          organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
          dag_definition: {
            dag_id: 'demo-pricing-dag',
            dag_name: 'Demo Pricing Calculation',
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
            trigger_event: 'demo_execution',
            input_data: { demo: true },
            execution_mode: 'sync',
            priority: 'normal'
          },
          optimization_options: {
            enable_parallel_execution: true,
            enable_caching: true,
            dependency_optimization: true
          }
        }
      },
      {
        id: 'templates-list',
        name: 'Template Management',
        icon: Database,
        endpoint: '/api/v1/templates',
        method: 'GET',
        description: 'Discover and manage industry templates',
        queryParams: {
          organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
          include_system: 'true',
          industry: 'restaurant,healthcare,manufacturing'
        }
      },
      {
        id: 'industry-configure',
        name: 'Industry Configuration',
        icon: Settings,
        endpoint: '/api/v1/industry/configure',
        method: 'POST',
        description: '24-hour ERP implementation engine',
        defaultPayload: {
          organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
          industry_type: 'restaurant',
          configuration_options: {
            business_model: 'casual_dining',
            deployment_mode: '24_hour_rapid',
            template_customization_level: 'standard',
            integration_requirements: ['pos', 'inventory', 'accounting']
          },
          validation_requirements: {
            industry_compliance_validation: true,
            performance_benchmarking: true,
            integration_testing: true,
            user_acceptance_testing: true
          }
        }
      }
    ]
  }

  const executeAPI = async (test: any) => {
    setLoading(true)
    setSelectedAPI(test.id)

    try {
      let url = `http://localhost:3001${test.endpoint}`

      // Add query params for GET requests
      if (test.method === 'GET' && test.queryParams) {
        const params = new URLSearchParams(test.queryParams)
        url += `?${params}`
      }

      const options: RequestInit = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      }

      if (test.method === 'POST' && test.defaultPayload) {
        options.body = JSON.stringify(test.defaultPayload)
      }

      const response = await fetch(url, options)
      const data = await response.json()

      setResults({
        ...data,
        _metadata: {
          status: response.status,
          statusText: response.statusText,
          executionTime: Date.now() - performance.now()
        }
      })
    } catch (error) {
      setResults({
        error: 'API call failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        _metadata: {
          status: 500,
          statusText: 'Internal Error'
        }
      })
    }

    setLoading(false)
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-400'
    if (status >= 400 && status < 500) return 'text-amber-400'
    return 'text-red-400'
  }

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return CheckCircle
    return XCircle
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 text-foreground">
      {/* Jobs-inspired header */}
      <div className="border-b border-border/10 bg-background/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Cpu className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-light">HERA API Laboratory</h1>
                <p className="text-sm text-muted-foreground">Developer Testing Console</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant="secondary"
                className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              >
                Phase 2 Complete
              </Badge>
              <Badge
                variant="secondary"
                className="bg-blue-500/20 text-blue-400 border-blue-500/30"
              >
                16 APIs Active
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - API Selection */}
          <div className="space-y-6">
            <Card className="bg-background/5 border-border/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>API Test Console</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Select and execute HERA-SPEAR APIs with precision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 bg-background/10">
                    <TabsTrigger value="phase1" className="data-[state=active]:bg-blue-500/30">
                      Phase 1: Smart Code
                    </TabsTrigger>
                    <TabsTrigger value="phase2" className="data-[state=active]:bg-purple-500/30">
                      Phase 2: SPEAR
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="phase1" className="space-y-3">
                    {apiTests.phase1.map(test => {
                      const Icon = test.icon
                      return (
                        <motion.div
                          key={test.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all duration-300 border ${
                              selectedAPI === test.id
                                ? 'bg-blue-500/20 border-blue-500/50'
                                : 'bg-background/5 border-border/10 hover:bg-background/10'
                            }`}
                            onClick={() => executeAPI(test)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                                  <Icon className="w-5 h-5 text-foreground" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-foreground">{test.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {test.description}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {test.method}
                                  </Badge>
                                  {loading && selectedAPI === test.id && (
                                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </TabsContent>

                  <TabsContent value="phase2" className="space-y-3">
                    {apiTests.phase2.map(test => {
                      const Icon = test.icon
                      return (
                        <motion.div
                          key={test.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all duration-300 border ${
                              selectedAPI === test.id
                                ? 'bg-purple-500/20 border-purple-500/50'
                                : 'bg-background/5 border-border/10 hover:bg-background/10'
                            }`}
                            onClick={() => executeAPI(test)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                                  <Icon className="w-5 h-5 text-foreground" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-foreground">{test.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {test.description}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {test.method}
                                  </Badge>
                                  {loading && selectedAPI === test.id && (
                                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-6">
            <Card className="bg-background/5 border-border/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Execution Results</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Real-time API response analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {results ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {/* Status Bar */}
                      <div className="flex items-center justify-between p-3 bg-background/5 rounded-lg border border-border/10">
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const StatusIcon = getStatusIcon(results._metadata?.status || 500)
                            return (
                              <StatusIcon
                                className={`w-5 h-5 ${getStatusColor(results._metadata?.status || 500)}`}
                              />
                            )
                          })()}
                          <span
                            className={`font-mono text-sm ${getStatusColor(results._metadata?.status || 500)}`}
                          >
                            {results._metadata?.status || 'Unknown'}{' '}
                            {results._metadata?.statusText || ''}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{Math.round(results._metadata?.executionTime || 0)}ms</span>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      {results.performance_metrics && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <div className="flex items-center space-x-2">
                              <Gauge className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm text-emerald-400">Execution Time</span>
                            </div>
                            <p className="text-lg font-mono text-foreground mt-1">
                              {results.total_execution_time_ms ||
                                results.performance_metrics?.total_time_ms ||
                                0}
                              ms
                            </p>
                          </div>
                          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <div className="flex items-center space-x-2">
                              <Zap className="w-4 h-4 text-blue-400" />
                              <span className="text-sm text-blue-400">Cache Performance</span>
                            </div>
                            <p className="text-lg font-mono text-foreground mt-1">
                              {results.performance_metrics?.cache_hits || 0} hits
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Results Display */}
                      <div className="relative">
                        <pre className="bg-background/30 border border-border/10 rounded-lg p-4 text-sm text-gray-300 overflow-auto max-h-96 font-mono">
                          {JSON.stringify(results, null, 2)}
                        </pre>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-9000 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <Code className="w-8 h-8 text-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Select an API to test
                      </h3>
                      <p className="text-muted-foreground">
                        Choose from Phase 1 or Phase 2 APIs to see live results
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Status Bar - Jobs would want this */}
        <div className="mt-8 p-4 bg-background/20 rounded-xl border border-border/10">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                All Systems Operational
              </Badge>
              <span className="text-muted-foreground">
                HERA System Organization: 719dfed1-09b4-4ca8-bfda-f682460de945
              </span>
            </div>
            <div className="text-muted-foreground">
              "Simplicity is the ultimate sophistication" - Steve Jobs
            </div>
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
