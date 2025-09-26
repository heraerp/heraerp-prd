'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Brain, 
  Search,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Users,
  Mail,
  FileText,
  BarChart3,
  Sparkles,
  Building2,
  Target,
  Zap,
  Info
} from 'lucide-react'
import { ISPAIManager } from '@/lib/isp-ai-manager/ISPAIManager'
import type { AIManagerResponse } from '@/types/ai-manager'

export default function AIManagerPage() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<AIManagerResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('query')

  // Initialize AI Manager
  const aiManager = new ISPAIManager({
    model: 'gpt-3.5-turbo',
    temperature: 0.7
  })

  const handleQuery = async () => {
    if (!query.trim()) return
    
    setIsLoading(true)
    try {
      const result = await aiManager.processQuery({ 
        query,
        context: {
          userId: 'user-123',
          organizationId: 'india-vision-isp'
        }
      })
      setResponse(result)
      setActiveTab('response')
    } catch (error) {
      console.error('Query failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exampleQueries = [
    {
      category: 'Network Analytics',
      icon: <TrendingUp className="h-4 w-4" />,
      queries: [
        'What is the current network uptime across all regions?',
        'Show network latency trends for the past week',
        'Which areas need network capacity upgrades?'
      ]
    },
    {
      category: 'Subscriber Insights',
      icon: <Users className="h-4 w-4" />,
      queries: [
        'Show subscriber growth trends for this month',
        'What is the current churn rate and main reasons?',
        'Which plans have the highest customer satisfaction?'
      ]
    },
    {
      category: 'Revenue Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      queries: [
        'Analyze revenue by service type',
        'Show monthly revenue vs target',
        'Which services have the highest profit margins?'
      ]
    },
    {
      category: 'IPO Readiness',
      icon: <Target className="h-4 w-4" />,
      queries: [
        'What is our current IPO readiness score?',
        'Show compliance gaps that need attention',
        'Timeline for completing IPO requirements'
      ]
    }
  ]

  const renderMetrics = (metrics: any) => {
    if (Array.isArray(metrics)) {
      return (
        <div className="space-y-1">
          {metrics.map((item, i) => (
            <div key={i} className="text-sm">{JSON.stringify(item)}</div>
          ))}
        </div>
      )
    }
    
    return (
      <div className="space-y-2">
        {Object.entries(metrics).map(([key, value]: [string, any]) => (
          <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="font-medium text-sm">{key}</span>
            <div className="flex items-center gap-2 text-sm">
              {value.actual && <span className="font-semibold">{value.actual}</span>}
              {value.target && <span className="text-gray-500">/ {value.target}</span>}
              {value.variance && <span className="text-gray-600">({value.variance})</span>}
              {value.rag && <span className="text-lg">{value.rag}</span>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-[#0099CC]" />
            AI Manager for India Vision
          </h1>
          <p className="text-gray-600 mt-1">
            Intelligent insights for network operations, subscriber analytics, and business intelligence
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Sparkles className="h-3 w-3 mr-1" />
          Beta
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="query">Query</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
          <TabsTrigger value="tools">Data Sources</TabsTrigger>
          <TabsTrigger value="insights">Proactive Insights</TabsTrigger>
        </TabsList>

        {/* Query Tab */}
        <TabsContent value="query" className="space-y-4">
          {/* Search Box */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Ask about programmes, partners, KPIs, engagement, or finances..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                    className="text-lg"
                  />
                </div>
                <Button 
                  onClick={handleQuery}
                  disabled={isLoading || !query.trim()}
                  size="lg"
                >
                  <Search className="h-5 w-5 mr-2" />
                  {isLoading ? 'Processing...' : 'Ask'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Example Queries */}
          <div className="grid grid-cols-2 gap-4">
            {exampleQueries.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {category.icon}
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.queries.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(q)}
                        className="block w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Response Tab */}
        <TabsContent value="response" className="space-y-4">
          {response ? (
            <>
              {/* Answer */}
              <Card>
                <CardHeader>
                  <CardTitle>Answer</CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(response.answer) ? (
                    <ul className="space-y-2">
                      {response.answer.map((point, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-[#0099CC] mr-2">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-800 dark:text-gray-200">{response.answer}</p>
                  )}
                </CardContent>
              </Card>

              {/* Metrics */}
              {Object.keys(response.metrics).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderMetrics(response.metrics)}
                  </CardContent>
                </Card>
              )}

              {/* Suggestions */}
              {response.suggestions && response.suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-600" />
                      Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {response.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-yellow-600 mr-2">💡</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Insights */}
              {response.insights && response.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-600" />
                      Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {response.insights.map((insight, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-yellow-600 mr-2">💡</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              {response.actions && response.actions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-green-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {response.actions.map((action, i) => (
                        <Button 
                          key={i}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            if (action.action === 'navigate' && action.params?.to) {
                              window.location.href = action.params.to
                            }
                          }}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommended Actions */}
              {response.recommended_actions && response.recommended_actions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-green-600" />
                      Recommended Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {response.recommended_actions.map((action, i) => (
                        <div key={i} className="flex items-start p-3 bg-green-50 dark:bg-green-950 rounded">
                          <span className="text-green-600 mr-3 font-bold">{i + 1}.</span>
                          <div className="flex-1">
                            <p className="font-medium">{action.action}</p>
                            <div className="flex gap-4 mt-1 text-sm text-gray-600">
                              {action.owner && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {action.owner}
                                </span>
                              )}
                              {action.eta && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {action.eta}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sources & Confidence */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Data Sources Used</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {response.sources.map((source, i) => (
                        <div key={i} className="text-sm text-gray-600">
                          {source}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {response.confidence && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Confidence Level</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${response.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round(response.confidence * 100)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No Response Yet</AlertTitle>
              <AlertDescription>
                Ask a question to see AI-powered insights and recommendations
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Data Sources Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Network Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Real-time network status, uptime metrics, SNMP data, performance analytics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  CRM Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Subscriber profiles, service plans, support tickets, agent data
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Billing System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Invoices, payments, revenue streams, ARPU calculations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Analytics Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Usage patterns, growth trends, churn analysis, predictive models
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Compliance System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  SEBI requirements, audit reports, regulatory filings, IPO readiness
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Financial System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  P&L statements, cash flow, budgets, financial projections
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Proactive Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Proactive Insights Schedule</AlertTitle>
            <AlertDescription>
              AI Manager runs scheduled analyses to surface important information before you need to ask
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weekly Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-blue-600" />
                    Network capacity alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-blue-600" />
                    Churn risk predictions
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-blue-600" />
                    Agent performance rankings
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-green-600" />
                    Revenue trend analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-green-600" />
                    Service area expansion opportunities
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-green-600" />
                    Competitive benchmarking
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quarterly Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-purple-600" />
                    IPO readiness assessment
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-purple-600" />
                    Infrastructure investment ROI
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-purple-600" />
                    Market growth forecasts
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}