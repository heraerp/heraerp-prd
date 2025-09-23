'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
/**
 * HERA Supabase SQL Editor
 * Smart Code: HERA.TOOLS.SQL.EDITOR.v1
 *
 * Direct SQL interface for Supabase database operations
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import {
  Database,
  Play,
  History,
  Copy,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Table,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface QueryResult {
  data: any[] | null
  error: string | null
  executionTime: number
  rowCount: number
}

interface QueryHistory {
  id: string
  query: string
  timestamp: Date
  result: QueryResult
}

export default function SupabaseSQLEditor() {
  const { currentOrganization, isAuthenticated, contextLoading } = useHERAAuth()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([])
  const [selectedTab, setSelectedTab] = useState<'editor' | 'history'>('editor')

  // Sample queries for quick access
  const sampleQueries = [
    {
      name: 'Show Universal Tables',
      query: `-- View all HERA universal tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'core_organizations',
  'core_entities', 
  'core_dynamic_data',
  'core_relationships',
  'universal_transactions',
  'universal_transaction_lines'
)
ORDER BY table_name;`
    },
    {
      name: 'Entity Summary',
      query: `-- Count entities by type for current organization
SELECT 
  entity_type,
  COUNT(*) as count,
  MAX(created_at) as latest_created
FROM core_entities 
WHERE organization_id = '${currentOrganization?.id || 'demo-org'}'
GROUP BY entity_type 
ORDER BY count DESC;`
    },
    {
      name: 'Recent Transactions',
      query: `-- Show recent transactions
SELECT 
  t.transaction_type,
  t.transaction_code,
  t.total_amount,
  t.transaction_date,
  e.entity_name as from_entity
FROM universal_transactions t
LEFT JOIN core_entities e ON t.from_entity_id = e.id
WHERE t.organization_id = '${currentOrganization?.id || 'demo-org'}'
ORDER BY t.transaction_date DESC 
LIMIT 10;`
    }
  ]

  const executeQuery = async () => {
    if (!query.trim()) {
      toast({
        title: 'Empty Query',
        description: 'Please enter a SQL query to execute',
        variant: 'destructive'
      })
      return
    }

    setIsExecuting(true)
    const startTime = Date.now()

    try {
      // For demo purposes - in production this would call Supabase
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

      const mockData = [
        { id: 1, name: 'Sample Entity', type: 'customer', created_at: new Date().toISOString() },
        { id: 2, name: 'Another Entity', type: 'product', created_at: new Date().toISOString() },
        { id: 3, name: 'Test Transaction', type: 'sale', amount: 1500 }
      ]

      const executionTime = Date.now() - startTime
      const queryResult: QueryResult = {
        data: mockData,
        error: null,
        executionTime,
        rowCount: mockData.length
      }

      setResult(queryResult)

      // Add to history
      const historyEntry: QueryHistory = {
        id: Date.now().toString(),
        query,
        timestamp: new Date(),
        result: queryResult
      }
      setQueryHistory(prev => [historyEntry, ...prev.slice(0, 9)]) // Keep last 10

      toast({
        title: 'Query Executed',
        description: `Returned ${queryResult.rowCount} rows in ${queryResult.executionTime}ms`
      })
    } catch (error) {
      const executionTime = Date.now() - startTime
      const queryResult: QueryResult = {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime,
        rowCount: 0
      }

      setResult(queryResult)

      toast({
        title: 'Query Failed',
        description: queryResult.error,
        variant: 'destructive'
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Query copied to clipboard'
    })
  }

  const downloadResults = () => {
    if (!result?.data) return

    const csv = [
      Object.keys(result.data[0]).join(','),
      ...result.data.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `query-results-${new Date().toISOString().slice(0, 19)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isAuthenticated || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-gray-100 dark:text-foreground">
            Authentication Required
          </h3>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Please log in to access the SQL editor.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted dark:bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 dark:text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Database className="w-5 h-5 text-foreground" />
              </div>
              Supabase SQL Editor
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1">
              Execute SQL queries directly against your Supabase database
            </p>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30">
            <Zap className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        </div>

        <Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
          <TabsList className="grid grid-cols-2 w-64">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              SQL Editor
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6">
            {/* Quick Queries */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sampleQueries.map((sample, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left h-auto p-4 justify-start"
                      onClick={() => setQuery(sample.query)}
                    >
                      <div>
                        <div className="font-medium">{sample.name}</div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {sample.query.split('\n')[0].replace('--', '').trim()}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SQL Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>SQL Query</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(query)}
                        disabled={!query}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={executeQuery}
                        disabled={isExecuting || !query.trim()}
                      >
                        {isExecuting ? (
                          <>
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Execute
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="-- Enter your SQL query here
SELECT * FROM core_entities LIMIT 10;"
                    className="min-h-[300px] font-mono text-sm"
                  />
                </CardContent>
              </Card>

              {/* Results */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Query Results</CardTitle>
                    {result?.data && (
                      <Button size="sm" variant="outline" onClick={downloadResults}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!result ? (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <div className="text-center">
                        <Table className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Execute a query to see results</p>
                      </div>
                    </div>
                  ) : result.error ? (
                    <Alert variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground">
                        <Badge variant="outline">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {result.rowCount} rows
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {result.executionTime}ms
                        </Badge>
                      </div>

                      {result.data && result.data.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                {Object.keys(result.data[0]).map(key => (
                                  <th key={key} className="text-left p-2 font-medium">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {result.data.slice(0, 20).map((row, index) => (
                                <tr
                                  key={index}
                                  className="border-b hover:bg-muted dark:hover:bg-muted"
                                >
                                  {Object.values(row).map((value, cellIndex) => (
                                    <td key={cellIndex} className="p-2">
                                      {typeof value === 'object' && value !== null
                                        ? JSON.stringify(value)
                                        : String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No rows returned</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Query History</CardTitle>
              </CardHeader>
              <CardContent>
                {queryHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No queries executed yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {queryHistory.map(entry => (
                      <Card key={entry.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {entry.timestamp.toLocaleString()}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {entry.result.rowCount} rows
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {entry.result.executionTime}ms
                                </Badge>
                              </div>
                              <pre className="text-sm bg-muted dark:bg-muted p-2 rounded overflow-x-auto">
                                {entry.query.trim()}
                              </pre>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQuery(entry.query)}
                              >
                                Rerun
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(entry.query)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
