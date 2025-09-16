'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ================================================================================
// MCP PAGE PRODUCTION WIZARD - Convert Progressive Pages to Production
// Removes hardcoding and connects to Universal API
// Smart Code: HERA.MCP.PAGE.WIZARD.v1
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
import { Progress } from '@/components/ui/progress'
import {
  Code,
  Wand2,
  Copy,
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FileCode,
  Zap,
  Play,
  ArrowLeft,
  Database,
  RefreshCw,
  GitBranch,
  Package,
  Loader2,
  Save
} from 'lucide-react'
import Link from 'next/link'

interface ConversionStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  code?: string
}

export default function MCPPageWizard() {
  const [inputMode, setInputMode] = useState<'url' | 'code'>('url')
  const [pageUrl, setPageUrl] = useState('')
  const [originalCode, setOriginalCode] = useState('')
  const [convertedCode, setConvertedCode] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [isFetchingPage, setIsFetchingPage] = useState(false)
  const [conversionSteps, setConversionSteps] = useState<ConversionStep[]>([])
  const [progress, setProgress] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const fetchPageContent = async () => {
    setIsFetchingPage(true)
    try {
      const urlPath = pageUrl.replace(/^https?:\/\/[^\/]+/, '')
      const response = await fetch(`/api/fetch-page-content?path=${encodeURIComponent(urlPath)}`)
      const data = await response.json()

      if (data.success && data.content) {
        setOriginalCode(data.content)
        return true
      } else {
        alert('Failed to fetch page content. Please check the URL or paste the code manually.')
        return false
      }
    } catch (error) {
      console.error('Error fetching page:', error)
      alert('Error fetching page. Please paste the code manually.')
      return false
    } finally {
      setIsFetchingPage(false)
    }
  }

  const startConversion = async () => {
    setIsConverting(true)
    setProgress(0)

    // If URL mode and no code yet, fetch it first
    if (inputMode === 'url' && !originalCode && pageUrl) {
      const success = await fetchPageContent()
      if (!success) {
        setIsConverting(false)
        return
      }
    }

    const steps: ConversionStep[] = [
      {
        id: 'analyze',
        name: 'Analyze Hard-coded Data',
        description: 'Identifying demo data and hard-coded values',
        status: 'pending'
      },
      {
        id: 'imports',
        name: 'Add Universal API Imports',
        description: 'Adding necessary imports and hooks',
        status: 'pending'
      },
      {
        id: 'state',
        name: 'Convert to Dynamic State',
        description: 'Replace static data with useState and useEffect',
        status: 'pending'
      },
      {
        id: 'api',
        name: 'Connect to Universal API',
        description: 'Add API calls to fetch real data',
        status: 'pending'
      },
      {
        id: 'cleanup',
        name: 'Clean Up & Optimize',
        description: 'Remove demo flags and optimize performance',
        status: 'pending'
      }
    ]

    setConversionSteps(steps)
    processConversion(steps)
  }

  const processConversion = async (steps: ConversionStep[]) => {
    let converted = originalCode

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]

      // Update step status
      setConversionSteps(prev =>
        prev.map(s => (s.id === step.id ? { ...s, status: 'processing' } : s))
      )

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Perform conversion based on step
      switch (step.id) {
        case 'analyze':
          // Find hard-coded data patterns
          converted = analyzeHardcodedData(converted)
          break

        case 'imports':
          // Add Universal API imports
          converted = addUniversalImports(converted)
          break

        case 'state':
          // Convert to dynamic state
          converted = convertToDynamicState(converted)
          break

        case 'api':
          // Add API connections
          converted = addAPIConnections(converted)
          break

        case 'cleanup':
          // Clean up code
          converted = cleanupCode(converted)
          break
      }

      // Update step status to completed
      setConversionSteps(prev =>
        prev.map(s => (s.id === step.id ? { ...s, status: 'completed', code: converted } : s))
      )

      setProgress(((i + 1) / steps.length) * 100)
    }

    setConvertedCode(converted)
    setIsConverting(false)
  }

  const analyzeHardcodedData = (code: string): string => {
    // Mark hard-coded data sections
    let analyzed = code

    // Find const declarations with demo data
    analyzed = analyzed.replace(/const\s+(\w+)\s*=\s*\[[\s\S]*?\]/g, (match, varName) => {
      if (match.includes('name:') || match.includes('email:') || match.includes('price:')) {
        return `// TODO: Replace with API data\n// ${match}`
      }
      return match
    })

    return analyzed
  }

  const addUniversalImports = (code: string): string => {
    const imports = `import { universalApi } from '@/lib/universal-api'
import { useEffect, useState } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Loader2 } from 'lucide-react'

`

    // Add imports after existing imports
    const importEndIndex = code.lastIndexOf('import')
    const nextLineIndex = code.indexOf('\n', importEndIndex)

    return code.slice(0, nextLineIndex + 1) + '\n' + imports + code.slice(nextLineIndex + 1)
  }

  const convertToDynamicState = (code: string): string => {
    let converted = code

    // Replace hard-coded demo data with state
    converted = converted.replace(
      /const\s+initialCustomers\s*=\s*\[[\s\S]*?\]/,
      `const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)`
    )

    // Replace other demo data arrays
    converted = converted.replace(
      /const\s+demoData\s*=\s*{[\s\S]*?}/,
      `const [businessData, setBusinessData] = useState({
    todayAppointments: [],
    quickStats: {
      todayRevenue: 0,
      appointmentsToday: 0,
      clientsServed: 0,
      averageTicket: 0
    },
    recentClients: []
  })`
    )

    return converted
  }

  const addAPIConnections = (code: string): string => {
    let converted = code

    // Add useEffect for data fetching
    const dataFetchingCode = `
  // Fetch data from Universal API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Set organization context
        const { heraContext } = useMultiOrgAuth()
        if (heraContext?.organizationId) {
          universalApi.setOrganizationId(heraContext.organizationId)
          
          // Fetch customers
          const customersData = await universalApi.query('core_entities', {
            entity_type: 'customer',
            status: 'active'
          })
          
          // Transform to component format
          const transformedCustomers = await Promise.all(
            customersData.map(async (customer) => {
              // Get dynamic fields
              const dynamicData = await universalApi.getDynamicFields(customer.id)
              
              return {
                id: customer.id,
                name: customer.entity_name,
                email: dynamicData.email || '',
                phone: dynamicData.phone || '',
                totalSpent: dynamicData.total_spent || 0,
                visits: dynamicData.visit_count || 0,
                lastVisit: dynamicData.last_visit_date || '',
                loyaltyTier: dynamicData.loyalty_tier || 'Bronze'
              }
            })
          )
          
          setCustomers(transformedCustomers)
          
          // Fetch today's appointments
          const appointments = await universalApi.query('universal_transactions', {
            transaction_type: 'appointment',
            transaction_date: new Date().toISOString().split('T')[0]
          })
          
          // Update business data
          setBusinessData(prev => ({
            ...prev,
            todayAppointments: appointments,
            quickStats: {
              todayRevenue: appointments.reduce((sum, apt) => sum + (apt.total_amount || 0), 0),
              appointmentsToday: appointments.length,
              clientsServed: new Set(appointments.map(a => a.reference_entity_id)).size,
              averageTicket: appointments.length > 0 
                ? appointments.reduce((sum, apt) => sum + (apt.total_amount || 0), 0) / appointments.length
                : 0
            }
          }))
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
`

    // Find the component function and add after the state declarations
    const componentMatch = converted.match(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*{/)
    if (componentMatch) {
      const insertIndex = converted.indexOf('{', componentMatch.index) + 1
      const nextStateIndex = converted.indexOf('useState', insertIndex)
      const insertPoint =
        converted.indexOf('\n', converted.lastIndexOf('useState', nextStateIndex)) + 1

      converted = converted.slice(0, insertPoint) + dataFetchingCode + converted.slice(insertPoint)
    }

    return converted
  }

  const cleanupCode = (code: string): string => {
    let cleaned = code

    // Remove test mode flags
    cleaned = cleaned.replace(/testMode/g, 'false')
    cleaned = cleaned.replace(/initialTestMode\s*=\s*true/g, 'initialTestMode = false')

    // Remove demo data comments
    cleaned = cleaned.replace(/\/\/\s*Progressive Demo Data[\s\S]*?(?=\n\n)/g, '')

    // Add loading states to render
    const renderLoadingCode = `
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading business data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading data: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }
`

    // Insert loading states before main return
    const mainReturnIndex = cleaned.lastIndexOf('return (')
    cleaned =
      cleaned.slice(0, mainReturnIndex) +
      renderLoadingCode +
      '\n\n  ' +
      cleaned.slice(mainReturnIndex)

    return cleaned
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadCode = () => {
    const blob = new Blob([convertedCode], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'production-ready-page.tsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const saveToProduction = async () => {
    if (!convertedCode || !pageUrl) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const urlPath = pageUrl.replace(/^https?:\/\/[^\/]+/, '')
      const response = await fetch('/api/save-production-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: convertedCode,
          originalPath: urlPath,
          fileName: 'page.tsx'
        })
      })

      const data = await response.json()

      if (data.success) {
        setSaveSuccess(true)
        alert(`File saved successfully to: ${data.filePath}`)
      } else {
        alert(`Failed to save file: ${data.error}`)
      }
    } catch (error) {
      console.error('Error saving file:', error)
      alert('Error saving file. Please try downloading instead.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100">
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
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Page Production Wizard
                </h1>
                <p className="text-slate-700 font-medium">
                  Convert Progressive Pages to Production-Ready Code
                </p>
              </div>
            </div>
            <Badge className="px-4 py-2 bg-purple-500/20 text-purple-800 border-purple-500/30">
              <Code className="h-4 w-4 mr-2" />
              Universal API Integration
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="bg-background/40 backdrop-blur-xl border-border/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileCode className="h-6 w-6 text-purple-600" />
                  Progressive Page Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Input Method</Label>
                  <div className="flex gap-4 mb-4">
                    <Button
                      type="button"
                      variant={inputMode === 'url' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode('url')}
                      className={inputMode === 'url' ? 'bg-purple-600' : ''}
                    >
                      Page URL
                    </Button>
                    <Button
                      type="button"
                      variant={inputMode === 'code' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode('code')}
                      className={inputMode === 'code' ? 'bg-purple-600' : ''}
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
                          className="bg-background/50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter the full URL of your progressive page
                        </p>
                        {/* Quick Demo Links */}
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Quick demos:</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPageUrl('https://heraerp.com/salon-progressive/customers')
                              }
                              className="text-xs text-primary hover:text-blue-800 underline"
                            >
                              Salon Customers
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPageUrl('https://heraerp.com/restaurant-progressive/pos')
                              }
                              className="text-xs text-primary hover:text-blue-800 underline"
                            >
                              Restaurant POS
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPageUrl('https://heraerp.com/jewelry-progressive/inventory')
                              }
                              className="text-xs text-primary hover:text-blue-800 underline"
                            >
                              Jewelry Inventory
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
                          className="w-full"
                        >
                          {isFetchingPage ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
                      {originalCode && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Page content loaded successfully!
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="original-code">Paste Your Progressive Page Code</Label>
                      <Textarea
                        id="original-code"
                        placeholder="Paste your complete progressive page component code here..."
                        value={originalCode}
                        onChange={e => setOriginalCode(e.target.value)}
                        className="h-96 font-mono text-sm bg-background/80 border-border text-slate-800"
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={startConversion}
                  disabled={(!originalCode && !pageUrl) || isConverting}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Convert to Production
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Conversion Progress */}
            {conversionSteps.length > 0 && (
              <Card className="bg-background/40 backdrop-blur-xl border-border/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <RefreshCw className="h-6 w-6 text-primary" />
                    Conversion Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={progress} className="mb-4" />

                  <div className="space-y-3">
                    {conversionSteps.map(step => (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {step.status === 'completed' && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {step.status === 'processing' && (
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                          )}
                          {step.status === 'pending' && (
                            <div className="h-5 w-5 rounded-full border-2 border-input" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{step.name}</p>
                          <p className="text-sm text-slate-700">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <Card className="bg-background/40 backdrop-blur-xl border-border/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-green-600" />
                    Production-Ready Code
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(convertedCode)}
                      disabled={!convertedCode}
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadCode}
                      disabled={!convertedCode}
                      title="Download as file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={saveToProduction}
                      disabled={!convertedCode || isSaving}
                      className={saveSuccess ? 'bg-green-50 border-green-500' : ''}
                      title="Save to production directory"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : saveSuccess ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-background text-slate-100 p-4 rounded-lg overflow-x-auto h-96">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {convertedCode || '// Production-ready code will appear here after conversion'}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Key Changes */}
            {convertedCode && (
              <Card className="bg-gradient-to-br from-green-500/30 to-blue-500/30 backdrop-blur-xl border-white/40 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-green-600" />
                    Key Changes Made
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-slate-800">
                        Added Universal API imports and authentication hooks
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-slate-800">
                        Replaced hard-coded data with dynamic state management
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-slate-800">
                        Added API calls to fetch real data from Supabase
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-slate-800">
                        Implemented proper loading and error states
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-slate-800">Removed test mode flags and demo data</span>
                    </li>
                  </ul>

                  <Alert className="mt-4">
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      Your page is now ready for production deployment with real data from the
                      Universal API!
                    </AlertDescription>
                  </Alert>

                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save to Production
                    </h4>
                    <p className="text-sm text-purple-800 mb-3">
                      Click the save button above to automatically create the production file in the
                      correct location.
                    </p>
                    {pageUrl && (
                      <p className="text-xs text-purple-700">
                        Will save to:{' '}
                        <code className="bg-purple-100 px-1 rounded">
                          {pageUrl.replace(/^https?:\/\/[^\/]+/, '').replace('-progressive', '')}
                          /page.tsx
                        </code>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
