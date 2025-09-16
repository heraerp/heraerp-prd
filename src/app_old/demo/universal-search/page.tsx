'use client'

import React, { useState } from 'react'
import { UniversalSearch, type SearchResult } from '@/src/lib/dna/components/search/UniversalSearch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Code,
  Settings,
  Users,
  Package,
  CreditCard,
  FileText,
  Calendar,
  Building2,
  Heart,
  ShoppingCart,
  Scissors,
  UtensilsCrossed,
  Factory,
  CheckCircle,
  Sparkles,
  Globe,
  Mic,
  Command
} from 'lucide-react'
import { motion } from 'framer-motion'

// Mock data for demo
const mockSearchData: SearchResult[] = [
  // Customers
  {
    id: 'cust-1',
    type: 'entity',
    category: 'customer',
    title: 'Acme Corporation',
    subtitle: 'Technology company - San Francisco',
    description: 'Premium customer since 2020',
    url: '/customers/acme-corp',
    smartCode: 'HERA.CRM.CUST.ENT.PROF.v1',
    metadata: { isPopular: true }
  },
  {
    id: 'cust-2',
    type: 'entity',
    category: 'customer',
    title: 'John Smith',
    subtitle: 'Individual customer - New York',
    url: '/customers/john-smith',
    smartCode: 'HERA.CRM.CUST.ENT.IND.v1',
    metadata: { isRecent: true }
  },
  {
    id: 'cust-3',
    type: 'entity',
    category: 'customer',
    title: 'Global Enterprises LLC',
    subtitle: 'Manufacturing - Dubai',
    url: '/customers/global-enterprises',
    smartCode: 'HERA.CRM.CUST.ENT.CORP.v1'
  },
  
  // Products
  {
    id: 'prod-1',
    type: 'entity',
    category: 'product',
    title: 'Premium Shampoo',
    subtitle: 'Hair care product - 250ml',
    url: '/products/premium-shampoo',
    smartCode: 'HERA.INV.PROD.ENT.SALON.v1'
  },
  {
    id: 'prod-2',
    type: 'entity',
    category: 'product',
    title: 'Facial Treatment Kit',
    subtitle: 'Skincare bundle - 5 items',
    url: '/products/facial-kit',
    smartCode: 'HERA.INV.PROD.ENT.SPA.v1',
    metadata: { isPopular: true }
  },
  
  // Transactions
  {
    id: 'txn-1',
    type: 'transaction',
    category: 'sale',
    title: 'Invoice #INV-2024-001',
    subtitle: '$1,250.00 - Acme Corporation',
    url: '/transactions/inv-2024-001',
    smartCode: 'HERA.FIN.SALE.TXN.INV.v1',
    metadata: { isRecent: true }
  },
  {
    id: 'txn-2',
    type: 'transaction',
    category: 'payment',
    title: 'Payment #PAY-2024-050',
    subtitle: '$500.00 - John Smith',
    url: '/transactions/pay-2024-050',
    smartCode: 'HERA.FIN.PAY.TXN.RCP.v1'
  },
  {
    id: 'txn-3',
    type: 'transaction',
    category: 'appointment',
    title: 'Booking #APT-2024-123',
    subtitle: 'Hair Color - Tomorrow 2:00 PM',
    url: '/appointments/apt-2024-123',
    smartCode: 'HERA.SALON.APPT.TXN.BOOK.v1'
  },
  
  // Reports
  {
    id: 'rpt-1',
    type: 'report',
    category: 'report',
    title: 'Daily Sales Report',
    subtitle: 'View today\'s sales performance',
    url: '/reports/daily-sales',
    smartCode: 'HERA.RPT.SALES.DAILY.v1',
    metadata: { isPopular: true }
  },
  {
    id: 'rpt-2',
    type: 'report',
    category: 'report',
    title: 'Customer Aging Report',
    subtitle: 'Outstanding receivables by age',
    url: '/reports/customer-aging',
    smartCode: 'HERA.RPT.AR.AGING.v1'
  },
  {
    id: 'rpt-3',
    type: 'report',
    category: 'report',
    title: 'Inventory Valuation',
    subtitle: 'Current stock value by category',
    url: '/reports/inventory-valuation',
    smartCode: 'HERA.RPT.INV.VAL.v1'
  },
  
  // Actions
  {
    id: 'act-1',
    type: 'action',
    category: 'action',
    title: 'Create New Invoice',
    subtitle: 'Quick action to create invoice',
    action: () => console.log('Create invoice'),
    smartCode: 'HERA.ACTION.CREATE.INV.v1'
  },
  {
    id: 'act-2',
    type: 'action',
    category: 'action',
    title: 'Book Appointment',
    subtitle: 'Schedule a new appointment',
    action: () => console.log('Book appointment'),
    smartCode: 'HERA.ACTION.BOOK.APPT.v1'
  },
  
  // Help
  {
    id: 'help-1',
    type: 'help',
    category: 'help',
    title: 'How to create a customer',
    subtitle: 'Step-by-step guide',
    url: '/help/create-customer',
    smartCode: 'HERA.HELP.GUIDE.CUST.v1'
  },
  {
    id: 'help-2',
    type: 'help',
    category: 'help',
    title: 'Keyboard shortcuts',
    subtitle: 'List of all shortcuts',
    url: '/help/shortcuts',
    smartCode: 'HERA.HELP.SHORTCUTS.v1'
  }
]

export default function UniversalSearchDemoPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [config, setConfig] = useState({
    aiSuggestions: true,
    recentSearches: true,
    popularSearches: true,
    voiceSearch: true,
    commandPalette: true,
    theme: 'command' as const,
    position: 'center' as const
  })
  
  const { toast } = useToast()
  
  const handleSelect = (result: SearchResult) => {
    setSelectedResult(result)
    
    toast({
      title: 'Item Selected',
      description: `${result.title} - ${result.type}`,
      variant: 'default'
    })
    
    console.log('Selected:', result)
  }
  
  const handleSearch = (query: string) => {
    if (query && !searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev].slice(0, 5))
    }
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
            Universal Search Demo
          </h1>
        </motion.div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          AI-powered global search with command palette interface. Search across all entities,
          transactions, reports, and actions with intelligent suggestions.
        </p>
      </div>
      
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="ai-suggestions" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Suggestions
              </Label>
              <Switch
                id="ai-suggestions"
                checked={config.aiSuggestions}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, aiSuggestions: checked }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recent-searches" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Searches
              </Label>
              <Switch
                id="recent-searches"
                checked={config.recentSearches}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, recentSearches: checked }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="voice-search" className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Voice Search
              </Label>
              <Switch
                id="voice-search"
                checked={config.voiceSearch}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, voiceSearch: checked }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="command-palette" className="flex items-center gap-2">
                <Command className="w-4 h-4" />
                Command Palette (⌘K)
              </Label>
              <Switch
                id="command-palette"
                checked={config.commandPalette}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, commandPalette: checked }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>Theme</Label>
              <select
                value={config.theme}
                onChange={(e) => 
                  setConfig(prev => ({ ...prev, theme: e.target.value as any }))
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="default">Default</option>
                <option value="minimal">Minimal</option>
                <option value="command">Command</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Position</Label>
              <select
                value={config.position}
                onChange={(e) => 
                  setConfig(prev => ({ ...prev, position: e.target.value as any }))
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="center">Center</option>
                <option value="top">Top</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Search Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Search Component */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Try Universal Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UniversalSearch
                placeholder="Search customers, transactions, reports... (⌘K)"
                staticResults={mockSearchData}
                onSelect={handleSelect}
                onSearch={handleSearch}
                {...config}
                className="w-full"
              />
              
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Try searching for:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['customer', 'invoice', 'report', 'appointment', 'payment'].map(term => (
                    <Badge
                      key={term}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => {
                        // In real implementation, this would trigger search
                        toast({
                          title: 'Search Tip',
                          description: `Try typing "${term}" in the search box`
                        })
                      }}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Search History */}
          {searchHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Search History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchHistory.map((query, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Clock className="w-3 h-3" />
                      {query}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Results Display */}
        <div>
          <Tabs defaultValue="result" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="result">Selected Result</TabsTrigger>
              <TabsTrigger value="code">Implementation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="result" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Selection Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Item Selected</span>
                      </div>
                      
                      <div className="space-y-3 p-4 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Title</p>
                          <p className="font-medium">{selectedResult.title}</p>
                        </div>
                        
                        {selectedResult.subtitle && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Subtitle</p>
                            <p>{selectedResult.subtitle}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{selectedResult.type}</Badge>
                          <Badge variant="outline">{selectedResult.category}</Badge>
                          {selectedResult.smartCode && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {selectedResult.smartCode}
                            </Badge>
                          )}
                        </div>
                        
                        {selectedResult.url && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">URL</p>
                            <code className="text-xs bg-background p-1 rounded">
                              {selectedResult.url}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Select an item from search to see details
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="code" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Implementation Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs">
{`import { UniversalSearch } from '@/src/lib/dna/components/search'

// Basic usage
<UniversalSearch
  placeholder="Search anything..."
  onSelect={(result) => {
    if (result.url) {
      router.push(result.url)
    } else if (result.action) {
      result.action()
    }
  }}
/>

// With configuration
<UniversalSearch
  placeholder="Search customers, orders..."
  staticResults={searchData}
  aiSuggestions={true}
  voiceSearch={true}
  commandPalette={true}
  theme="command"
  scopes={[
    { id: 'entities', label: 'Entities', enabled: true },
    { id: 'transactions', label: 'Transactions', enabled: true }
  ]}
  onSelect={handleSelect}
  onSearch={handleSearch}
/>

// Search result structure
interface SearchResult {
  id: string
  type: 'entity' | 'transaction' | 'report' | 'action' | 'help'
  category: string
  title: string
  subtitle?: string
  description?: string
  url?: string
  action?: () => void
  smartCode?: string
  metadata?: Record<string, any>
}`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI-Powered Intelligence
              </h4>
              <p className="text-sm text-muted-foreground">
                Smart suggestions and query understanding for better search results
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Command className="w-4 h-4" />
                Command Palette
              </h4>
              <p className="text-sm text-muted-foreground">
                Quick access with ⌘K shortcut from anywhere in the application
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Universal Coverage
              </h4>
              <p className="text-sm text-muted-foreground">
                Search across all data types with smart code integration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Add missing import
import { Clock } from 'lucide-react'