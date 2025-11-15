'use client'

import React, { useEffect, useState } from 'react'
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
import { Loader2, Database, Key, Link2, Search, FileJson, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SchemaAnalysis {
  timestamp: string
  database: {
    version: string
    schemas: string[]
  }
  tables: Record<string, TableInfo>
  relationships: RelationshipInfo[]
  indexes: IndexInfo[]
  constraints: ConstraintInfo[]
  dataProfiling: Record<string, TableProfile>
  dynamicDataTypes: DynamicDataType[]
  sampleData: Record<string, any[]>
}

interface TableInfo {
  name: string
  schema: string
  rowCount: number
  estimatedSize: string
  columns: ColumnInfo[]
  primaryKeys: string[]
  foreignKeys: ForeignKeyInfo[]
}

interface ColumnInfo {
  name: string
  dataType: string
  isNullable: boolean
  defaultValue: string | null
  maxLength: number | null
  numericPrecision: number | null
  numericScale: number | null
  isIdentity: boolean
  identityGeneration: string | null
}

interface RelationshipInfo {
  constraintName: string
  sourceTable: string
  sourceColumns: string[]
  targetTable: string
  targetColumns: string[]
  updateRule: string
  deleteRule: string
}

interface IndexInfo {
  schemaName: string
  tableName: string
  indexName: string
  indexType: string
  columns: string[]
  isUnique: boolean
  isPrimary: boolean
  isPartial: boolean
  indexDefinition: string
}

interface ConstraintInfo {
  schemaName: string
  tableName: string
  constraintName: string
  constraintType: string
  definition: string
}

interface TableProfile {
  tableName: string
  rowCount: number
  nullCounts: Record<string, number>
  distinctCounts: Record<string, number>
  minMaxValues: Record<string, { min: any; max: any }>
}

interface DynamicDataType {
  fieldName: string
  dataTypes: Array<{
    type: string
    count: number
    percentage: number
  }>
  sampleValues: any[]
}

interface ForeignKeyInfo {
  column: string
  referencesTable: string
  referencesColumn: string
}

export default function SchemaAnalysisPage() {
  const [analysis, setAnalysis] = useState<SchemaAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string>('')

  const fetchAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/schema-analysis', {
        headers: {
          'x-admin-api-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'test-key'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setAnalysis(data.analysis)
        // Select the first table by default
        const tables = Object.keys(data.analysis.tables)
        if (tables.length > 0) {
          setSelectedTable(tables[0])
        }
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

  const getDataTypeColor = (dataType: string): string => {
    const typeColors: Record<string, string> = {
      uuid: 'bg-purple-100 text-purple-800',
      text: 'bg-blue-100 text-blue-800',
      'character varying': 'bg-blue-100 text-blue-800',
      integer: 'bg-green-100 text-green-800',
      bigint: 'bg-green-100 text-green-800',
      numeric: 'bg-green-100 text-green-800',
      boolean: 'bg-yellow-100 text-yellow-800',
      'timestamp with time zone': 'bg-orange-100 text-orange-800',
      'timestamp without time zone': 'bg-orange-100 text-orange-800',
      jsonb: 'bg-indigo-100 text-indigo-800',
      json: 'bg-indigo-100 text-indigo-800'
    }

    return typeColors[dataType.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  const renderTableDetails = (table: TableInfo) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Rows</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{table.rowCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Columns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{table.columns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Primary Keys</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{table.primaryKeys.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Foreign Keys</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{table.foreignKeys.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Column Definitions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Column Name</TableHead>
                <TableHead>Data Type</TableHead>
                <TableHead>Nullable</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Constraints</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.columns.map(column => (
                <TableRow key={column.name}>
                  <TableCell className="font-mono">
                    {column.name}
                    {table.primaryKeys.includes(column.name) && (
                      <Key className="inline-block ml-2 h-4 w-4 text-yellow-600" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getDataTypeColor(column.dataType)} variant="secondary">
                      {column.dataType}
                      {column.maxLength && ` (${column.maxLength})`}
                      {column.numericPrecision &&
                        ` (${column.numericPrecision},${column.numericScale || 0})`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={column.isNullable ? 'outline' : 'secondary'}>
                      {column.isNullable ? 'NULL' : 'NOT NULL'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{column.defaultValue || '-'}</TableCell>
                  <TableCell>
                    {column.isIdentity && (
                      <Badge className="bg-purple-100 text-purple-800" variant="secondary">
                        IDENTITY
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {table.foreignKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Foreign Key Relationships</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead>References Table</TableHead>
                  <TableHead>References Column</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.foreignKeys.map((fk, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{fk.column}</TableCell>
                    <TableCell className="font-mono">{fk.referencesTable}</TableCell>
                    <TableCell className="font-mono">{fk.referencesColumn}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderSampleData = (tableName: string, data: any[]) => {
    if (!data || data.length === 0) return <p className="text-gray-500">No sample data available</p>

    const columns = Object.keys(data[0])

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col} className="font-mono">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                {columns.map(col => (
                  <TableCell key={col} className="font-mono text-sm">
                    {row[col] === null ? (
                      <span className="text-gray-400">NULL</span>
                    ) : typeof row[col] === 'object' ? (
                      <pre className="text-xs">{JSON.stringify(row[col], null, 2)}</pre>
                    ) : (
                      String(row[col]).substring(0, 100)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
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
          <h1 className="text-3xl font-bold">Schema Analysis</h1>
          <p className="text-gray-500">
            Last analyzed: {new Date(analysis.timestamp).toLocaleString()}
          </p>
        </div>
        <Button onClick={fetchAnalysis} disabled={loading}>
          <Database className="mr-2 h-4 w-4" />
          Refresh Analysis
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Database Version</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">{analysis.database.version}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Tables</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Object.keys(analysis.tables).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analysis.relationships.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="dynamic-data">Dynamic Data</TabsTrigger>
          <TabsTrigger value="sample-data">Sample Data</TabsTrigger>
          <TabsTrigger value="indexes">Indexes</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {Object.values(analysis.tables).map(table => (
                      <Button
                        key={table.name}
                        variant={selectedTable === table.name ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setSelectedTable(table.name)}
                      >
                        <Database className="mr-2 h-4 w-4" />
                        <span className="truncate">{table.name}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {table.rowCount}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            <div className="col-span-3">
              {selectedTable &&
                analysis.tables[selectedTable] &&
                renderTableDetails(analysis.tables[selectedTable])}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="relationships" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Foreign Key Relationships</CardTitle>
              <CardDescription>All foreign key constraints in the database</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Table</TableHead>
                    <TableHead>Source Columns</TableHead>
                    <TableHead>Target Table</TableHead>
                    <TableHead>Target Columns</TableHead>
                    <TableHead>Update Rule</TableHead>
                    <TableHead>Delete Rule</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.relationships.map(rel => (
                    <TableRow key={rel.constraintName}>
                      <TableCell className="font-mono">{rel.sourceTable}</TableCell>
                      <TableCell className="font-mono">{rel.sourceColumns.join(', ')}</TableCell>
                      <TableCell className="font-mono">{rel.targetTable}</TableCell>
                      <TableCell className="font-mono">{rel.targetColumns.join(', ')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rel.updateRule}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rel.deleteRule}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dynamic-data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Data Field Types</CardTitle>
              <CardDescription>Analysis of field types stored in core_dynamic_data</CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.dynamicDataTypes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Data Types Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.dynamicDataTypes.map(field => (
                      <TableRow key={field.fieldName}>
                        <TableCell className="font-mono">{field.fieldName}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {field.dataTypes.map(type => (
                              <div key={type.type} className="flex items-center space-x-2">
                                <Badge className={getDataTypeColor(type.type)} variant="secondary">
                                  {type.type}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {type.count} ({type.percentage.toFixed(1)}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500">No dynamic data fields found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sample-data" className="space-y-6">
          {Object.entries(analysis.sampleData).map(([tableName, data]) => (
            <Card key={tableName}>
              <CardHeader>
                <CardTitle>{tableName}</CardTitle>
                <CardDescription>Sample of up to 5 records from this table</CardDescription>
              </CardHeader>
              <CardContent>{renderSampleData(tableName, data)}</CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="indexes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Indexes</CardTitle>
              <CardDescription>All indexes defined in the database</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Index Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Unique</TableHead>
                    <TableHead>Primary</TableHead>
                    <TableHead>Definition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.indexes.map(index => (
                    <TableRow key={`${index.tableName}-${index.indexName}`}>
                      <TableCell className="font-mono">{index.tableName}</TableCell>
                      <TableCell className="font-mono text-sm">{index.indexName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{index.indexType}</Badge>
                      </TableCell>
                      <TableCell>
                        {index.isUnique && (
                          <Badge className="bg-blue-100 text-blue-800">UNIQUE</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {index.isPrimary && (
                          <Badge className="bg-yellow-100 text-yellow-800">PRIMARY</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">
                          {index.indexDefinition.substring(0, 100)}...
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
