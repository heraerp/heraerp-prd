/**
 * Universal Report Viewer Component
 * Smart Code: HERA.UI.URP.VIEWER.V1
 *
 * React component for displaying URP reports
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Download, FileText, AlertCircle } from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { cn } from '@/lib/utils'

interface ReportRecipe {
  name: string
  description: string
  category: string
  parameters: Array<{
    name: string
    type: string
    required?: boolean
    default?: any
    description?: string
  }>
  smartCode: string
}

interface UniversalReportViewerProps {
  organizationId: string
  defaultRecipe?: string
  className?: string
  onReportLoad?: (data: any) => void
}

export function UniversalReportViewer({
  organizationId,
  defaultRecipe,
  className,
  onReportLoad
}: UniversalReportViewerProps) {
  const [recipes, setRecipes] = useState<ReportRecipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<string>(defaultRecipe || '')
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingRecipes, setLoadingRecipes] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parameters, setParameters] = useState<Record<string, any>>({})

  // Load available recipes
  useEffect(() => {
    loadRecipes()
  }, [])

  // Set default parameters when recipe changes
  useEffect(() => {
    if (selectedRecipe) {
      const recipe = recipes.find(r => r.name === selectedRecipe)
      if (recipe) {
        const defaults: Record<string, any> = {}
        recipe.parameters.forEach(param => {
          if (param.default !== undefined) {
            defaults[param.name] = param.default
          }
        })
        setParameters(defaults)
      }
    }
  }, [selectedRecipe, recipes])

  async function loadRecipes() {
    try {
      const response = await fetch('/api/v1/urp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await universalApi.getAuthToken()}`
        },
        body: JSON.stringify({ action: 'list' })
      })

      if (!response.ok) {
        throw new Error('Failed to load recipes')
      }

      const data = await response.json()
      setRecipes(data.recipes || [])

      // Set default recipe if provided and exists
      if (defaultRecipe && data.recipes.some((r: ReportRecipe) => r.name === defaultRecipe)) {
        setSelectedRecipe(defaultRecipe)
      }
    } catch (err: any) {
      console.error('Error loading recipes:', err)
      setError('Failed to load report recipes')
    } finally {
      setLoadingRecipes(false)
    }
  }

  async function executeReport(refreshCache = false) {
    if (!selectedRecipe) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/urp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await universalApi.getAuthToken()}`
        },
        body: JSON.stringify({
          action: 'execute',
          recipe: selectedRecipe,
          parameters,
          format: 'json',
          refreshCache
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to execute report')
      }

      const data = await response.json()
      setReportData(data.data)

      if (onReportLoad) {
        onReportLoad(data.data)
      }
    } catch (err: any) {
      console.error('Error executing report:', err)
      setError(err.message || 'Failed to execute report')
    } finally {
      setLoading(false)
    }
  }

  function exportReport(format: 'csv' | 'excel') {
    // This would trigger a download
    console.log('Export report as:', format)
  }

  const selectedRecipeDetails = recipes.find(r => r.name === selectedRecipe)
  const categoryColors: Record<string, string> = {
    finance: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    sales: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    inventory: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    production: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Universal Report Viewer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recipe Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select
              value={selectedRecipe}
              onValueChange={setSelectedRecipe}
              disabled={loadingRecipes}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a report type" />
              </SelectTrigger>
              <SelectContent>
                {recipes.map(recipe => (
                  <SelectItem key={recipe.name} value={recipe.name}>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', categoryColors[recipe.category])}
                      >
                        {recipe.category}
                      </Badge>
                      <span>{recipe.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parameters */}
          {selectedRecipeDetails && selectedRecipeDetails.parameters.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Report Parameters</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRecipeDetails.parameters.map(param => (
                  <div key={param.name} className="space-y-1">
                    <label className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {param.description || param.name}
                      {param.required && <span className="text-red-500">*</span>}
                    </label>
                    {param.type === 'boolean' ? (
                      <Select
                        value={String(parameters[param.name] || false)}
                        onValueChange={val =>
                          setParameters({
                            ...parameters,
                            [param.name]: val === 'true'
                          })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <input
                        type={param.type === 'number' ? 'number' : 'text'}
                        className="w-full px-3 py-2 text-sm border rounded-md dark:bg-muted"
                        value={parameters[param.name] || ''}
                        onChange={e =>
                          setParameters({
                            ...parameters,
                            [param.name]:
                              param.type === 'number'
                                ? parseFloat(e.target.value) || 0
                                : e.target.value
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => executeReport(false)}
              disabled={!selectedRecipe || loading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => executeReport(true)}
              disabled={!selectedRecipe || loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            {reportData && (
              <>
                <Button variant="outline" onClick={() => exportReport('csv')} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>

                <Button variant="outline" onClick={() => exportReport('excel')} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Report Display */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedRecipeDetails?.description || 'Report Results'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <pre className="text-sm">{JSON.stringify(reportData, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
