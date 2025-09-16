'use client'

// ================================================================================
// HERA DNA SMART CODE PICKER
// Smart Code: HERA.UI.SMARTCODE.PICKER.v1
// Intelligent business classification code selector with hierarchical navigation
// ================================================================================

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import {
  Code,
  Search,
  Check,
  Info,
  Globe,
  Building2,
  Package,
  CreditCard,
  FileText,
  Users,
  Heart,
  ShoppingCart,
  Scissors,
  UtensilsCrossed,
  Factory,
  Briefcase,
  Activity,
  DollarSign,
  TrendingUp,
  Database,
  Settings,
  X,
  Clock,
  Star
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { useToast } from '@/src/hooks/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip'

// ================================================================================
// TYPES AND INTERFACES
// ================================================================================

export interface SmartCode {
  code: string
  name: string
  description: string
  category: SmartCodeCategory
  industry?: string
  module?: string
  version: number
  deprecated?: boolean
  metadata?: Record<string, any>
}

export interface SmartCodeCategory {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  color: string
}

export interface SmartCodePickerProps {
  // Core props
  value?: string
  onChange: (code: string, smartCode: SmartCode) => void
  
  // Filtering
  industry?: string
  module?: string
  entityType?: string
  
  // Features
  allowCustom?: boolean
  showDescription?: boolean
  showRecent?: boolean
  showPopular?: boolean
  showSearch?: boolean
  
  // UI customization
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
  
  // Dialog mode
  mode?: 'inline' | 'dialog'
  dialogTitle?: string
}

// ================================================================================
// SMART CODE DATA
// ================================================================================

const categories: SmartCodeCategory[] = [
  { id: 'entity', name: 'Entities', icon: Database, description: 'Business objects', color: 'blue' },
  { id: 'transaction', name: 'Transactions', icon: CreditCard, description: 'Business transactions', color: 'green' },
  { id: 'finance', name: 'Finance', icon: DollarSign, description: 'Financial operations', color: 'emerald' },
  { id: 'crm', name: 'CRM', icon: Users, description: 'Customer relations', color: 'purple' },
  { id: 'inventory', name: 'Inventory', icon: Package, description: 'Stock management', color: 'orange' },
  { id: 'hr', name: 'HR', icon: Heart, description: 'Human resources', color: 'pink' },
  { id: 'report', name: 'Reports', icon: FileText, description: 'Analytics & reports', color: 'cyan' },
  { id: 'workflow', name: 'Workflow', icon: Activity, description: 'Business processes', color: 'violet' },
  { id: 'system', name: 'System', icon: Settings, description: 'System operations', color: 'slate' }
]

const industries = [
  { id: 'universal', name: 'Universal', icon: Globe },
  { id: 'restaurant', name: 'Restaurant', icon: UtensilsCrossed },
  { id: 'salon', name: 'Salon & Spa', icon: Scissors },
  { id: 'healthcare', name: 'Healthcare', icon: Heart },
  { id: 'retail', name: 'Retail', icon: ShoppingCart },
  { id: 'manufacturing', name: 'Manufacturing', icon: Factory },
  { id: 'professional', name: 'Professional Services', icon: Briefcase }
]

// Mock smart codes - in production, fetch from API or smart code registry
const smartCodes: SmartCode[] = [
  // Entity codes
  {
    code: 'HERA.CRM.CUST.ENT.PROF.v1',
    name: 'Customer Profile Entity',
    description: 'Professional customer profile with full details',
    category: categories[0],
    industry: 'universal',
    module: 'crm',
    version: 1
  },
  {
    code: 'HERA.CRM.VEND.ENT.PROF.v1',
    name: 'Vendor Profile Entity',
    description: 'Vendor/supplier profile with payment terms',
    category: categories[0],
    industry: 'universal',
    module: 'crm',
    version: 1
  },
  {
    code: 'HERA.INV.PROD.ENT.STD.v1',
    name: 'Product Entity',
    description: 'Standard product with inventory tracking',
    category: categories[0],
    industry: 'universal',
    module: 'inventory',
    version: 1
  },
  
  // Transaction codes
  {
    code: 'HERA.FIN.SALE.TXN.INV.v1',
    name: 'Sales Invoice Transaction',
    description: 'Customer sales invoice with line items',
    category: categories[1],
    industry: 'universal',
    module: 'finance',
    version: 1
  },
  {
    code: 'HERA.FIN.PUR.TXN.PO.v1',
    name: 'Purchase Order Transaction',
    description: 'Purchase order to vendor',
    category: categories[1],
    industry: 'universal',
    module: 'finance',
    version: 1
  },
  {
    code: 'HERA.FIN.PAY.TXN.RCP.v1',
    name: 'Payment Receipt Transaction',
    description: 'Customer payment receipt',
    category: categories[1],
    industry: 'universal',
    module: 'finance',
    version: 1
  },
  
  // Restaurant specific
  {
    code: 'HERA.REST.SALE.TXN.ORDER.v1',
    name: 'Restaurant Order',
    description: 'Dine-in or takeout order',
    category: categories[1],
    industry: 'restaurant',
    module: 'sales',
    version: 1
  },
  {
    code: 'HERA.REST.INV.ENT.INGR.v1',
    name: 'Food Ingredient',
    description: 'Restaurant ingredient with units',
    category: categories[0],
    industry: 'restaurant',
    module: 'inventory',
    version: 1
  },
  
  // Salon specific
  {
    code: 'HERA.SALON.SVC.TXN.APPT.v1',
    name: 'Salon Appointment',
    description: 'Service appointment booking',
    category: categories[1],
    industry: 'salon',
    module: 'service',
    version: 1
  },
  {
    code: 'HERA.SALON.HR.ENT.STYL.v1',
    name: 'Stylist Profile',
    description: 'Hair stylist employee profile',
    category: categories[0],
    industry: 'salon',
    module: 'hr',
    version: 1
  }
]

// ================================================================================
// RECENT & POPULAR CODES (MOCK)
// ================================================================================

const recentCodes = smartCodes.slice(0, 3).map(code => ({
  ...code,
  metadata: { ...code.metadata, lastUsed: new Date().toISOString() }
}))

const popularCodes = smartCodes.slice(3, 6).map(code => ({
  ...code,
  metadata: { ...code.metadata, usageCount: Math.floor(Math.random() * 1000) + 100 }
}))

// ================================================================================
// UTILITIES
// ================================================================================

const getCategoryIcon = (categoryId: string) => {
  const category = categories.find(c => c.id === categoryId)
  return category?.icon || Code
}

const getIndustryIcon = (industryId: string) => {
  const industry = industries.find(i => i.id === industryId)
  return industry?.icon || Globe
}

const parseSmartCode = (code: string) => {
  const parts = code.split('.')
  return {
    system: parts[0], // HERA
    industry: parts[1], // REST, SALON, etc.
    module: parts[2], // CRM, FIN, INV, etc.
    function: parts[3], // CUST, VEND, SALE, etc.
    type: parts[4], // ENT, TXN, RPT, etc.
    variant: parts[5] // PROF, STD, etc. including version
  }
}

// ================================================================================
// MAIN COMPONENT
// ================================================================================

export function SmartCodePicker({
  value,
  onChange,
  industry: filterIndustry,
  module: filterModule,
  allowCustom = false,
  showDescription = true,
  showRecent = true,
  showPopular = true,
  showSearch = true,
  placeholder = 'Select smart code...',
  label,
  required = false,
  disabled = false,
  className,
  mode = 'dialog',
  dialogTitle = 'Select Smart Code'
}: SmartCodePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedIndustry, setSelectedIndustry] = useState<string>(filterIndustry || 'all')
  const [customCode, setCustomCode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  // Get selected smart code object
  const selectedCode = useMemo(() => {
    return smartCodes.find(code => code.code === value)
  }, [value])
  
  // Filter codes based on search and filters
  const filteredCodes = useMemo(() => {
    let codes = [...smartCodes]
    
    // Apply filters
    if (filterIndustry) {
      codes = codes.filter(code => 
        code.industry === filterIndustry || code.industry === 'universal'
      )
    }
    
    if (filterModule) {
      codes = codes.filter(code => code.module === filterModule)
    }
    
    if (selectedCategory !== 'all') {
      codes = codes.filter(code => code.category.id === selectedCategory)
    }
    
    if (selectedIndustry !== 'all') {
      codes = codes.filter(code => 
        code.industry === selectedIndustry || code.industry === 'universal'
      )
    }
    
    // Apply search
    if (search) {
      const searchLower = search.toLowerCase()
      codes = codes.filter(code => 
        code.code.toLowerCase().includes(searchLower) ||
        code.name.toLowerCase().includes(searchLower) ||
        code.description.toLowerCase().includes(searchLower)
      )
    }
    
    return codes
  }, [search, filterIndustry, filterModule, selectedCategory, selectedIndustry])
  
  // Group codes by category
  const groupedCodes = useMemo(() => {
    const groups: Record<string, SmartCode[]> = {}
    
    filteredCodes.forEach(code => {
      const categoryId = code.category.id
      if (!groups[categoryId]) {
        groups[categoryId] = []
      }
      groups[categoryId].push(code)
    })
    
    return groups
  }, [filteredCodes])
  
  // Handle code selection
  const handleSelect = useCallback((code: SmartCode) => {
    onChange(code.code, code)
    setIsOpen(false)
    
    // Copy to clipboard
    navigator.clipboard.writeText(code.code)
    toast({
      title: 'Smart Code Selected',
      description: `${code.code} copied to clipboard`,
      variant: 'default'
    })
  }, [onChange, toast])
  
  // Handle custom code
  const handleCustomCode = useCallback(() => {
    if (customCode && allowCustom) {
      const customSmartCode: SmartCode = {
        code: customCode,
        name: 'Custom Code',
        description: 'User-defined smart code',
        category: categories[8], // System category
        version: 1
      }
      
      onChange(customCode, customSmartCode)
      setIsOpen(false)
      setCustomCode('')
    }
  }, [customCode, allowCustom, onChange])
  
  // Render code item
  const renderCodeItem = (code: SmartCode) => {
    const Icon = getCategoryIcon(code.category.id)
    const IndustryIcon = getIndustryIcon(code.industry || 'universal')
    const isSelected = value === code.code
    const parsedCode = parseSmartCode(code.code)
    
    return (
      <div
        key={code.code}
        onClick={() => handleSelect(code)}
        className={cn(
          'group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all',
          'hover:bg-accent hover:text-accent-foreground',
          isSelected && 'bg-accent text-accent-foreground ring-2 ring-primary'
        )}
      >
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
          isSelected && 'bg-primary text-primary-foreground'
        )}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{code.name}</p>
                {code.deprecated && (
                  <Badge variant="destructive" className="text-xs">
                    Deprecated
                  </Badge>
                )}
              </div>
              
              {showDescription && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {code.description}
                </p>
              )}
              
              <div className="flex items-center gap-3 mt-2">
                <code className="text-xs font-mono text-muted-foreground">
                  {code.code}
                </code>
                
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <IndustryIcon className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{code.industry || 'universal'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Badge variant="outline" className="text-xs">
                    {parsedCode.type}
                  </Badge>
                  
                  <Badge variant="outline" className="text-xs">
                    v{code.version}
                  </Badge>
                </div>
              </div>
            </div>
            
            {isSelected && (
              <Check className="w-4 h-4 shrink-0 mt-1" />
            )}
          </div>
          
          {code.metadata?.usageCount && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              {code.metadata.usageCount} uses
            </div>
          )}
          
          {code.metadata?.lastUsed && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Recently used
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Render content
  const renderContent = () => (
    <div className="space-y-4">
      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search smart codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>
      )}
      
      {/* Filters */}
      <div className="flex items-center gap-2">
        <select
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-md"
          disabled={!!filterIndustry}
        >
          <option value="all">All Industries</option>
          {industries.map(ind => (
            <option key={ind.id} value={ind.id}>
              {ind.name}
            </option>
          ))}
        </select>
        
        <div className="flex items-center gap-1 flex-wrap">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Badge>
          {categories.map(cat => {
            const Icon = cat.icon
            return (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <Icon className="w-3 h-3 mr-1" />
                {cat.name}
              </Badge>
            )
          })}
        </div>
      </div>
      
      {/* Results */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          {/* Recent codes */}
          {showRecent && recentCodes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                <Clock className="w-4 h-4" />
                Recent
              </div>
              <div className="space-y-2">
                {recentCodes.map(renderCodeItem)}
              </div>
            </div>
          )}
          
          {/* Popular codes */}
          {showPopular && popularCodes.length > 0 && !search && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                <Star className="w-4 h-4" />
                Popular
              </div>
              <div className="space-y-2">
                {popularCodes.map(renderCodeItem)}
              </div>
            </div>
          )}
          
          {/* Grouped results */}
          {Object.entries(groupedCodes).map(([categoryId, codes]) => {
            const category = categories.find(c => c.id === categoryId)
            if (!category || codes.length === 0) return null
            
            const Icon = category.icon
            
            return (
              <div key={categoryId}>
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                  <Icon className="w-4 h-4" />
                  {category.name}
                </div>
                <div className="space-y-2">
                  {codes.map(renderCodeItem)}
                </div>
              </div>
            )
          })}
          
          {/* No results */}
          {filteredCodes.length === 0 && (
            <div className="text-center py-8">
              <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No smart codes found
              </p>
              {search && (
                <p className="text-xs text-muted-foreground mt-2">
                  Try adjusting your search or filters
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Custom code input */}
      {allowCustom && (
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter custom code..."
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomCode()
                }
              }}
              className="font-mono"
            />
            <Button
              size="sm"
              onClick={handleCustomCode}
              disabled={!customCode}
            >
              Use Custom
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Format: HERA.INDUSTRY.MODULE.FUNCTION.TYPE.VARIANT.v1
          </p>
        </div>
      )}
    </div>
  )
  
  // Inline mode
  if (mode === 'inline') {
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <label className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <div className="border rounded-lg p-4">
          {renderContent()}
        </div>
      </div>
    )
  }
  
  // Dialog mode
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <div className="flex items-center gap-2">
        <div
          onClick={() => !disabled && setIsOpen(true)}
          className={cn(
            'flex-1 flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer',
            'hover:bg-accent hover:text-accent-foreground transition-colors',
            disabled && 'opacity-50 cursor-not-allowed',
            selectedCode && 'text-foreground'
          )}
        >
          {selectedCode ? (
            <>
              <Code className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate font-mono text-sm">
                {selectedCode.code}
              </span>
              <span className="text-sm text-muted-foreground">
                {selectedCode.name}
              </span>
            </>
          ) : (
            <>
              <Code className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-muted-foreground">
                {placeholder}
              </span>
            </>
          )}
        </div>
        
        {value && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onChange('', {} as SmartCode)}
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>
          
          {renderContent()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ================================================================================
// EXPORTS
// ================================================================================

export default SmartCodePicker

// Export types for external use
export type { SmartCode, SmartCodeCategory, SmartCodePickerProps }