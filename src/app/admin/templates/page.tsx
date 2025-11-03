/**
 * HERA v3.0 Template Management Admin Interface
 * Demonstrates Phase 2: Template Pack System functionality
 */

'use client'

import React, { useState, useEffect } from 'react'
import { templateStorage } from '@/lib/platform/template-storage'
import { templateCompiler } from '@/lib/platform/template-compiler'
import { templateRegistry } from '@/lib/platform/template-registry'
import { DynamicFormGenerator } from '@/components/platform/DynamicFormGenerator'
import { useHERAAuthV3 } from '@/components/auth/HERAAuthProviderV3'
import { 
  getAvailableIndustries,
  getIndustryConfig,
  type IndustryType 
} from '@/lib/platform/constants'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Upload,
  Download,
  Trash2,
  Settings,
  Play,
  FileText,
  Database,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Monitor,
  HardDrive,
  Clock
} from 'lucide-react'

interface TemplatePackInfo {
  industry: IndustryType
  metadata: {
    size: number
    lastModified: string
    version: string
    checksum: string
    author: string
  }
}

export default function TemplateManagementPage() {
  const { user, organization } = useHERAAuthV3()
  const [availablePacks, setAvailablePacks] = useState<TemplatePackInfo[]>([])
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeOperation, setActiveOperation] = useState<string | null>(null)
  const [operationResults, setOperationResults] = useState<string[]>([])
  const [showFormDemo, setShowFormDemo] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  // Load initial data
  useEffect(() => {
    loadTemplateData()
  }, [])

  const loadTemplateData = async () => {
    setIsLoading(true)
    try {
      // Load available template packs
      const packs = await templateStorage.listAvailableTemplatePacks()
      setAvailablePacks(packs)

      // Get cache statistics
      const stats = templateStorage.getCacheStats()
      const compilerStats = templateCompiler.getCacheStats()
      setCacheStats({
        storage: stats,
        compiler: compilerStats
      })

    } catch (error) {
      console.error('Failed to load template data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncLocalToStorage = async () => {
    setActiveOperation('sync')
    setOperationResults([])
    
    try {
      const result = await templateStorage.syncLocalTemplatesToStorage()
      
      const results = [
        `✅ Sync completed: ${result.success ? 'SUCCESS' : 'PARTIAL'}`,
        `📦 Synced: ${result.synced.join(', ')}`,
        ...result.errors.map(error => `❌ Error: ${error}`)
      ]
      
      setOperationResults(results)
      await loadTemplateData() // Refresh data
      
    } catch (error) {
      setOperationResults([`❌ Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`])
    } finally {
      setActiveOperation(null)
    }
  }

  const handleCompileTemplate = async (industry: IndustryType) => {
    setActiveOperation(`compile-${industry}`)
    
    try {
      // Load template pack
      const pack = await templateRegistry.loadTemplatePack(industry)
      
      if (!pack) {
        setOperationResults([`❌ Failed to load template pack: ${industry}`])
        return
      }

      // Load and compile first entity template
      const firstEntityTemplate = pack.entities[0]
      if (firstEntityTemplate) {
        const entityTemplate = await templateRegistry.loadEntityTemplate(industry, firstEntityTemplate)
        
        if (entityTemplate) {
          const compiled = await templateCompiler.compileEntityTemplate(entityTemplate, industry)
          setOperationResults([
            `✅ Template compiled successfully: ${compiled.templateId}`,
            `📝 Type definition generated: ${compiled.typeDefinition.split('\n').length} lines`,
            `🔍 Validation schema: ${Object.keys(compiled.validationSchema).length} fields`,
            `⚛️ React components: Form, List, Card`
          ])
        } else {
          setOperationResults([`❌ Failed to load entity template: ${firstEntityTemplate}`])
        }
      } else {
        setOperationResults([`❌ No entity templates found in pack: ${industry}`])
      }
      
    } catch (error) {
      setOperationResults([`❌ Compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`])
    } finally {
      setActiveOperation(null)
    }
  }

  const handleDeleteTemplatePack = async (industry: IndustryType) => {
    if (!confirm(`Are you sure you want to delete the ${industry} template pack?`)) {
      return
    }

    setActiveOperation(`delete-${industry}`)
    
    try {
      const result = await templateStorage.deleteTemplatePack(industry)
      
      if (result.success) {
        setOperationResults([`✅ Template pack deleted: ${industry}`])
        await loadTemplateData() // Refresh data
      } else {
        setOperationResults([`❌ Failed to delete: ${result.error}`])
      }
      
    } catch (error) {
      setOperationResults([`❌ Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`])
    } finally {
      setActiveOperation(null)
    }
  }

  const handleClearCaches = async () => {
    setActiveOperation('clear-cache')
    
    try {
      templateStorage.clearAllCaches()
      templateCompiler.clearCache()
      templateRegistry.clearCache?.()
      
      setOperationResults([
        '✅ All caches cleared successfully',
        '🗑️ Memory cache: cleared',
        '🗑️ localStorage cache: cleared',
        '🗑️ Compilation cache: cleared'
      ])
      
      await loadTemplateData() // Refresh stats
      
    } catch (error) {
      setOperationResults([`❌ Cache clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`])
    } finally {
      setActiveOperation(null)
    }
  }

  const handleDemoForm = async (templateId: string) => {
    setSelectedTemplate(templateId)
    setShowFormDemo(true)
  }

  const handleFormSubmit = async (data: Record<string, any>) => {
    console.log('Form submitted with data:', data)
    setOperationResults([
      '✅ Form submission successful',
      `📝 Data: ${JSON.stringify(data, null, 2)}`
    ])
    setShowFormDemo(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          Please log in to access the template management interface.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Template Management</h1>
          <p className="text-gray-600 mt-1">
            HERA v3.0 Template Pack System - Phase 2 Implementation
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadTemplateData} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleSyncLocalToStorage}
            disabled={!!activeOperation}
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Sync Local → Storage
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {cacheStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Storage Cache</p>
                  <p className="text-lg font-semibold">{cacheStats.storage.memoryCache.size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Local Storage</p>
                  <p className="text-lg font-semibold">{cacheStats.storage.localStorageCache.size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Compiled</p>
                  <p className="text-lg font-semibold">{cacheStats.compiler.size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Available Packs</p>
                  <p className="text-lg font-semibold">{availablePacks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="template-packs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="template-packs">Template Packs</TabsTrigger>
          <TabsTrigger value="compilation">Compilation</TabsTrigger>
          <TabsTrigger value="demo">Form Demo</TabsTrigger>
          <TabsTrigger value="cache">Cache Management</TabsTrigger>
        </TabsList>

        {/* Template Packs Tab */}
        <TabsContent value="template-packs">
          <Card>
            <CardHeader>
              <CardTitle>Available Template Packs</CardTitle>
              <CardDescription>
                Template packs loaded from Supabase Storage and local files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading template packs...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Industry</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availablePacks.map((pack) => {
                      const industryConfig = getIndustryConfig(pack.industry)
                      return (
                        <TableRow key={pack.industry}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{pack.industry}</Badge>
                              <span className="font-medium">{industryConfig.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{pack.metadata.version}</TableCell>
                          <TableCell>{formatFileSize(pack.metadata.size)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="w-3 h-3" />
                              {new Date(pack.metadata.lastModified).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>{pack.metadata.author}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompileTemplate(pack.industry)}
                                disabled={!!activeOperation}
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTemplatePack(pack.industry)}
                                disabled={!!activeOperation}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compilation Tab */}
        <TabsContent value="compilation">
          <Card>
            <CardHeader>
              <CardTitle>Template Compilation</CardTitle>
              <CardDescription>
                Test template compilation and React component generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getAvailableIndustries().map((industry) => {
                  const config = getIndustryConfig(industry)
                  const isCompiling = activeOperation === `compile-${industry}`
                  
                  return (
                    <Card key={industry} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: config.primaryColor }}
                          />
                          <span className="font-medium">{config.name}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                        <Button
                          size="sm"
                          onClick={() => handleCompileTemplate(industry)}
                          disabled={!!activeOperation}
                          className="w-full"
                        >
                          {isCompiling ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Zap className="w-4 h-4 mr-2" />
                          )}
                          Compile Template
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Demo Tab */}
        <TabsContent value="demo">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Form Demo</CardTitle>
              <CardDescription>
                Test dynamic form generation from entity templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showFormDemo ? (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Select a template to demonstrate dynamic form generation:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleDemoForm('customer_commercial_v1')}
                      className="p-4 h-auto flex-col items-start"
                    >
                      <div className="font-medium">Commercial Customer</div>
                      <div className="text-sm text-gray-600">Waste Management Industry</div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDemoForm('customer_salon_v1')}
                      className="p-4 h-auto flex-col items-start"
                    >
                      <div className="font-medium">Salon Customer</div>
                      <div className="text-sm text-gray-600">Beauty Salon Industry</div>
                    </Button>
                  </div>
                </div>
              ) : (
                <DynamicFormGenerator
                  templateId={selectedTemplate}
                  mode="create"
                  onSubmit={handleFormSubmit}
                  onCancel={() => setShowFormDemo(false)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cache Management Tab */}
        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <CardTitle>Cache Management</CardTitle>
              <CardDescription>
                Monitor and manage template caching system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={handleClearCaches}
                  disabled={!!activeOperation}
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Caches
                </Button>
              </div>
              
              {cacheStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Storage Cache</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p>Memory Cache: {cacheStats.storage.memoryCache.size} items</p>
                        <p>Local Storage: {cacheStats.storage.localStorageCache.size} items</p>
                        <details className="text-sm">
                          <summary className="cursor-pointer">Cache Keys</summary>
                          <ul className="mt-2 space-y-1 text-xs text-gray-600">
                            {cacheStats.storage.memoryCache.keys.map((key: string) => (
                              <li key={key}>{key}</li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Compilation Cache</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p>Compiled Templates: {cacheStats.compiler.size} items</p>
                        <details className="text-sm">
                          <summary className="cursor-pointer">Compiled Keys</summary>
                          <ul className="mt-2 space-y-1 text-xs text-gray-600">
                            {cacheStats.compiler.keys.map((key: string) => (
                              <li key={key}>{key}</li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Operation Results */}
      {operationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Operation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {operationResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded text-sm font-mono ${
                    result.startsWith('✅') ? 'bg-green-50 text-green-800' :
                    result.startsWith('❌') ? 'bg-red-50 text-red-800' :
                    'bg-blue-50 text-blue-800'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}