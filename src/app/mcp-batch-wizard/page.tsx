'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ================================================================================
// MCP BATCH PRODUCTION WIZARD - Convert All Progressive Pages at Once
// Batch converts entire progressive apps to production
// Smart Code: HERA.MCP.BATCH.WIZARD.v1
// ================================================================================

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Progress } from '@/src/components/ui/progress'
import { Checkbox } from '@/src/components/ui/checkbox'
import {
  Package,
  Wand2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FolderOpen,
  Loader2,
  ArrowLeft,
  Save,
  FileCode,
  Zap,
  RefreshCw,
  Download,
  Copy
} from 'lucide-react'
import Link from 'next/link'

interface PageInfo {
  name: string
  path: string
  displayName: string
  selected?: boolean
  status?: 'pending' | 'processing' | 'completed' | 'error'
  convertedCode?: string
  error?: string
}

export default function MCPBatchWizard() {
  const [baseUrl, setBaseUrl] = useState('')
  const [isLoadingPages, setIsLoadingPages] = useState(false)
  const [pages, setPages] = useState<PageInfo[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState(0)
  const [currentPage, setCurrentPage] = useState<string>('')

  const loadProgressivePages = async () => {
    if (!baseUrl) return

    setIsLoadingPages(true)
    try {
      const urlPath = baseUrl.replace(/^https?:\/\/[^\/]+/, '')
      const response = await fetch(
        `/api/list-progressive-pages?path=${encodeURIComponent(urlPath)}`
      )
      const data = await response.json()

      if (data.success && data.pages) {
        setPages(data.pages.map(page => ({ ...page, selected: true, status: 'pending' })))
      } else {
        alert('Failed to load pages. Please check the URL.')
      }
    } catch (error) {
      console.error('Error loading pages:', error)
      alert('Error loading pages. Please check the URL.')
    } finally {
      setIsLoadingPages(false)
    }
  }

  const togglePageSelection = (index: number) => {
    setPages(prev =>
      prev.map((page, i) => (i === index ? { ...page, selected: !page.selected } : page))
    )
  }

  const selectAll = (selected: boolean) => {
    setPages(prev => prev.map(page => ({ ...page, selected })))
  }

  const fetchAndConvertPage = async (page: PageInfo): Promise<string> => {
    // Fetch page content
    const fullUrl = baseUrl.replace(/\/[^\/]+\/?$/, '') + '/' + page.path
    const urlPath = fullUrl.replace(/^https?:\/\/[^\/]+/, '')

    const fetchResponse = await fetch(`/api/fetch-page-content?path=${encodeURIComponent(urlPath)}`)
    const fetchData = await fetchResponse.json()

    if (!fetchData.success || !fetchData.content) {
      throw new Error('Failed to fetch page content')
    }

    // Convert the page (simplified version - in production, this would use the full conversion logic)
    let converted = fetchData.content

    // Add imports
    converted = addUniversalImports(converted)

    // Convert static data to dynamic
    converted = convertToDynamicState(converted)

    // Add API connections
    converted = addAPIConnections(converted)

    // Clean up
    converted = cleanupCode(converted)

    return converted
  }

  const addUniversalImports = (code: string): string => {
    const imports = `import { universalApi } from '@/src/lib/universal-api'
import { useEffect, useState } from 'react'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { Loader2 } from 'lucide-react'

`

    const importEndIndex = code.lastIndexOf('import')
    const nextLineIndex = code.indexOf('\n', importEndIndex)

    return code.slice(0, nextLineIndex + 1) + '\n' + imports + code.slice(nextLineIndex + 1)
  }

  const convertToDynamicState = (code: string): string => {
    let converted = code

    // Replace hard-coded demo data arrays
    converted = converted.replace(
      /const\s+initial\w+\s*=\s*\[[\s\S]*?\]/g,
      'const [data, setData] = useState([])\n  const [isLoading, setIsLoading] = useState(true)'
    )

    return converted
  }

  const addAPIConnections = (code: string): string => {
    // This is a simplified version - the full implementation would be more sophisticated
    return code
  }

  const cleanupCode = (code: string): string => {
    let cleaned = code
    cleaned = cleaned.replace(/testMode/g, 'false')
    cleaned = cleaned.replace(/\/\/\s*Progressive Demo Data[\s\S]*?(?=\n\n)/g, '')
    return cleaned
  }

  const savePage = async (page: PageInfo, convertedCode: string) => {
    const response = await fetch('/api/save-production-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: convertedCode,
        originalPath: page.path,
        fileName: 'page.tsx'
      })
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to save file')
    }

    return data.filePath
  }

  const startBatchConversion = async () => {
    const selectedPages = pages.filter(p => p.selected)
    if (selectedPages.length === 0) {
      alert('Please select at least one page to convert')
      return
    }

    setIsConverting(true)
    setConversionProgress(0)

    for (let i = 0; i < selectedPages.length; i++) {
      const page = selectedPages[i]
      const pageIndex = pages.findIndex(p => p.path === page.path)

      setCurrentPage(page.displayName)

      // Update status to processing
      setPages(prev =>
        prev.map((p, idx) => (idx === pageIndex ? { ...p, status: 'processing' } : p))
      )

      try {
        // Convert the page
        const convertedCode = await fetchAndConvertPage(page)

        // Save to production
        await savePage(page, convertedCode)

        // Update status to completed
        setPages(prev =>
          prev.map((p, idx) =>
            idx === pageIndex ? { ...p, status: 'completed', convertedCode } : p
          )
        )
      } catch (error) {
        console.error(`Error converting ${page.displayName}:`, error)

        // Update status to error
        setPages(prev =>
          prev.map((p, idx) =>
            idx === pageIndex ? { ...p, status: 'error', error: error.message } : p
          )
        )
      }

      setConversionProgress(((i + 1) / selectedPages.length) * 100)
    }

    setIsConverting(false)
    setCurrentPage('')
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-input" />
    }
  }

  const completedCount = pages.filter(p => p.status === 'completed').length
  const errorCount = pages.filter(p => p.status === 'error').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100">
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
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Batch Production Wizard
                </h1>
                <p className="text-slate-700 font-medium">
                  Convert All Progressive Pages to Production at Once
                </p>
              </div>
            </div>
            <Badge className="px-4 py-2 bg-indigo-500/20 text-indigo-800 border-indigo-500/30">
              <Package className="h-4 w-4 mr-2" />
              Batch Conversion
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
                  <FolderOpen className="h-6 w-6 text-indigo-600" />
                  Progressive App Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="base-url">Progressive App Base URL</Label>
                  <Input
                    id="base-url"
                    placeholder="e.g., https://heraerp.com/salon-progressive"
                    value={baseUrl}
                    onChange={e => setBaseUrl(e.target.value)}
                    className="bg-background/80 border-border"
                  />
                  <p className="text-xs text-slate-700 mt-1 font-medium">
                    Enter the base URL of a progressive app
                  </p>

                  {/* Quick Demo Links */}
                  <div className="mt-2">
                    <p className="text-xs text-slate-800 mb-1 font-medium">Quick demos:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setBaseUrl('https://heraerp.com/salon-progressive')}
                        className="text-xs text-indigo-700 hover:text-indigo-900 underline font-medium"
                      >
                        Salon App
                      </button>
                      <button
                        type="button"
                        onClick={() => setBaseUrl('https://heraerp.com/restaurant-progressive')}
                        className="text-xs text-indigo-700 hover:text-indigo-900 underline font-medium"
                      >
                        Restaurant App
                      </button>
                      <button
                        type="button"
                        onClick={() => setBaseUrl('https://heraerp.com/healthcare-progressive')}
                        className="text-xs text-indigo-700 hover:text-indigo-900 underline font-medium"
                      >
                        Healthcare App
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={loadProgressivePages}
                  disabled={!baseUrl || isLoadingPages}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-foreground font-medium"
                >
                  {isLoadingPages ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading Pages...
                    </>
                  ) : (
                    <>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Load Progressive Pages
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Page Selection */}
            {pages.length > 0 && (
              <Card className="bg-background/70 backdrop-blur-xl border-white/30 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <FileCode className="h-6 w-6 text-purple-600" />
                      Select Pages to Convert
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => selectAll(true)}>
                        Select All
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => selectAll(false)}>
                        Clear All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {pages.map((page, index) => (
                      <div
                        key={page.path}
                        className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border"
                      >
                        <Checkbox
                          checked={page.selected}
                          onCheckedChange={() => togglePageSelection(index)}
                          disabled={isConverting}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{page.displayName}</p>
                          <p className="text-xs text-muted-foreground">{page.path}</p>
                        </div>
                        {getStatusIcon(page.status)}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={startBatchConversion}
                    disabled={isConverting || pages.filter(p => p.selected).length === 0}
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-foreground font-medium"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Converting {currentPage}...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Convert Selected Pages
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Progress Section */}
          <div className="space-y-6">
            {/* Conversion Progress */}
            {(isConverting || conversionProgress > 0) && (
              <Card className="bg-background/70 backdrop-blur-xl border-white/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <RefreshCw className="h-6 w-6 text-green-600" />
                    Batch Conversion Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={conversionProgress} className="mb-4" />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-medium">Total Pages:</span>
                      <span className="font-semibold text-foreground">
                        {pages.filter(p => p.selected).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-medium">Completed:</span>
                      <span className="font-semibold text-green-600">{completedCount}</span>
                    </div>
                    {errorCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-700 font-medium">Errors:</span>
                        <span className="font-semibold text-red-600">{errorCount}</span>
                      </div>
                    )}
                  </div>

                  {currentPage && (
                    <Alert className="mt-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertDescription>Converting: {currentPage}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Completion Summary */}
            {!isConverting && conversionProgress === 100 && (
              <Card className="bg-gradient-to-br from-green-500/30 to-blue-500/30 backdrop-blur-xl border-white/40 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    Conversion Complete!
                  </h3>

                  <div className="space-y-2 text-sm mb-4">
                    <p className="text-slate-800">
                      Successfully converted {completedCount} pages to production.
                    </p>
                    {errorCount > 0 && (
                      <p className="text-red-700">
                        {errorCount} pages encountered errors during conversion.
                      </p>
                    )}
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      All converted pages have been saved to their production directories!
                    </AlertDescription>
                  </Alert>

                  <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-medium text-indigo-900 mb-2">Next Steps:</h4>
                    <ol className="text-sm text-indigo-800 space-y-1">
                      <li>1. Review the converted files in your production directories</li>
                      <li>2. Test the production pages with real data</li>
                      <li>3. Deploy your production-ready application</li>
                    </ol>
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
