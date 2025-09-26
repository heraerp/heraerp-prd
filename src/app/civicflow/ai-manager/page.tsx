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
import { CivicFlowAIManager } from '@/lib/civicflow-ai-manager/core/manager'
import type { AIManagerResponse } from '@/types/civicflow-ai-manager'

export default function CivicFlowAIManagerPage() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<AIManagerResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('query')

  // Initialize AI Manager with mock permissions
  const aiManager = new CivicFlowAIManager(
    'user-123',
    'org-456', 
    ['crm.contact.read', 'crm.org.read', 'crm.programme.read', 'crm.fund.read']
  )

  const handleQuery = async () => {
    if (!query.trim()) return
    
    setIsLoading(true)
    try {
      const result = await aiManager.processQuery(query)
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
      category: 'Programme Tracking',
      icon: <TrendingUp className="h-4 w-4" />,
      queries: [
        'How is Flexible Finance tracking vs plan this quarter?',
        'Quarterly overview for Enterprise Grants: KPIs vs targets',
        'Show programme performance dashboard'
      ]
    },
    {
      category: 'Risk & Compliance',
      icon: <AlertTriangle className="h-4 w-4" />,
      queries: [
        'Which partners are at risk on matched finance?',
        'Partners underperforming on IMD reach (deciles 1-3) vs commitment',
        'Variations requested in last 60 days and their approval status'
      ]
    },
    {
      category: 'Engagement Analytics',
      icon: <Users className="h-4 w-4" />,
      queries: [
        'Top LinkedIn content engaging foundations last month?',
        'Events with highest conversion to meetings within 30 days',
        'Show orgs in IMD deciles 1-3 with no touchpoints in 90d'
      ]
    },
    {
      category: 'Committee Briefings',
      icon: <FileText className="h-4 w-4" />,
      queries: [
        'Brief me before the Blended Finance Investment Committee',
        'Prepare stakeholder brief for ABC Foundation',
        'Upcoming drawdowns due in 10 days; flag documentation gaps'
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
              {value.target && <span className="text-text-300">/ {value.target}</span>}
              {value.variance && <span className="text-text-200">({value.variance})</span>}
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
            <Brain className="h-8 w-8 text-blue-600" />
            AI Manager for CivicFlow
          </h1>
          <p className="text-text-200 mt-1">
            Fast answers, proactive insights, and guided actions across programmes, grants, and relationships
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
                  className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white disabled:opacity-50"
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
                  <ul className="space-y-2">
                    {response.answer.map((point, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
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

              {/* Insights */}
              {response.insights.length > 0 && (
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

              {/* Recommended Actions */}
              {response.recommended_actions.length > 0 && (
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
                            <div className="flex gap-4 mt-1 text-sm text-text-300">
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
                        <div key={i} className="text-sm text-text-300">
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
                  CRM Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-300">
                  Contacts, organisations, programmes, funds, applications, agreements, events
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email & Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-300">
                  Meeting attendance, thread summaries, touchpoints via Microsoft Graph
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Files & Docs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-300">
                  SharePoint/OneDrive documents, contracts, drawdown requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Mailchimp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-300">
                  Audience segments, campaign metrics, BFC list engagement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  LinkedIn Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-300">
                  Post metrics, audience breakdown, engagement rates
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Finance & BI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-300">
                  Drawdowns, GL data, KPIs, programme monitoring
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
                    Drawdown schedule slippage
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-blue-600" />
                    Matched finance gaps
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-blue-600" />
                    Partners with low engagement
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
                    Channel performance leaderboard
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-green-600" />
                    IMD coverage heatmap
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-green-600" />
                    EDI snapshot trends
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
                    Programme KPI forecasts
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-purple-600" />
                    Portfolio stress testing
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-purple-600" />
                    Learning highlights for comms
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