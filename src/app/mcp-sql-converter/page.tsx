'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ================================================================================
// MCP SQL CONVERTER - Progressive to Production Database Converter
// Analyzes progressive pages and generates SQL/MCP commands for database setup
// Smart Code: HERA.MCP.SQL.CONVERTER.v1
// ================================================================================

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Database,
  Code,
  Wand2,
  Copy,
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FileCode,
  Terminal,
  Zap,
  Play,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface AnalysisResult {
  entities: Array<{
    type: string
    name: string
    fields: Record<string, any>
    smartCode?: string
  }>
  relationships: Array<{
    source: string
    target: string
    type: string
  }>
  transactions: Array<{
    type: string
    amount?: number
    parties: string[]
  }>
  organizationInfo: {
    name: string
    type: string
  }
}

export default function MCPSQLConverter() {
  const [inputMode, setInputMode] = useState<'url' | 'code'>('url')
  const [pageUrl, setPageUrl] = useState('')
  const [progressiveCode, setProgressiveCode] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [businessType, setBusinessType] = useState('salon')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [sqlOutput, setSqlOutput] = useState('')
  const [mcpCommands, setMcpCommands] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isFetchingPage, setIsFetchingPage] = useState(false)

  const fetchPageContent = async () => {
    setIsFetchingPage(true)
    try {
      // Extract path from URL
      const urlPath = pageUrl.replace(/^https?:\/\/[^\/]+/, '')

      // Fetch the page content
      const response = await fetch(`/api/fetch-page-content?path=${encodeURIComponent(urlPath)}`)
      const data = await response.json()

      if (data.success && data.content) {
        setProgressiveCode(data.content)
        // Auto-detect business type from URL
        if (urlPath.includes('salon')) setBusinessType('salon')
        else if (urlPath.includes('restaurant')) setBusinessType('restaurant')
        else if (urlPath.includes('retail')) setBusinessType('retail')
        else if (urlPath.includes('healthcare')) setBusinessType('healthcare')
      } else {
        alert('Failed to fetch page content. Please check the URL or paste the code manually.')
      }
    } catch (error) {
      console.error('Error fetching page:', error)
      alert('Error fetching page. Please paste the code manually.')
    } finally {
      setIsFetchingPage(false)
    }
  }

  const analyzeProgressiveCode = async () => {
    setIsAnalyzing(true)

    // If URL mode and no code yet, fetch it first
    if (inputMode === 'url' && !progressiveCode && pageUrl) {
      await fetchPageContent()
    }

    // Simulate analysis - in production, this would use AI/parsing
    setTimeout(() => {
      const result: AnalysisResult = {
        entities: [],
        relationships: [],
        transactions: [],
        organizationInfo: {
          name: organizationName || 'Demo Business',
          type: businessType
        }
      }

      // Extract customer data
      const customerMatches = progressiveCode.matchAll(
        /name:\s*'([^']+)'[^}]*email:\s*'([^']+)'[^}]*phone:\s*'([^']+)'/g
      )
      for (const match of customerMatches) {
        result.entities.push({
          type: 'customer',
          name: match[1],
          fields: {
            email: match[2],
            phone: match[3]
          },
          smartCode: `HERA.${businessType.toUpperCase()}.CUST.${match[1].split(' ')[1]?.toUpperCase() || 'DEMO'}.v1`
        })
      }

      // Extract service data
      const serviceMatches = progressiveCode.matchAll(/service:\s*'([^']+)'[^}]*price:\s*(\d+)/g)
      for (const match of serviceMatches) {
        result.entities.push({
          type: 'service',
          name: match[1],
          fields: {
            price: parseFloat(match[2])
          },
          smartCode: `HERA.${businessType.toUpperCase()}.SVC.${match[1].replace(/\s+/g, '_').toUpperCase()}.v1`
        })
      }

      setAnalysisResult(result)
      generateSQL(result)
      generateMCPCommands(result)
      setIsAnalyzing(false)
    }, 2000)
  }

  const generateSQL = (analysis: AnalysisResult) => {
    let sql = `-- HERA Progressive to Production SQL Conversion
-- Generated for: ${analysis.organizationInfo.name}
-- Business Type: ${analysis.organizationInfo.type}
-- Generated: ${new Date().toISOString()}

-- Step 1: Create Organization
INSERT INTO core_organizations (organization_name, organization_type, settings)
VALUES ('${analysis.organizationInfo.name}', '${analysis.organizationInfo.type}', 
  '{"currency": "USD", "timezone": "America/New_York"}'::jsonb);

-- Get the organization ID
DO $$ 
DECLARE 
  org_id UUID;
BEGIN
  SELECT id INTO org_id FROM core_organizations 
  WHERE organization_name = '${analysis.organizationInfo.name}' LIMIT 1;

  -- Step 2: Create Entities
`

    // Generate entity inserts
    analysis.entities.forEach((entity, index) => {
      sql += `
  -- Create ${entity.type}: ${entity.name}
  INSERT INTO core_entities (
    organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, metadata
  ) VALUES (
    org_id, '${entity.type}', '${entity.name}', 
    '${entity.type.toUpperCase()}-${index + 1}',
    '${entity.smartCode}', 'active', 
    '${JSON.stringify(entity.fields)}'::jsonb
  );
`
    })

    // Add dynamic data for each entity
    analysis.entities.forEach(entity => {
      Object.entries(entity.fields).forEach(([fieldName, fieldValue]) => {
        sql += `
  -- Add dynamic field: ${fieldName} for ${entity.name}
  INSERT INTO core_dynamic_data (
    organization_id, entity_id, field_name, 
    field_value_${typeof fieldValue === 'number' ? 'number' : 'text'},
    smart_code
  ) 
  SELECT org_id, e.id, '${fieldName}', 
    ${typeof fieldValue === 'number' ? fieldValue : `'${fieldValue}'`},
    'HERA.DYN.${fieldName.toUpperCase()}.v1'
  FROM core_entities e
  WHERE e.organization_id = org_id 
    AND e.entity_name = '${entity.name}';
`
      })
    })

    sql += `
END $$;

-- Step 3: Create initial transactions (if any)
-- Add your transaction data here

-- Step 4: Verify installation
SELECT 
  (SELECT COUNT(*) FROM core_organizations WHERE organization_name = '${analysis.organizationInfo.name}') as orgs,
  (SELECT COUNT(*) FROM core_entities WHERE organization_id IN 
    (SELECT id FROM core_organizations WHERE organization_name = '${analysis.organizationInfo.name}')) as entities,
  (SELECT COUNT(*) FROM core_dynamic_data WHERE organization_id IN 
    (SELECT id FROM core_organizations WHERE organization_name = '${analysis.organizationInfo.name}')) as dynamic_fields;
`

    setSqlOutput(sql)
  }

  const generateMCPCommands = (analysis: AnalysisResult) => {
    const commands: string[] = []

    // Organization creation
    commands.push(
      `Create organization ${analysis.organizationInfo.name} with type ${analysis.organizationInfo.type}`
    )

    // Entity creation
    analysis.entities.forEach(entity => {
      commands.push(
        `Create ${entity.type} entity ${entity.name} for ${analysis.organizationInfo.name} with smart code ${entity.smartCode}`
      )

      // Dynamic fields
      Object.entries(entity.fields).forEach(([field, value]) => {
        commands.push(`Set dynamic field ${field} to ${value} for ${entity.type} ${entity.name}`)
      })
    })

    setMcpCommands(commands)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadSQL = () => {
    const blob = new Blob([sqlOutput], { type: 'text/sql' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hera-${organizationName.toLowerCase().replace(/\s+/g, '-')}-setup.sql`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild className="bg-background/80">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  MCP SQL Converter
                </h1>
                <p className="text-slate-800 font-semibold">
                  Convert Progressive Demo Data to Production Database
                </p>
              </div>
            </div>
            <Badge className="px-4 py-2 bg-blue-600/20 text-blue-900 border-blue-600/50 font-medium">
              <Database className="h-4 w-4 mr-2" />
              HERA Universal Schema
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="bg-background/70 backdrop-blur-xl border-white/30 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileCode className="h-6 w-6 text-primary" />
                  Progressive Page Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    placeholder="e.g., Elite Beauty Salon"
                    value={organizationName}
                    onChange={e => setOrganizationName(e.target.value)}
                    className="bg-background/80 border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="business-type">Business Type</Label>
                  <select
                    id="business-type"
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-background/50"
                  >
                    <option value="salon">Salon</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="retail">Retail</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="automotive">Automotive</option>
                  </select>
                </div>

                <div>
                  <Label>Input Method</Label>
                  <div className="flex gap-4 mb-4">
                    <Button
                      type="button"
                      variant={inputMode === 'url' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode('url')}
                      className={inputMode === 'url' ? 'bg-blue-600' : ''}
                    >
                      Page URL
                    </Button>
                    <Button
                      type="button"
                      variant={inputMode === 'code' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode('code')}
                      className={inputMode === 'code' ? 'bg-blue-600' : ''}
                    >
                      Paste Code
                    </Button>
                  </div>

                  {inputMode === 'url' ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="page-url">Progressive Page URL</Label>
                        <Input
                          id="page-url"
                          placeholder="e.g., https://heraerp.com/salon-progressive/customers"
                          value={pageUrl}
                          onChange={e => setPageUrl(e.target.value)}
                          className="bg-background/80 border-border"
                        />
                        <p className="text-xs text-slate-700 mt-1 font-medium">
                          Enter the full URL of your progressive page
                        </p>
                        {/* Quick Demo Links */}
                        <div className="mt-2">
                          <p className="text-xs text-slate-800 mb-1 font-medium">Quick demos:</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPageUrl('https://heraerp.com/salon-progressive/customers')
                              }
                              className="text-xs text-blue-700 hover:text-blue-900 underline font-medium"
                            >
                              Salon Customers
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPageUrl('https://heraerp.com/restaurant-progressive/menu')
                              }
                              className="text-xs text-blue-700 hover:text-blue-900 underline font-medium"
                            >
                              Restaurant Menu
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPageUrl('https://heraerp.com/healthcare-progressive/patients')
                              }
                              className="text-xs text-blue-700 hover:text-blue-900 underline font-medium"
                            >
                              Healthcare Patients
                            </button>
                          </div>
                        </div>
                      </div>
                      {pageUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={fetchPageContent}
                          disabled={isFetchingPage}
                          className="w-full bg-background/80 hover:bg-background/90 border-input"
                        >
                          {isFetchingPage ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                              Fetching Page...
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Fetch Page Content
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="code-input">Paste Progressive Page Code</Label>
                      <Textarea
                        id="code-input"
                        placeholder="Paste your progressive page code here (the demo data section)..."
                        value={progressiveCode}
                        onChange={e => setProgressiveCode(e.target.value)}
                        className="h-64 font-mono text-sm bg-background/80 border-border text-slate-800"
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={analyzeProgressiveCode}
                  disabled={(!progressiveCode && !pageUrl) || !organizationName || isAnalyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-foreground font-medium"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Analyze & Convert
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {analysisResult && (
              <Card className="bg-background/70 backdrop-blur-xl border-white/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    Analysis Complete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-medium">Entities Found:</span>
                      <span className="font-semibold text-foreground">
                        {analysisResult.entities.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-medium">Customers:</span>
                      <span className="font-semibold text-foreground">
                        {analysisResult.entities.filter(e => e.type === 'customer').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-medium">Services:</span>
                      <span className="font-semibold text-foreground">
                        {analysisResult.entities.filter(e => e.type === 'service').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <Tabs defaultValue="sql" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-background/60 border border-white/40">
                <TabsTrigger value="sql">SQL Output</TabsTrigger>
                <TabsTrigger value="mcp">MCP Commands</TabsTrigger>
              </TabsList>

              <TabsContent value="sql">
                <Card className="bg-background/70 backdrop-blur-xl border-white/30 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <Database className="h-6 w-6 text-purple-600" />
                        Generated SQL
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(sqlOutput)}
                          disabled={!sqlOutput}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={downloadSQL}
                          disabled={!sqlOutput}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-background text-slate-100 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {sqlOutput || '-- SQL will appear here after analysis'}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mcp">
                <Card className="bg-background/70 backdrop-blur-xl border-white/30 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Terminal className="h-6 w-6 text-green-600" />
                      MCP Commands
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mcpCommands.length > 0 ? (
                        mcpCommands.map((cmd, index) => (
                          <div
                            key={index}
                            className="p-3 bg-background/70 rounded-lg border border-border font-mono text-sm text-slate-800"
                          >
                            <span className="text-blue-700 font-bold">{index + 1}.</span> {cmd}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-slate-700 font-medium py-8">
                          MCP commands will appear here after analysis
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Next Steps */}
            {analysisResult && (
              <Card className="bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-xl border-white/40 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Next Steps
                  </h3>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-primary">1.</span>
                      <span className="text-slate-800">
                        Execute the SQL in your Supabase database or use MCP commands in Claude
                        Desktop
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-primary">2.</span>
                      <span className="text-slate-800">
                        Use the Page Production Wizard to update your progressive page code
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-primary">3.</span>
                      <span className="text-slate-800">
                        Deploy your production-ready application with real data
                      </span>
                    </li>
                  </ol>

                  <Button
                    asChild
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-foreground font-medium"
                  >
                    <Link href="/mcp-page-wizard">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Go to Page Production Wizard
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
