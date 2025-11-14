'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Database,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp,
  Building2,
  Hash
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'

export default function SchemaInsightsPage() {
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/schema-analysis-simple', {
        headers: {
          'x-admin-api-key': 'test-key'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setAnalysis(data.analysis)
      } else {
        throw new Error(data.error || 'Failed to analyze schema')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [])

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Analyzing database schema...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchAnalysis} className="mt-4">
          Retry Analysis
        </Button>
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Schema Insights</h1>
          <p className="text-gray-500">Comprehensive analysis of your HERA database</p>
        </div>
        <Button onClick={fetchAnalysis} disabled={loading}>
          <Database className="mr-2 h-4 w-4" />
          Refresh Analysis
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tables</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analysis.summary?.tablesAnalyzed || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Records</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(analysis.summary?.totalRows || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analysis.insights?.organizations?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Data Status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge
              variant={analysis.summary?.hasData ? 'default' : 'secondary'}
              className={analysis.summary?.hasData ? 'bg-green-100 text-green-800' : ''}
            >
              {analysis.summary?.hasData ? 'Active' : 'Empty'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {analysis.summary?.recommendations && analysis.summary.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations & Findings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.summary.recommendations.map((rec: any, index: number) => (
              <Alert key={index} className="flex items-start space-x-2">
                {getRecommendationIcon(rec.type)}
                <AlertDescription>{rec.message}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="dynamic-data">Dynamic Data</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="sample-data">Sample Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Table Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Table Overview</CardTitle>
              <CardDescription>Core HERA tables and their current state</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Row Count</TableHead>
                    <TableHead>Expected Columns</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(analysis.tables || {}).map((table: any) => (
                    <TableRow key={table.name}>
                      <TableCell className="font-mono">{table.name}</TableCell>
                      <TableCell>{formatNumber(table.rowCount || 0)}</TableCell>
                      <TableCell>{table.expectedColumns?.length || 0}</TableCell>
                      <TableCell>
                        {table.error ? (
                          <Badge variant="destructive">Error</Badge>
                        ) : table.hasSampleData ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Empty</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Organizations */}
          {analysis.insights?.organizations?.sample && (
            <Card>
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>Active organizations in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Currency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.insights.organizations.sample.map((org: any) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell className="font-mono">{org.code}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{org.industry || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>{org.country || 'N/A'}</TableCell>
                        <TableCell>{org.currency || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="entities" className="space-y-6">
          {analysis.dataProfile?.core_entities && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Entities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {formatNumber(analysis.dataProfile.core_entities.totalEntities)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Entity Types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {analysis.dataProfile.core_entities.uniqueEntityTypes}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Top Entity Type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium">
                      {analysis.dataProfile.core_entities.topEntityTypes[0]?.type || 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Entity Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.dataProfile.core_entities.topEntityTypes.map((type: any) => (
                      <div key={type.type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-mono">{type.type}</span>
                          <span>{formatNumber(type.count)} entities</span>
                        </div>
                        <Progress
                          value={
                            (type.count / analysis.dataProfile.core_entities.totalEntities) * 100
                          }
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {analysis.dataProfile?.universal_transactions && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {formatNumber(analysis.dataProfile.universal_transactions.totalTransactions)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Transaction Types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {analysis.dataProfile.universal_transactions.uniqueTransactionTypes}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Currencies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1 flex-wrap">
                      {analysis.dataProfile.universal_transactions.currencies.map(
                        (currency: string) => (
                          <Badge key={currency} variant="secondary">
                            {currency}
                          </Badge>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Transaction Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction Type</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.dataProfile.universal_transactions.topTransactionTypes.map(
                        (type: any) => (
                          <TableRow key={type.type}>
                            <TableCell className="font-mono">{type.type}</TableCell>
                            <TableCell>{formatNumber(type.count)}</TableCell>
                            <TableCell>
                              {(
                                (type.count /
                                  analysis.dataProfile.universal_transactions.totalTransactions) *
                                100
                              ).toFixed(1)}
                              %
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="dynamic-data" className="space-y-6">
          {analysis.dataProfile?.core_dynamic_data && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Dynamic Records</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {formatNumber(analysis.dataProfile.core_dynamic_data.totalRecords)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Unique Fields</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {analysis.dataProfile.core_dynamic_data.uniqueFieldNames}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Top Field</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium">
                      {analysis.dataProfile.core_dynamic_data.topFields[0]?.field || 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Dynamic Field Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Usage Count</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.dataProfile.core_dynamic_data.topFields.map((field: any) => (
                        <TableRow key={field.field}>
                          <TableCell className="font-mono">{field.field}</TableCell>
                          <TableCell>{formatNumber(field.count)}</TableCell>
                          <TableCell>
                            {analysis.dataProfile.dynamicFieldTypes?.[field.field] ? (
                              <Badge
                                variant="secondary"
                                className={
                                  analysis.dataProfile.dynamicFieldTypes[field.field]
                                    .primaryType === 'text'
                                    ? 'bg-blue-100 text-blue-800'
                                    : analysis.dataProfile.dynamicFieldTypes[field.field]
                                          .primaryType === 'number'
                                      ? 'bg-green-100 text-green-800'
                                      : analysis.dataProfile.dynamicFieldTypes[field.field]
                                            .primaryType === 'json'
                                        ? 'bg-purple-100 text-purple-800'
                                        : ''
                                }
                              >
                                {analysis.dataProfile.dynamicFieldTypes[field.field].primaryType}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Branch field analysis */}
              {(analysis.dataProfile.dynamicFieldTypes?.branch_id ||
                analysis.dataProfile.dynamicFieldTypes?.branch_code ||
                analysis.dataProfile.dynamicFieldTypes?.branch_name) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Branch Field Analysis</CardTitle>
                    <CardDescription>How branch data is stored in dynamic fields</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['branch_id', 'branch_code', 'branch_name'].map(fieldName => {
                        const fieldData = analysis.dataProfile.dynamicFieldTypes?.[fieldName]
                        if (!fieldData) return null

                        return (
                          <div key={fieldName} className="border rounded-lg p-4">
                            <h4 className="font-mono font-medium mb-2">{fieldName}</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Primary Type</p>
                                <Badge variant="outline">{fieldData.primaryType}</Badge>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Samples Found</p>
                                <p className="font-medium">{fieldData.samples}</p>
                              </div>
                            </div>
                            {fieldData.typeUsage && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-500 mb-1">Type Usage</p>
                                <div className="flex gap-2">
                                  {Object.entries(fieldData.typeUsage).map(
                                    ([type, count]) =>
                                      count > 0 && (
                                        <Badge key={type} variant="secondary" className="text-xs">
                                          {type}: {count}
                                        </Badge>
                                      )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branch Analysis</CardTitle>
              <CardDescription>How branches are implemented in this system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Branch Entities */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Branch Entities
                </h4>
                {analysis.insights?.branches && analysis.insights.branches.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Metadata</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.insights.branches.map((branch: any) => (
                        <TableRow key={branch.id}>
                          <TableCell>{branch.name}</TableCell>
                          <TableCell className="font-mono">{branch.code || '-'}</TableCell>
                          <TableCell>
                            {branch.metadata ? (
                              <pre className="text-xs">
                                {JSON.stringify(branch.metadata, null, 2)}
                              </pre>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No entities with entity_type = 'branch' found in core_entities table.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Dynamic Field Implementation */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Dynamic Field Implementation
                </h4>
                {analysis.dataProfile?.dynamicFieldTypes?.branch_id ||
                analysis.dataProfile?.dynamicFieldTypes?.branch_code ||
                analysis.dataProfile?.dynamicFieldTypes?.branch_name ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Branch data is stored in core_dynamic_data using fields:{' '}
                      {['branch_id', 'branch_code', 'branch_name']
                        .filter(f => analysis.dataProfile?.dynamicFieldTypes?.[f])
                        .join(', ')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No branch-related fields found in core_dynamic_data table.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Implementation Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Implementation Approach</h4>
                <p className="text-sm text-gray-600">
                  Based on the analysis, branches in this HERA instance are likely implemented
                  using:
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {analysis.insights?.branches?.length > 0 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Branch entities in core_entities table</span>
                    </li>
                  )}
                  {(analysis.dataProfile?.dynamicFieldTypes?.branch_id ||
                    analysis.dataProfile?.dynamicFieldTypes?.branch_code) && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Dynamic fields for branch assignment to other entities</span>
                    </li>
                  )}
                  {analysis.dataProfile?.core_relationships?.topRelationshipTypes?.some((r: any) =>
                    r.type.toLowerCase().includes('branch')
                  ) && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Relationships to connect entities to branches</span>
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sample-data" className="space-y-6">
          {Object.entries(analysis.sampleData || {}).map(([tableName, data]) => (
            <Card key={tableName}>
              <CardHeader>
                <CardTitle className="font-mono">{tableName}</CardTitle>
                <CardDescription>Sample records from this table</CardDescription>
              </CardHeader>
              <CardContent>
                {data && (data as any[]).length > 0 ? (
                  <ScrollArea className="w-full">
                    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </ScrollArea>
                ) : (
                  <p className="text-gray-500">No data available</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
