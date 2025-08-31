'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Database, 
  Play, 
  Table, 
  Code, 
  Shield, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  Download,
  Copy,
  Loader2,
  FileText,
  Settings,
  Search,
  ChevronRight,
  Zap,
  Lock,
  Unlock
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Sacred 6 Tables
const SACRED_TABLES = [
  { 
    name: 'core_organizations', 
    description: 'Multi-tenant organization management',
    color: 'blue',
    icon: Shield,
    columns: ['id', 'organization_name', 'organization_code', 'created_at', 'status', 'settings']
  },
  { 
    name: 'core_entities', 
    description: 'All business objects (customers, products, GL accounts)',
    color: 'purple',
    icon: Database,
    columns: ['id', 'organization_id', 'entity_type', 'entity_name', 'entity_code', 'smart_code', 'status']
  },
  { 
    name: 'core_dynamic_data', 
    description: 'Unlimited custom fields without schema changes',
    color: 'green',
    icon: Code,
    columns: ['id', 'entity_id', 'organization_id', 'field_name', 'field_value_text', 'field_value_number', 'field_value_date']
  },
  { 
    name: 'core_relationships', 
    description: 'Entity connections, hierarchies, and workflows',
    color: 'orange',
    icon: ChevronRight,
    columns: ['id', 'organization_id', 'from_entity_id', 'to_entity_id', 'relationship_type', 'smart_code']
  },
  { 
    name: 'universal_transactions', 
    description: 'All business transaction headers',
    color: 'red',
    icon: FileText,
    columns: ['id', 'organization_id', 'transaction_type', 'transaction_date', 'transaction_code', 'total_amount', 'smart_code']
  },
  { 
    name: 'universal_transaction_lines', 
    description: 'Transaction line items and details',
    color: 'indigo',
    icon: Table,
    columns: ['id', 'transaction_id', 'line_number', 'line_entity_id', 'quantity', 'unit_price', 'line_amount']
  }
]

// Common query templates
const QUERY_TEMPLATES = {
  'Select All': (table: string) => `SELECT * FROM ${table} LIMIT 100;`,
  'Count Records': (table: string) => `SELECT COUNT(*) as total_records FROM ${table};`,
  'Recent Records': (table: string) => `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 20;`,
  'By Organization': (table: string) => `SELECT * FROM ${table} WHERE organization_id = 'YOUR_ORG_ID' LIMIT 50;`,
  'Schema Info': (table: string) => `SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = '${table}' 
ORDER BY ordinal_position;`,
  'Active Records': (table: string) => `SELECT * FROM ${table} WHERE status = 'active' LIMIT 50;`,
  'Join Entities': () => `SELECT 
  e.entity_name,
  e.entity_type,
  e.smart_code,
  dd.field_name,
  dd.field_value_text
FROM core_entities e
LEFT JOIN core_dynamic_data dd ON e.id = dd.entity_id
WHERE e.organization_id = 'YOUR_ORG_ID'
LIMIT 50;`,
  'Transaction Summary': () => `SELECT 
  t.transaction_type,
  COUNT(*) as count,
  SUM(t.total_amount) as total_amount
FROM universal_transactions t
WHERE t.organization_id = 'YOUR_ORG_ID'
GROUP BY t.transaction_type
ORDER BY total_amount DESC;`
}

export default function SQLEditorPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTable, setSelectedTable] = useState('core_entities')
  const [readOnly, setReadOnly] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [authKey, setAuthKey] = useState('')
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [queryHistory, setQueryHistory] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('editor')

  // Load query history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('hera-sql-history')
    if (history) {
      setQueryHistory(JSON.parse(history))
    }
  }, [])

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a SQL query')
      return
    }

    setLoading(true)
    setError('')
    const startTime = Date.now()

    try {
      const response = await fetch('/api/v1/supabase-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sql-auth': 'HeraSQL2025!'
        },
        body: JSON.stringify({
          action: 'execute',
          query: query.trim(),
          readOnly
        })
      })

      const data = await response.json()
      const endTime = Date.now()
      setExecutionTime(endTime - startTime)

      if (data.success) {
        setResults(data)
        // Add to history
        const newHistory = [query, ...queryHistory.filter(q => q !== query)].slice(0, 20)
        setQueryHistory(newHistory)
        localStorage.setItem('hera-sql-history', JSON.stringify(newHistory))
      } else {
        setError(data.error || 'Query execution failed')
        setResults(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute query')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/supabase-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sql-auth': 'HeraSQL2025!'
        },
        body: JSON.stringify({
          action: 'test_connection'
        })
      })

      const data = await response.json()
      if (data.success && data.connected) {
        setError('')
        alert('✅ Successfully connected to Supabase!')
      } else {
        setError(data.error || 'Connection test failed')
      }
    } catch (err) {
      setError('Failed to test connection')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplate = (templateName: string) => {
    const template = QUERY_TEMPLATES[templateName as keyof typeof QUERY_TEMPLATES]
    if (typeof template === 'function') {
      setQuery(template(selectedTable))
    }
  }

  const exportResults = () => {
    if (!results?.data) return
    
    const csv = [
      Object.keys(results.data[0]).join(','),
      ...results.data.map((row: any) => 
        Object.values(row).map(v => 
          typeof v === 'string' ? `"${v}"` : v
        ).join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hera-query-results-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyQuery = () => {
    navigator.clipboard.writeText(query)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              HERA SQL Editor
            </h1>
            <p className="text-slate-600 mt-1">Query and manage the sacred 6-table universal architecture</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={loading}
              className="bg-white/80"
            >
              <Database className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
            <div className="flex items-center gap-2">
              <Label htmlFor="read-only" className="text-sm">Read Only</Label>
              <Switch
                id="read-only"
                checked={readOnly}
                onCheckedChange={setReadOnly}
              />
              {readOnly ? (
                <Lock className="h-4 w-4 text-green-600" />
              ) : (
                <Unlock className="h-4 w-4 text-orange-600" />
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Table Navigator */}
          <div className="col-span-3">
            <Card className="bg-white/70 backdrop-blur-xl border-white/30">
              <CardHeader>
                <CardTitle className="text-lg">Sacred Tables</CardTitle>
                <CardDescription>Click to explore</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {SACRED_TABLES.map((table) => {
                  const Icon = table.icon
                  return (
                    <button
                      key={table.name}
                      onClick={() => setSelectedTable(table.name)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all",
                        "hover:bg-slate-100 group",
                        selectedTable === table.name && "bg-blue-50 border-blue-200 border"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          selectedTable === table.name ? "bg-blue-100" : "bg-slate-100"
                        )}>
                          <Icon className={cn(
                            "h-4 w-4",
                            selectedTable === table.name ? "text-blue-600" : "text-slate-600"
                          )} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{table.name}</h3>
                          <p className="text-xs text-slate-500 mt-1">{table.description}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {table.columns.slice(0, 3).map(col => (
                              <Badge key={col} variant="secondary" className="text-xs">
                                {col}
                              </Badge>
                            ))}
                            {table.columns.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{table.columns.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* Query Templates */}
            <Card className="bg-white/70 backdrop-blur-xl border-white/30 mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Quick Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.keys(QUERY_TEMPLATES).map((template) => (
                  <Button
                    key={template}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => loadTemplate(template)}
                  >
                    <Zap className="h-3 w-3 mr-2" />
                    {template}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Editor Area */}
          <div className="col-span-9">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="editor">SQL Editor</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="history">Query History</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-4">
                <Card className="bg-white/70 backdrop-blur-xl border-white/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Query Editor</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyQuery}
                          disabled={!query}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={executeQuery}
                          disabled={loading || !query}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Execute Query
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Enter your SQL query here..."
                      className="font-mono text-sm h-64 bg-slate-900 text-slate-100 border-slate-700"
                      spellCheck={false}
                    />
                    {executionTime !== null && (
                      <div className="mt-2 text-sm text-slate-600">
                        Execution time: {executionTime}ms
                      </div>
                    )}
                  </CardContent>
                </Card>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {results && results.success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Query executed successfully. {results.rowCount} rows returned.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="results">
                {results && results.data && (
                  <Card className="bg-white/70 backdrop-blur-xl border-white/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Query Results</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportResults}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              {results.data.length > 0 && Object.keys(results.data[0]).map((key) => (
                                <th key={key} className="text-left p-2 font-medium">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {results.data.map((row: any, i: number) => (
                              <tr key={i} className="border-b hover:bg-slate-50">
                                {Object.values(row).map((value: any, j: number) => (
                                  <td key={j} className="p-2">
                                    {value === null ? (
                                      <span className="text-slate-400">NULL</span>
                                    ) : typeof value === 'object' ? (
                                      <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>
                                    ) : (
                                      String(value)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="history">
                <Card className="bg-white/70 backdrop-blur-xl border-white/30">
                  <CardHeader>
                    <CardTitle>Query History</CardTitle>
                    <CardDescription>Your recent queries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {queryHistory.length === 0 ? (
                        <p className="text-sm text-slate-500">No query history yet</p>
                      ) : (
                        queryHistory.map((q, i) => (
                          <div
                            key={i}
                            className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer group"
                            onClick={() => setQuery(q)}
                          >
                            <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap">
                              {q}
                            </pre>
                            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Badge variant="secondary" className="text-xs">
                                Click to load
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}