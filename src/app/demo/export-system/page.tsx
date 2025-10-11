'use client'

// Skip SSG for this page - client-only hooks being used
export const dynamic = 'force-dynamic'

import React, { useState, lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  Package,
  Download,
  Code,
  Layers,
  Smartphone,
  Building2,
  Zap,
  Settings,
  Info,
  CheckCircle,
  ExternalLink,
  Copy,
  Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'

// Import DNA system metadata and utilities
import {
  HERA_DNA_INFO,
  HERA_DNA_CATEGORIES,
  HERA_DNA_REGISTRY,
  loadDNAComponent,
  getComponentMetadata,
  getComponentsByCategory,
  HERA_DNA_SMART_CODES
} from '@/lib/dna'

// Import some example components to show they work
import { StatCardDNA, BottomSheet, useBottomSheet } from '@/lib/dna'

// Example lazy loading
const LazyStatCard = lazy(() =>
  import('@/lib/dna').then(module => ({
    default: module.StatCardDNA
  }))
)

const categoryIcons = {
  CORE_UI: Layers,
  ENTERPRISE: Building2,
  BUSINESS_LOGIC: Zap,
  MOBILE: Smartphone,
  SPECIALIZED: Settings
}

const categoryDescriptions = {
  CORE_UI: 'Essential building blocks for HERA applications',
  ENTERPRISE: 'Business-grade components for enterprise applications',
  BUSINESS_LOGIC: 'Components that handle specific business workflows',
  MOBILE: 'Mobile-optimized interaction patterns',
  SPECIALIZED: 'Purpose-built components for specific use cases'
}

export default function ExportSystemDemoPage() {
  // Early return for SSG/build - client-only components
  if (typeof window === 'undefined') return null

  const [selectedCategory, setSelectedCategory] = useState<keyof typeof HERA_DNA_CATEGORIES | null>(
    null
  )
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [loadedComponent, setLoadedComponent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null)

  const { toast } = useToast()
  const bottomSheet = typeof useBottomSheet === 'function' ? useBottomSheet() : { open: () => {}, close: () => {} }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to Clipboard',
      description: text,
      variant: 'default'
    })
  }

  const handleDynamicLoad = async (componentKey: string) => {
    setIsLoading(true)
    try {
      const component = await loadDNAComponent(componentKey as keyof typeof HERA_DNA_REGISTRY)
      setLoadedComponent(component)
      toast({
        title: 'Component Loaded',
        description: `Successfully loaded ${componentKey}`,
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: 'Load Failed',
        description: `Failed to load ${componentKey}`,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLazyDemo = async (componentName: string) => {
    setLoadingDemo(componentName)

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    setLoadingDemo(null)
    toast({
      title: 'Lazy Loading Demo',
      description: `${componentName} loaded successfully`,
      variant: 'default'
    })
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            HERA DNA Export System
          </h1>
        </motion.div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Unified component library with tree-shaking support, dynamic loading, and comprehensive
          TypeScript integration. Discover and import HERA DNA components efficiently.
        </p>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Library Details</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Name:</span> {HERA_DNA_INFO.name}
                </p>
                <p>
                  <span className="font-medium">Version:</span> {HERA_DNA_INFO.version}
                </p>
                <p>
                  <span className="font-medium">Components:</span> {HERA_DNA_INFO.components.total}
                </p>
                <p>
                  <span className="font-medium">Smart Code:</span>
                  <code className="ml-1 text-xs bg-muted px-1 rounded">
                    {HERA_DNA_INFO.smartCode}
                  </code>
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Categories</h4>
              <div className="flex flex-wrap gap-1">
                {HERA_DNA_INFO.components.categories.map(category => (
                  <Badge key={category} variant="outline" className="text-xs">
                    {category.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Technology Stack</h4>
              <div className="flex flex-wrap gap-1">
                {HERA_DNA_INFO.components.frameworks.map(framework => (
                  <Badge key={framework} variant="secondary" className="text-xs">
                    {framework}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Browser */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Component Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(HERA_DNA_CATEGORIES).map(([categoryKey, components]) => {
                  const Icon = categoryIcons[categoryKey as keyof typeof categoryIcons]
                  const isSelected = selectedCategory === categoryKey

                  return (
                    <div
                      key={categoryKey}
                      onClick={() =>
                        setSelectedCategory(categoryKey as keyof typeof HERA_DNA_CATEGORIES)
                      }
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50 hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{categoryKey.replace('_', ' ')}</h4>
                            <Badge variant="outline" className="text-xs">
                              {components.length} components
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {categoryDescriptions[categoryKey as keyof typeof categoryDescriptions]}
                          </p>

                          {isSelected && (
                            <div className="mt-3 space-y-2">
                              {components.map(component => (
                                <div
                                  key={component}
                                  onClick={e => {
                                    e.stopPropagation()
                                    setSelectedComponent(component)
                                  }}
                                  className="flex items-center justify-between p-2 bg-background rounded border hover:bg-accent cursor-pointer"
                                >
                                  <span className="text-sm font-mono">{component}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Component Details */}
        <div>
          <Tabs defaultValue="details" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="import">Import</TabsTrigger>
              <TabsTrigger value="demo">Demo</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Component Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedComponent ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Component Selected</span>
                      </div>

                      {(() => {
                        const metadata = getComponentMetadata(selectedComponent)
                        return (
                          <div className="space-y-3 p-4 bg-muted rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Name</p>
                              <p className="font-mono">{metadata.name}</p>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Category</p>
                              <Badge variant="outline">
                                {metadata.category?.replace('_', ' ')}
                              </Badge>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Version</p>
                              <Badge variant="outline">v{metadata.version}</Badge>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Smart Code
                              </p>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-background p-1 rounded">
                                  {metadata.smartCode}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(metadata.smartCode)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Select a component to see details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="import" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Import Examples
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedComponent ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Named Import (Recommended)</p>
                        <div className="relative">
                          <pre className="p-3 bg-muted rounded text-xs overflow-auto">
                            {`import { ${selectedComponent} } from '@/lib/dna'`}
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-1 right-1"
                            onClick={() =>
                              copyToClipboard(`import { ${selectedComponent} } from '@/lib/dna'`)
                            }
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">With Types</p>
                        <div className="relative">
                          <pre className="p-3 bg-muted rounded text-xs overflow-auto">
                            {`import { ${selectedComponent}, type ${selectedComponent}Props } from '@/lib/dna'`}
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-1 right-1"
                            onClick={() =>
                              copyToClipboard(
                                `import { ${selectedComponent}, type ${selectedComponent}Props } from '@/lib/dna'`
                              )
                            }
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Lazy Loading</p>
                        <div className="relative">
                          <pre className="p-3 bg-muted rounded text-xs overflow-auto">
                            {`const Lazy${selectedComponent} = lazy(() => 
  import('@/lib/dna').then(module => ({ 
    default: module.${selectedComponent} 
  }))
)`}
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-1 right-1"
                            onClick={() =>
                              copyToClipboard(
                                `const Lazy${selectedComponent} = lazy(() => import('@/src/lib/dna').then(module => ({ default: module.${selectedComponent} })))`
                              )
                            }
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Dynamic Loading</p>
                        <div className="space-y-2">
                          <div className="relative">
                            <pre className="p-3 bg-muted rounded text-xs overflow-auto">
                              {`import { loadDNAComponent } from '@/lib/dna'

const component = await loadDNAComponent('${selectedComponent
                                .toLowerCase()
                                .replace(/([A-Z])/g, '-$1')
                                .substring(1)}')`}
                            </pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-1 right-1"
                              onClick={() =>
                                copyToClipboard(
                                  `import { loadDNAComponent } from '@/lib/dna'\n\nconst component = await loadDNAComponent('${selectedComponent
                                    .toLowerCase()
                                    .replace(/([A-Z])/g, '-$1')
                                    .substring(1)}')`
                                )
                              }
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>

                          <Button
                            onClick={() =>
                              handleDynamicLoad(
                                selectedComponent
                                  .toLowerCase()
                                  .replace(/([A-Z])/g, '-$1')
                                  .substring(1)
                              )
                            }
                            disabled={isLoading}
                            className="w-full"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                Test Dynamic Load
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Select a component to see import examples
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="demo" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Live Demo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Working Component Examples */}
                    <div>
                      <h4 className="font-medium mb-3">Working Examples</h4>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <p className="text-sm font-medium mb-2">StatCardDNA (Named Import)</p>
                          <StatCardDNA
                            title="Example Metric"
                            value="$125,000"
                            trend="+12%"
                            description="Direct import from DNA system"
                          />
                        </div>

                        <div className="p-3 border rounded-lg">
                          <p className="text-sm font-medium mb-2">BottomSheet with Hook</p>
                          <Button onClick={bottomSheet.open}>Open BottomSheet</Button>
                          <BottomSheet {...bottomSheet}>
                            <div className="p-6">
                              <h3 className="font-bold mb-2">Mobile Component Demo</h3>
                              <p className="text-muted-foreground">
                                This BottomSheet was imported from the HERA DNA export system and
                                uses the useBottomSheet hook.
                              </p>
                            </div>
                          </BottomSheet>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <p className="text-sm font-medium mb-2">Lazy Loading Demo</p>
                          <div className="space-y-2">
                            <Button
                              onClick={() => handleLazyDemo('StatCardDNA')}
                              disabled={loadingDemo === 'StatCardDNA'}
                              variant="outline"
                            >
                              {loadingDemo === 'StatCardDNA' ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Loading StatCard...
                                </>
                              ) : (
                                'Load StatCard Lazily'
                              )}
                            </Button>

                            <Suspense
                              fallback={
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Loading component...
                                </div>
                              }
                            >
                              <LazyStatCard
                                title="Lazy Loaded"
                                value="Success!"
                                description="This component was loaded lazily"
                              />
                            </Suspense>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Component Registry Info */}
                    <div>
                      <h4 className="font-medium mb-3">Component Registry</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <ScrollArea className="h-32">
                          <div className="space-y-1">
                            {Object.keys(HERA_DNA_REGISTRY).map(key => (
                              <div key={key} className="text-xs font-mono">
                                {key}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Smart Codes Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Codes Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(HERA_DNA_SMART_CODES).map(([key, code]) => (
              <div key={key} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{key.replace(/_/g, ' ')}</h4>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(code)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <code className="text-xs text-muted-foreground block break-all">{code}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
