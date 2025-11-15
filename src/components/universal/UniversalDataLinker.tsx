'use client'

/**
 * Universal Data Linker Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.DATA_LINKER.v1
 * 
 * Cross-system data linking and reference management:
 * - Entity-Transaction-Relationship-Workflow linking
 * - Smart reference detection and suggestions
 * - Visual link representation and navigation
 * - Bulk linking operations
 * - Link validation and integrity checking
 * - Mobile-first responsive design
 * - Real-time link updates
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { 
  Link2,
  Unlink,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Eye,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  ArrowRightLeft,
  GitBranch,
  Database,
  FileText,
  Activity,
  Users,
  Building,
  Package,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Zap,
  RefreshCw,
  Download,
  Upload,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export interface UniversalDataItem {
  id: string
  system: 'entities' | 'transactions' | 'relationships' | 'workflows'
  type: string
  title: string
  subtitle?: string
  description?: string
  icon?: React.ComponentType<any>
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface DataLink {
  id: string
  from_item: UniversalDataItem
  to_item: UniversalDataItem
  link_type: string
  direction: 'bidirectional' | 'unidirectional'
  strength: number // 1-10 scale
  description?: string
  auto_generated: boolean
  validation_status: 'valid' | 'warning' | 'error'
  validation_message?: string
  created_at: string
  created_by: string
  metadata?: Record<string, any>
}

export interface LinkType {
  id: string
  name: string
  description: string
  direction: 'bidirectional' | 'unidirectional'
  allowed_systems: string[]
  icon: React.ComponentType<any>
  color: string
  auto_detectable: boolean
  validation_rules?: Array<{
    rule: string
    message: string
    severity: 'error' | 'warning'
  }>
}

export interface LinkSuggestion {
  id: string
  from_item: UniversalDataItem
  to_item: UniversalDataItem
  suggested_type: string
  confidence: number
  reason: string
  auto_apply: boolean
  metadata?: Record<string, any>
}

interface UniversalDataLinkerProps {
  // Data
  dataItems: UniversalDataItem[]
  existingLinks: DataLink[]
  linkTypes: LinkType[]
  
  // Callbacks
  onCreateLink?: (link: Omit<DataLink, 'id' | 'created_at'>) => Promise<void>
  onUpdateLink?: (linkId: string, updates: Partial<DataLink>) => Promise<void>
  onDeleteLink?: (linkId: string) => Promise<void>
  onBulkOperation?: (operation: string, linkIds: string[]) => Promise<void>
  
  // Configuration
  enableAutoSuggestions?: boolean
  showValidation?: boolean
  allowBulkOperations?: boolean
  defaultSystem?: string
  readonly?: boolean
  className?: string
}

// Default link types
const defaultLinkTypes: LinkType[] = [
  {
    id: 'contains',
    name: 'Contains',
    description: 'One item contains or includes another',
    direction: 'unidirectional',
    allowed_systems: ['entities', 'transactions', 'workflows'],
    icon: Package,
    color: 'text-blue-600 bg-blue-50',
    auto_detectable: true,
    validation_rules: [
      { rule: 'no_self_reference', message: 'Item cannot contain itself', severity: 'error' },
      { rule: 'no_circular_dependency', message: 'Circular containment detected', severity: 'error' }
    ]
  },
  {
    id: 'references',
    name: 'References',
    description: 'One item references or mentions another',
    direction: 'unidirectional',
    allowed_systems: ['entities', 'transactions', 'relationships', 'workflows'],
    icon: ArrowRight,
    color: 'text-green-600 bg-green-50',
    auto_detectable: true
  },
  {
    id: 'depends_on',
    name: 'Depends On',
    description: 'One item depends on another for functionality',
    direction: 'unidirectional',
    allowed_systems: ['workflows', 'transactions'],
    icon: GitBranch,
    color: 'text-purple-600 bg-purple-50',
    auto_detectable: false,
    validation_rules: [
      { rule: 'no_dependency_loop', message: 'Dependency loop detected', severity: 'error' }
    ]
  },
  {
    id: 'related_to',
    name: 'Related To',
    description: 'Items are generally related or associated',
    direction: 'bidirectional',
    allowed_systems: ['entities', 'transactions', 'relationships', 'workflows'],
    icon: Link2,
    color: 'text-orange-600 bg-orange-50',
    auto_detectable: true
  },
  {
    id: 'triggers',
    name: 'Triggers',
    description: 'One item triggers or initiates another',
    direction: 'unidirectional',
    allowed_systems: ['entities', 'transactions', 'workflows'],
    icon: Zap,
    color: 'text-yellow-600 bg-yellow-50',
    auto_detectable: false
  }
]

export function UniversalDataLinker({
  dataItems,
  existingLinks,
  linkTypes = defaultLinkTypes,
  onCreateLink,
  onUpdateLink,
  onDeleteLink,
  onBulkOperation,
  enableAutoSuggestions = true,
  showValidation = true,
  allowBulkOperations = true,
  defaultSystem = 'all',
  readonly = false,
  className = ''
}: UniversalDataLinkerProps) {
  const [activeTab, setActiveTab] = useState('links')
  const [searchQuery, setSearchQuery] = useState('')
  const [systemFilter, setSystemFilter] = useState(defaultSystem)
  const [linkTypeFilter, setLinkTypeFilter] = useState('all')
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set())
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingLink, setEditingLink] = useState<DataLink | null>(null)
  const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Generate smart link suggestions
  const generateSuggestions = useCallback(async () => {
    if (!enableAutoSuggestions) return

    setIsAnalyzing(true)
    
    // Mock suggestion generation logic
    const suggestions: LinkSuggestion[] = []

    // Find entities referenced in transaction descriptions
    dataItems.filter(item => item.system === 'transactions').forEach(transaction => {
      dataItems.filter(item => item.system === 'entities').forEach(entity => {
        if (transaction.description?.toLowerCase().includes(entity.title.toLowerCase())) {
          const existingLink = existingLinks.find(link => 
            (link.from_item.id === transaction.id && link.to_item.id === entity.id) ||
            (link.from_item.id === entity.id && link.to_item.id === transaction.id)
          )
          
          if (!existingLink) {
            suggestions.push({
              id: `suggestion_${suggestions.length}`,
              from_item: transaction,
              to_item: entity,
              suggested_type: 'references',
              confidence: 85,
              reason: `Transaction "${transaction.title}" mentions entity "${entity.title}" in description`,
              auto_apply: false
            })
          }
        }
      })
    })

    // Find workflow-transaction connections
    dataItems.filter(item => item.system === 'workflows').forEach(workflow => {
      dataItems.filter(item => item.system === 'transactions' && item.type === 'approval').forEach(transaction => {
        const existingLink = existingLinks.find(link => 
          (link.from_item.id === workflow.id && link.to_item.id === transaction.id) ||
          (link.from_item.id === transaction.id && link.to_item.id === workflow.id)
        )
        
        if (!existingLink) {
          suggestions.push({
            id: `suggestion_${suggestions.length}`,
            from_item: workflow,
            to_item: transaction,
            suggested_type: 'triggers',
            confidence: 70,
            reason: 'Workflow may trigger transaction approval process',
            auto_apply: false
          })
        }
      })
    })

    setTimeout(() => {
      setLinkSuggestions(suggestions)
      setIsAnalyzing(false)
    }, 1000) // Simulate processing time
  }, [dataItems, existingLinks, enableAutoSuggestions])

  // Filter data items
  const filteredItems = useMemo(() => {
    let filtered = dataItems

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      )
    }

    if (systemFilter !== 'all') {
      filtered = filtered.filter(item => item.system === systemFilter)
    }

    return filtered
  }, [dataItems, searchQuery, systemFilter])

  // Filter links
  const filteredLinks = useMemo(() => {
    let filtered = existingLinks

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(link =>
        link.from_item.title.toLowerCase().includes(query) ||
        link.to_item.title.toLowerCase().includes(query) ||
        link.description?.toLowerCase().includes(query)
      )
    }

    if (linkTypeFilter !== 'all') {
      filtered = filtered.filter(link => link.link_type === linkTypeFilter)
    }

    if (systemFilter !== 'all') {
      filtered = filtered.filter(link =>
        link.from_item.system === systemFilter || link.to_item.system === systemFilter
      )
    }

    return filtered
  }, [existingLinks, searchQuery, linkTypeFilter, systemFilter])

  // Get system statistics
  const systemStats = useMemo(() => {
    const stats = {
      entities: dataItems.filter(item => item.system === 'entities').length,
      transactions: dataItems.filter(item => item.system === 'transactions').length,
      relationships: dataItems.filter(item => item.system === 'relationships').length,
      workflows: dataItems.filter(item => item.system === 'workflows').length,
      total_items: dataItems.length,
      total_links: existingLinks.length,
      suggestions: linkSuggestions.length
    }

    return stats
  }, [dataItems, existingLinks, linkSuggestions])

  // Validate link
  const validateLink = useCallback((fromItem: UniversalDataItem, toItem: UniversalDataItem, linkType: LinkType): { valid: boolean; message?: string } => {
    // Self-reference check
    if (fromItem.id === toItem.id) {
      return { valid: false, message: 'Cannot link item to itself' }
    }

    // System compatibility check
    if (!linkType.allowed_systems.includes(fromItem.system) || !linkType.allowed_systems.includes(toItem.system)) {
      return { valid: false, message: `Link type "${linkType.name}" not allowed between ${fromItem.system} and ${toItem.system}` }
    }

    // Check for existing link
    const existingLink = existingLinks.find(link =>
      (link.from_item.id === fromItem.id && link.to_item.id === toItem.id) ||
      (link.from_item.id === toItem.id && link.to_item.id === fromItem.id)
    )

    if (existingLink) {
      return { valid: false, message: 'Link already exists between these items' }
    }

    // Custom validation rules
    if (linkType.validation_rules) {
      for (const rule of linkType.validation_rules) {
        if (rule.rule === 'no_circular_dependency') {
          // Simple circular dependency check - would be more complex in real implementation
          const hasCircular = existingLinks.some(link =>
            link.from_item.id === toItem.id && link.to_item.id === fromItem.id
          )
          if (hasCircular) {
            return { valid: false, message: rule.message }
          }
        }
      }
    }

    return { valid: true }
  }, [existingLinks])

  // Handle link creation
  const handleCreateLink = useCallback(async (fromItem: UniversalDataItem, toItem: UniversalDataItem, linkType: LinkType, description?: string) => {
    if (!onCreateLink) return

    const validation = validateLink(fromItem, toItem, linkType)
    if (!validation.valid) {
      alert(validation.message)
      return
    }

    const newLink: Omit<DataLink, 'id' | 'created_at'> = {
      from_item: fromItem,
      to_item: toItem,
      link_type: linkType.id,
      direction: linkType.direction,
      strength: 5, // Default medium strength
      description,
      auto_generated: false,
      validation_status: 'valid',
      created_by: 'current_user' // Would be actual user ID
    }

    try {
      await onCreateLink(newLink)
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to create link:', error)
    }
  }, [onCreateLink, validateLink])

  // Handle suggestion acceptance
  const handleAcceptSuggestion = useCallback(async (suggestion: LinkSuggestion) => {
    const linkType = linkTypes.find(lt => lt.id === suggestion.suggested_type)
    if (!linkType) return

    await handleCreateLink(
      suggestion.from_item,
      suggestion.to_item,
      linkType,
      suggestion.reason
    )

    // Remove accepted suggestion
    setLinkSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
  }, [linkTypes, handleCreateLink])

  // Toggle link selection
  const toggleLinkSelection = useCallback((linkId: string) => {
    setSelectedLinks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(linkId)) {
        newSet.delete(linkId)
      } else {
        newSet.add(linkId)
      }
      return newSet
    })
  }, [])

  // Get system icon
  const getSystemIcon = useCallback((system: string) => {
    switch (system) {
      case 'entities': return Database
      case 'transactions': return FileText
      case 'relationships': return GitBranch
      case 'workflows': return Activity
      default: return Database
    }
  }, [])

  // Get system color
  const getSystemColor = useCallback((system: string) => {
    switch (system) {
      case 'entities': return 'text-blue-600 bg-blue-50'
      case 'transactions': return 'text-green-600 bg-green-50'
      case 'relationships': return 'text-purple-600 bg-purple-50'
      case 'workflows': return 'text-orange-600 bg-orange-50'
      default: return 'text-slate-600 bg-slate-50'
    }
  }, [])

  // Auto-generate suggestions on component mount
  useEffect(() => {
    generateSuggestions()
  }, [generateSuggestions])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Stats */}
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Link2 size={24} className="text-blue-600" />
              Universal Data Linker
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {enableAutoSuggestions && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSuggestions}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <RefreshCw size={14} className="mr-1 animate-spin" />
                  ) : (
                    <Sparkles size={14} className="mr-1" />
                  )}
                  Analyze
                </Button>
              )}
              
              {!readonly && (
                <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                  <Plus size={14} className="mr-1" />
                  Create Link
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{systemStats.entities}</div>
              <div className="text-xs text-slate-600">Entities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{systemStats.transactions}</div>
              <div className="text-xs text-slate-600">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{systemStats.relationships}</div>
              <div className="text-xs text-slate-600">Relationships</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{systemStats.workflows}</div>
              <div className="text-xs text-slate-600">Workflows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{systemStats.total_links}</div>
              <div className="text-xs text-slate-600">Total Links</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{systemStats.suggestions}</div>
              <div className="text-xs text-slate-600">Suggestions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-600">
                {systemStats.total_links > 0 ? Math.round((systemStats.total_links / systemStats.total_items) * 100) : 0}%
              </div>
              <div className="text-xs text-slate-600">Connected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search items and links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={systemFilter} onValueChange={setSystemFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Systems" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Systems</SelectItem>
                <SelectItem value="entities">Entities</SelectItem>
                <SelectItem value="transactions">Transactions</SelectItem>
                <SelectItem value="relationships">Relationships</SelectItem>
                <SelectItem value="workflows">Workflows</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={linkTypeFilter} onValueChange={setLinkTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Link Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Link Types</SelectItem>
                {linkTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link2 size={16} />
            Links ({filteredLinks.length})
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Sparkles size={16} />
            Suggestions ({linkSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Database size={16} />
            Items ({filteredItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-4">
          {/* Bulk Actions */}
          {allowBulkOperations && selectedLinks.size > 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-yellow-800">
                    <span className="font-medium">{selectedLinks.size} link(s) selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLinks(new Set())}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onBulkOperation?.('validate', Array.from(selectedLinks))}
                    >
                      <CheckCircle size={14} className="mr-1" />
                      Validate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onBulkOperation?.('delete', Array.from(selectedLinks))}
                      className="text-red-600"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Links List */}
          <div className="space-y-3">
            {filteredLinks.map((link) => {
              const linkType = linkTypes.find(lt => lt.id === link.link_type)
              const FromSystemIcon = getSystemIcon(link.from_item.system)
              const ToSystemIcon = getSystemIcon(link.to_item.system)
              const LinkTypeIcon = linkType?.icon || Link2
              const isSelected = selectedLinks.has(link.id)

              return (
                <Card
                  key={link.id}
                  className={cn(
                    "transition-all hover:shadow-md cursor-pointer",
                    isSelected && "ring-2 ring-blue-500 bg-blue-50",
                    link.validation_status === 'error' && "border-red-200 bg-red-50",
                    link.validation_status === 'warning' && "border-yellow-200 bg-yellow-50"
                  )}
                  onClick={() => toggleLinkSelection(link.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Selection Checkbox */}
                      {allowBulkOperations && (
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleLinkSelection(link.id)}
                        />
                      )}

                      {/* Link Visualization */}
                      <div className="flex items-center gap-3 flex-1">
                        {/* From Item */}
                        <div className="flex items-center gap-2">
                          <div className={cn("p-2 rounded-lg", getSystemColor(link.from_item.system))}>
                            <FromSystemIcon size={16} />
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{link.from_item.title}</div>
                            <div className="text-slate-500">{link.from_item.system}</div>
                          </div>
                        </div>

                        {/* Link Type */}
                        <div className="flex items-center gap-2">
                          {link.direction === 'bidirectional' ? (
                            <ArrowRightLeft className="text-slate-400" size={16} />
                          ) : (
                            <ArrowRight className="text-slate-400" size={16} />
                          )}
                          <div className="text-center">
                            <div className={cn("p-1 rounded", linkType?.color || 'text-slate-600 bg-slate-50')}>
                              <LinkTypeIcon size={12} />
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{linkType?.name}</div>
                          </div>
                        </div>

                        {/* To Item */}
                        <div className="flex items-center gap-2">
                          <div className={cn("p-2 rounded-lg", getSystemColor(link.to_item.system))}>
                            <ToSystemIcon size={16} />
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{link.to_item.title}</div>
                            <div className="text-slate-500">{link.to_item.system}</div>
                          </div>
                        </div>
                      </div>

                      {/* Link Details */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Badge variant="outline" className="text-xs">
                            Strength: {link.strength}/10
                          </Badge>
                          {link.auto_generated && (
                            <Badge variant="secondary" className="text-xs">
                              Auto
                            </Badge>
                          )}
                          {link.validation_status === 'error' && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle size={10} className="mr-1" />
                              Error
                            </Badge>
                          )}
                          {link.validation_status === 'warning' && (
                            <Badge variant="outline" className="text-xs text-yellow-600">
                              <AlertTriangle size={10} className="mr-1" />
                              Warning
                            </Badge>
                          )}
                        </div>
                        
                        {link.description && (
                          <div className="text-xs text-slate-500 mt-1 max-w-48 truncate">
                            {link.description}
                          </div>
                        )}
                        
                        <div className="text-xs text-slate-400 mt-1">
                          {new Date(link.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Actions */}
                      {!readonly && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingLink(link)
                            }}
                          >
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteLink?.(link.id)
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Validation Message */}
                    {showValidation && link.validation_message && (
                      <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                        <Info size={12} className="inline mr-1" />
                        {link.validation_message}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {filteredLinks.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Link2 className="mx-auto mb-4 text-slate-300" size={48} />
                <h3 className="font-medium text-lg mb-2">No Links Found</h3>
                <p className="text-sm">
                  {searchQuery || systemFilter !== 'all' || linkTypeFilter !== 'all'
                    ? 'Try adjusting your filters or search query'
                    : 'Create your first link to connect data across systems'
                  }
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          {isAnalyzing && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <RefreshCw className="animate-spin text-blue-600" size={20} />
                  <div>
                    <div className="font-medium text-blue-800">Analyzing Data Relationships</div>
                    <div className="text-sm text-blue-600">Finding potential links between your data...</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {linkSuggestions.map((suggestion) => {
              const linkType = linkTypes.find(lt => lt.id === suggestion.suggested_type)
              const FromSystemIcon = getSystemIcon(suggestion.from_item.system)
              const ToSystemIcon = getSystemIcon(suggestion.to_item.system)

              return (
                <Card key={suggestion.id} className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* From Item */}
                        <div className="flex items-center gap-2">
                          <div className={cn("p-2 rounded-lg", getSystemColor(suggestion.from_item.system))}>
                            <FromSystemIcon size={16} />
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{suggestion.from_item.title}</div>
                            <div className="text-slate-500">{suggestion.from_item.system}</div>
                          </div>
                        </div>

                        <ArrowRight className="text-yellow-600" size={16} />

                        {/* To Item */}
                        <div className="flex items-center gap-2">
                          <div className={cn("p-2 rounded-lg", getSystemColor(suggestion.to_item.system))}>
                            <ToSystemIcon size={16} />
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{suggestion.to_item.title}</div>
                            <div className="text-slate-500">{suggestion.to_item.system}</div>
                          </div>
                        </div>

                        <div className="flex-1">
                          <Badge variant="outline" className="text-xs">
                            {linkType?.name}
                          </Badge>
                          <div className="text-xs text-slate-600 mt-1">{suggestion.reason}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Progress value={suggestion.confidence} className="w-16 h-1" />
                            <span className="text-xs text-slate-500">{suggestion.confidence}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLinkSuggestions(prev => prev.filter(s => s.id !== suggestion.id))}
                        >
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptSuggestion(suggestion)}
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {linkSuggestions.length === 0 && !isAnalyzing && (
              <div className="text-center py-12 text-slate-500">
                <Sparkles className="mx-auto mb-4 text-slate-300" size={48} />
                <h3 className="font-medium text-lg mb-2">No Suggestions Available</h3>
                <p className="text-sm">
                  Click "Analyze" to find potential data relationships
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const SystemIcon = getSystemIcon(item.system)
              const ItemIcon = item.icon || SystemIcon

              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("p-2 rounded-lg", getSystemColor(item.system))}>
                        <ItemIcon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-sm text-slate-500">{item.subtitle || item.type}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.system}
                      </Badge>
                    </div>

                    {item.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
                      <Button variant="ghost" size="sm">
                        <ExternalLink size={12} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Database className="mx-auto mb-4 text-slate-300" size={48} />
              <h3 className="font-medium text-lg mb-2">No Items Found</h3>
              <p className="text-sm">
                Adjust your search or filters to find items
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Link Dialog */}
      {showCreateDialog && (
        <CreateLinkDialog
          dataItems={dataItems}
          linkTypes={linkTypes}
          onCreateLink={handleCreateLink}
          onCancel={() => setShowCreateDialog(false)}
          validateLink={validateLink}
        />
      )}

      {/* Edit Link Dialog */}
      {editingLink && (
        <EditLinkDialog
          link={editingLink}
          linkTypes={linkTypes}
          onUpdateLink={onUpdateLink}
          onCancel={() => setEditingLink(null)}
        />
      )}
    </div>
  )
}

// Create Link Dialog Component
interface CreateLinkDialogProps {
  dataItems: UniversalDataItem[]
  linkTypes: LinkType[]
  onCreateLink: (fromItem: UniversalDataItem, toItem: UniversalDataItem, linkType: LinkType, description?: string) => Promise<void>
  onCancel: () => void
  validateLink: (fromItem: UniversalDataItem, toItem: UniversalDataItem, linkType: LinkType) => { valid: boolean; message?: string }
}

function CreateLinkDialog({ dataItems, linkTypes, onCreateLink, onCancel, validateLink }: CreateLinkDialogProps) {
  const [selectedFromItem, setSelectedFromItem] = useState<UniversalDataItem | null>(null)
  const [selectedToItem, setSelectedToItem] = useState<UniversalDataItem | null>(null)
  const [selectedLinkType, setSelectedLinkType] = useState<LinkType | null>(null)
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const validationResult = useMemo(() => {
    if (!selectedFromItem || !selectedToItem || !selectedLinkType) {
      return { valid: false }
    }
    return validateLink(selectedFromItem, selectedToItem, selectedLinkType)
  }, [selectedFromItem, selectedToItem, selectedLinkType, validateLink])

  const handleSubmit = async () => {
    if (!selectedFromItem || !selectedToItem || !selectedLinkType || !validationResult.valid) return

    setIsCreating(true)
    try {
      await onCreateLink(selectedFromItem, selectedToItem, selectedLinkType, description || undefined)
    } catch (error) {
      console.error('Failed to create link:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Data Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* From Item Selection */}
          <div>
            <Label>From Item</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start mt-1">
                  {selectedFromItem ? selectedFromItem.title : 'Select item...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <Command>
                  <CommandInput placeholder="Search items..." />
                  <CommandList>
                    <CommandEmpty>No items found.</CommandEmpty>
                    {['entities', 'transactions', 'relationships', 'workflows'].map(system => (
                      <CommandGroup key={system} heading={system.charAt(0).toUpperCase() + system.slice(1)}>
                        {dataItems.filter(item => item.system === system).slice(0, 5).map(item => (
                          <CommandItem
                            key={item.id}
                            onSelect={() => setSelectedFromItem(item)}
                          >
                            {item.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* To Item Selection */}
          <div>
            <Label>To Item</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start mt-1">
                  {selectedToItem ? selectedToItem.title : 'Select item...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <Command>
                  <CommandInput placeholder="Search items..." />
                  <CommandList>
                    <CommandEmpty>No items found.</CommandEmpty>
                    {['entities', 'transactions', 'relationships', 'workflows'].map(system => (
                      <CommandGroup key={system} heading={system.charAt(0).toUpperCase() + system.slice(1)}>
                        {dataItems.filter(item => item.system === system && item.id !== selectedFromItem?.id).slice(0, 5).map(item => (
                          <CommandItem
                            key={item.id}
                            onSelect={() => setSelectedToItem(item)}
                          >
                            {item.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Link Type Selection */}
          <div>
            <Label>Link Type</Label>
            <Select onValueChange={(value) => setSelectedLinkType(linkTypes.find(lt => lt.id === value) || null)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select link type..." />
              </SelectTrigger>
              <SelectContent>
                {linkTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <type.icon size={16} />
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label>Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this relationship..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Validation Message */}
          {selectedFromItem && selectedToItem && selectedLinkType && !validationResult.valid && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {validationResult.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!validationResult.valid || isCreating}
            >
              {isCreating ? (
                <RefreshCw size={16} className="mr-1 animate-spin" />
              ) : (
                <Link2 size={16} className="mr-1" />
              )}
              Create Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Edit Link Dialog Component
interface EditLinkDialogProps {
  link: DataLink
  linkTypes: LinkType[]
  onUpdateLink?: (linkId: string, updates: Partial<DataLink>) => Promise<void>
  onCancel: () => void
}

function EditLinkDialog({ link, linkTypes, onUpdateLink, onCancel }: EditLinkDialogProps) {
  const [description, setDescription] = useState(link.description || '')
  const [strength, setStrength] = useState(link.strength)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSubmit = async () => {
    if (!onUpdateLink) return

    setIsUpdating(true)
    try {
      await onUpdateLink(link.id, {
        description: description || undefined,
        strength
      })
      onCancel()
    } catch (error) {
      console.error('Failed to update link:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const linkType = linkTypes.find(lt => lt.id === link.link_type)

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Data Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Link Overview */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{link.from_item.title}</div>
                <div className="text-sm text-slate-500">{link.from_item.system}</div>
              </div>
              <div className="text-center">
                <Badge variant="outline">{linkType?.name}</Badge>
              </div>
              <div>
                <div className="font-medium">{link.to_item.title}</div>
                <div className="text-sm text-slate-500">{link.to_item.system}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this relationship..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Strength */}
          <div>
            <Label>Relationship Strength: {strength}/10</Label>
            <input
              type="range"
              min="1"
              max="10"
              value={strength}
              onChange={(e) => setStrength(parseInt(e.target.value))}
              className="w-full mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isUpdating}>
              {isUpdating ? (
                <RefreshCw size={16} className="mr-1 animate-spin" />
              ) : (
                <CheckCircle size={16} className="mr-1" />
              )}
              Update Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UniversalDataLinker