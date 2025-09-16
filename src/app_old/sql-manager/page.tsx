'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
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
  Unlock,
  Code as Function,
  Box,
  GitBranch,
  Terminal,
  BookOpen,
  Cpu,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Universal Functions for HERA
const UNIVERSAL_FUNCTIONS = [
  {
    category: 'Organization Management',
    icon: Shield,
    color: 'blue',
    functions: [
      {
        name: 'create_organization',
        description: 'Create a new organization with default settings',
        signature: 'create_organization(name TEXT, code TEXT, type TEXT) RETURNS UUID',
        example: `SELECT create_organization('Acme Corp', 'ACME', 'enterprise');`
      },
      {
        name: 'get_organization_stats',
        description: 'Get comprehensive statistics for an organization',
        signature: 'get_organization_stats(org_id UUID) RETURNS TABLE',
        example: `SELECT * FROM get_organization_stats('YOUR_ORG_ID');`
      }
    ]
  },
  {
    category: 'Entity Management',
    icon: Database,
    color: 'purple',
    functions: [
      {
        name: 'create_entity_with_data',
        description: 'Create entity with dynamic data in one operation',
        signature:
          'create_entity_with_data(org_id UUID, type TEXT, name TEXT, fields JSONB) RETURNS UUID',
        example: `SELECT create_entity_with_data(
  'YOUR_ORG_ID',
  'customer',
  'John Doe',
  '{"email": "john@example.com", "phone": "+1234567890"}'::jsonb
);`
      },
      {
        name: 'get_entity_complete',
        description: 'Get entity with all dynamic data and relationships',
        signature: 'get_entity_complete(entity_id UUID) RETURNS JSONB',
        example: `SELECT get_entity_complete('ENTITY_ID');`
      }
    ]
  },
  {
    category: 'Transaction Processing',
    icon: FileText,
    color: 'green',
    functions: [
      {
        name: 'create_transaction_complete',
        description: 'Create transaction with lines in atomic operation',
        signature: 'create_transaction_complete(org_id UUID, type TEXT, lines JSONB) RETURNS UUID',
        example: `SELECT create_transaction_complete(
  'YOUR_ORG_ID',
  'sale',
  '[
    {"product_id": "PROD_ID", "quantity": 2, "price": 100},
    {"product_id": "PROD_ID2", "quantity": 1, "price": 50}
  ]'::jsonb
);`
      },
      {
        name: 'calculate_transaction_totals',
        description: 'Calculate and update transaction totals',
        signature: 'calculate_transaction_totals(transaction_id UUID) RETURNS NUMERIC',
        example: `SELECT calculate_transaction_totals('TRANSACTION_ID');`
      }
    ]
  },
  {
    category: 'Smart Code System',
    icon: Cpu,
    color: 'orange',
    functions: [
      {
        name: 'validate_smart_code',
        description: 'Validate smart code format and structure',
        signature: 'validate_smart_code(code TEXT) RETURNS BOOLEAN',
        example: `SELECT validate_smart_code('HERA.REST.POS.TXN.SALE.v1');`
      },
      {
        name: 'generate_smart_code',
        description: 'Generate smart code from components',
        signature: 'generate_smart_code(industry TEXT, module TEXT, function TEXT) RETURNS TEXT',
        example: `SELECT generate_smart_code('REST', 'POS', 'SALE');`
      }
    ]
  },
  {
    category: 'Reporting & Analytics',
    icon: Activity,
    color: 'red',
    functions: [
      {
        name: 'get_trial_balance',
        description: 'Generate trial balance for organization',
        signature: 'get_trial_balance(org_id UUID, start_date DATE, end_date DATE) RETURNS TABLE',
        example: `SELECT * FROM get_trial_balance(
  'YOUR_ORG_ID',
  '2024-01-01'::date,
  '2024-12-31'::date
);`
      },
      {
        name: 'get_entity_activity',
        description: 'Get all activity for an entity',
        signature: 'get_entity_activity(entity_id UUID, days INTEGER) RETURNS TABLE',
        example: `SELECT * FROM get_entity_activity('ENTITY_ID', 30);`
      }
    ]
  }
]

// Common Management Queries
const MANAGEMENT_QUERIES = {
  'Database Health': {
    'Table Sizes': `SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;`,

    'Active Connections': `SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  state_change
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start DESC;`,

    'Slow Queries': `SELECT 
  query,
  calls,
  total_time,
  mean_time,
  min_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;`
  },

  'Index Management': {
    'Missing Indexes': `SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  most_common_vals
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND n_distinct > 100
  AND tablename NOT IN (
    SELECT tablename 
    FROM pg_indexes 
    WHERE schemaname = pg_stats.schemaname
  );`,

    'Unused Indexes': `SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;`,

    'Index Usage': `SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;`
  },

  'Performance Tuning': {
    'Cache Hit Ratio': `SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit)  as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
FROM pg_statio_user_tables;`,

    'Table Bloat': `SELECT
  current_database() AS db,
  schemaname,
  tablename,
  ROUND(bloat_ratio::numeric, 2) AS bloat_ratio,
  pg_size_pretty(bloat_size::bigint) AS bloat_size,
  pg_size_pretty(table_size::bigint) AS table_size
FROM (
  SELECT
    schemaname,
    tablename,
    cc.relpages * bs AS table_size,
    CEIL((cc.reltuples * (avg_width + 24)) / bs) * bs AS expected_size,
    cc.relpages * bs - CEIL((cc.reltuples * (avg_width + 24)) / bs) * bs AS bloat_size,
    CASE WHEN cc.relpages > 0 
      THEN (100 * (cc.relpages * bs - CEIL((cc.reltuples * (avg_width + 24)) / bs) * bs) / (cc.relpages * bs))::numeric 
      ELSE 0 
    END AS bloat_ratio
  FROM pg_class cc
  JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname NOT IN ('pg_catalog', 'information_schema')
  JOIN (
    SELECT 
      ma.attrelid, 
      SUM(ma.attlen + CASE WHEN ma.attlen = -1 THEN 4 ELSE 0 END) AS avg_width
    FROM pg_attribute ma
    WHERE ma.attnum > 0 AND NOT ma.attisdropped
    GROUP BY ma.attrelid
  ) AS tt ON cc.oid = tt.attrelid
  CROSS JOIN (SELECT current_setting('block_size')::numeric AS bs) AS bs
  WHERE cc.relkind = 'r'
) AS bloat_stats
WHERE bloat_ratio > 20
ORDER BY bloat_size DESC;`
  }
}

export default function SQLManagerPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('functions')
  const [selectedCategory, setSelectedCategory] = useState('Organization Management')
  const [searchTerm, setSearchTerm] = useState('')

  const executeQuery = async (sqlQuery: string) => {
    setLoading(true)
    setError('')
    setQuery(sqlQuery)

    try {
      const response = await fetch('/api/v1/supabase-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sql-auth': 'HeraSQL2025!'
        },
        body: JSON.stringify({
          action: 'execute',
          query: sqlQuery.trim(),
          readOnly: false
        })
      })

      const data = await response.json()

      if (data.success) {
        setResults(data)
        setActiveTab('results')
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const filteredFunctions = UNIVERSAL_FUNCTIONS.map(category => ({
    ...category,
    functions: category.functions.filter(
      func =>
        func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        func.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.functions.length > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">HERA SQL Manager</h1>
            <p className="text-muted-foreground mt-1">
              Advanced database management with universal functions
            </p>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            <Activity className="h-4 w-4 mr-2" />
            Connected to Supabase
          </Badge>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 border-border">
            <TabsTrigger value="functions" className="data-[state=active]:bg-slate-700">
              <Function className="h-4 w-4 mr-2" />
              Universal Functions
            </TabsTrigger>
            <TabsTrigger value="management" className="data-[state=active]:bg-slate-700">
              <Settings className="h-4 w-4 mr-2" />
              Database Management
            </TabsTrigger>
            <TabsTrigger value="query" className="data-[state=active]:bg-slate-700">
              <Terminal className="h-4 w-4 mr-2" />
              Query Editor
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-slate-700">
              <Table className="h-4 w-4 mr-2" />
              Results
            </TabsTrigger>
          </TabsList>

          {/* Functions Tab */}
          <TabsContent value="functions" className="space-y-6">
            <Card className="bg-muted/50 border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">Universal Function Library</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search functions..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700 border-input text-foreground"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredFunctions.map(category => {
                    const Icon = category.icon
                    return (
                      <div
                        key={category.category}
                        className="bg-slate-700/50 rounded-lg border border-input p-4"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={cn(
                              'p-2 rounded-lg',
                              category.color === 'blue' && 'bg-blue-500/20',
                              category.color === 'purple' && 'bg-purple-500/20',
                              category.color === 'green' && 'bg-green-500/20',
                              category.color === 'orange' && 'bg-orange-500/20',
                              category.color === 'red' && 'bg-red-500/20'
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-5 w-5',
                                category.color === 'blue' && 'text-blue-400',
                                category.color === 'purple' && 'text-purple-400',
                                category.color === 'green' && 'text-green-400',
                                category.color === 'orange' && 'text-orange-400',
                                category.color === 'red' && 'text-red-400'
                              )}
                            />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">{category.category}</h3>
                        </div>

                        <div className="space-y-3">
                          {category.functions.map(func => (
                            <div
                              key={func.name}
                              className="bg-muted/50 rounded-lg p-3 border border-input"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-mono text-sm text-blue-400">{func.name}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">{func.description}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => executeQuery(func.example)}
                                  className="text-green-400 hover:text-green-300"
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="mt-2">
                                <code className="text-xs text-slate-300 bg-background px-2 py-1 rounded">
                                  {func.signature}
                                </code>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Management Tab */}
          <TabsContent value="management" className="space-y-6">
            <Card className="bg-muted/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Database Management Queries</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Pre-configured queries for monitoring and optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(MANAGEMENT_QUERIES).map(([category, queries]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-foreground mb-3">{category}</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(queries).map(([name, sql]) => (
                          <div
                            key={name}
                            className="bg-slate-700/50 rounded-lg p-4 border border-input"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-foreground">{name}</h4>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(sql)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => executeQuery(sql)}
                                  className="text-green-400 hover:text-green-300"
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <pre className="text-xs text-slate-300 bg-background p-2 rounded overflow-x-auto">
                              {sql}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Query Tab */}
          <TabsContent value="query" className="space-y-4">
            <Card className="bg-muted/50 border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">Custom Query Editor</CardTitle>
                  <Button
                    onClick={() => executeQuery(query)}
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
                        Execute
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Enter your SQL query here..."
                  className="font-mono text-sm h-96 bg-background text-slate-100 border-border"
                  spellCheck={false}
                />
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            {results && results.data && (
              <Card className="bg-muted/50 border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground">
                      Query Results ({results.rowCount} rows)
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const csv = [
                          Object.keys(results.data[0]).join(','),
                          ...results.data.map((row: any) =>
                            Object.values(row)
                              .map(v => (typeof v === 'string' ? `"${v}"` : v))
                              .join(',')
                          )
                        ].join('\n')

                        const blob = new Blob([csv], { type: 'text/csv' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `query-results-${Date.now()}.csv`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
                      className="text-foreground border-input"
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
                        <tr className="border-b border-border">
                          {results.data.length > 0 &&
                            Object.keys(results.data[0]).map(key => (
                              <th key={key} className="text-left p-2 font-medium text-slate-300">
                                {key}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.data.map((row: any, i: number) => (
                          <tr key={i} className="border-b border-border hover:bg-slate-700/50">
                            {Object.values(row).map((value: any, j: number) => (
                              <td key={j} className="p-2 text-slate-300">
                                {value === null ? (
                                  <span className="text-slate-500">NULL</span>
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
        </Tabs>
      </div>
    </div>
  )
}
