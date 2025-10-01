'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfigRule {
  id: string
  name: string
  category: string
  type: 'validation' | 'transformation' | 'business_logic' | 'integration'
  scope: 'global' | 'organization' | 'entity_type' | 'specific'
  status: 'active' | 'inactive' | 'draft' | 'deprecated'
  priority: number
  description: string
  smart_code: string
  created_at: string
  updated_at: string
  applied_count: number
  error_count: number
  success_rate: number
  organization_id?: string
}

interface RulesListProps {
  className?: string
  onEditRule?: (rule: ConfigRule) => void
  onDeleteRule?: (ruleId: string) => void
  onViewRule?: (rule: ConfigRule) => void
  onCreateRule?: () => void
}

export function RulesList({
  className,
  onEditRule,
  onDeleteRule,
  onViewRule,
  onCreateRule
}: RulesListProps) {
  const [rules, setRules] = useState<ConfigRule[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<keyof ConfigRule>('updated_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Mock data for demonstration
  const mockRules: ConfigRule[] = [
    {
      id: 'rule_1',
      name: 'Customer Credit Limit Validation',
      category: 'Customer Management',
      type: 'validation',
      scope: 'global',
      status: 'active',
      priority: 1,
      description: 'Validates customer credit limits against outstanding balance',
      smart_code: 'HERA.CRM.CUST.VALIDATION.CREDIT.V1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T14:30:00Z',
      applied_count: 1247,
      error_count: 23,
      success_rate: 98.2
    },
    {
      id: 'rule_2',
      name: 'Auto-Journal GL Posting',
      category: 'Financial Integration',
      type: 'business_logic',
      scope: 'global',
      status: 'active',
      priority: 2,
      description: 'Automatically creates GL journal entries for sales transactions',
      smart_code: 'HERA.FIN.GL.AUTO.JOURNAL.V1',
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-22T16:45:00Z',
      applied_count: 2156,
      error_count: 12,
      success_rate: 99.4
    },
    {
      id: 'rule_3',
      name: 'Inventory Reorder Point',
      category: 'Inventory Management',
      type: 'business_logic',
      scope: 'organization',
      status: 'active',
      priority: 3,
      description: 'Triggers reorder alerts when inventory falls below threshold',
      smart_code: 'HERA.INV.REORDER.ALERT.V1',
      created_at: '2024-01-12T11:30:00Z',
      updated_at: '2024-01-21T10:15:00Z',
      applied_count: 842,
      error_count: 5,
      success_rate: 99.4
    },
    {
      id: 'rule_4',
      name: 'Price Calculation Transform',
      category: 'Product Management',
      type: 'transformation',
      scope: 'entity_type',
      status: 'draft',
      priority: 4,
      description: 'Transforms base prices with dynamic pricing rules',
      smart_code: 'HERA.PROD.PRICING.TRANSFORM.V1',
      created_at: '2024-01-18T13:00:00Z',
      updated_at: '2024-01-23T09:20:00Z',
      applied_count: 0,
      error_count: 0,
      success_rate: 0
    }
  ]

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setRules(mockRules)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const filteredRules = rules.filter(rule => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.smart_code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || rule.category === categoryFilter
    const matchesType = typeFilter === 'all' || rule.type === typeFilter
    const matchesStatus = statusFilter === 'all' || rule.status === statusFilter

    return matchesSearch && matchesCategory && matchesType && matchesStatus
  })

  const sortedRules = [...filteredRules].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  const handleSort = (field: keyof ConfigRule) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      inactive: 'bg-muted text-gray-200 dark:bg-muted/30 dark:text-gray-300',
      draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      deprecated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }

    return (
      <Badge className={cn('font-medium', variants[status] || variants.inactive)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      validation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      transformation: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      business_logic: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      integration: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    }

    return (
      <Badge variant="outline" className={cn('font-medium', variants[type] || variants.validation)}>
        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    )
  }

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'global':
        return <div className="w-2 h-2 bg-green-500 rounded-full" title="Global" />
      case 'organization':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" title="Organization" />
      case 'entity_type':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Entity Type" />
      case 'specific':
        return <div className="w-2 h-2 bg-red-500 rounded-full" title="Specific" />
      default:
        return <div className="w-2 h-2 bg-gray-9000 rounded-full" />
    }
  }

  const getSuccessRateIcon = (rate: number) => {
    if (rate >= 95) return <CheckCircle className="w-4 h-4 text-green-500" />
    if (rate >= 80) return <AlertCircle className="w-4 h-4 text-yellow-500" />
    return <AlertCircle className="w-4 h-4 text-red-500" />
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card with Glass Effect */}
      <Card className="bg-background/50 dark:bg-background/50 backdrop-blur-xl border-border/20 dark:border-border/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl !text-gray-100 dark:!text-gray-100">
                Configuration Rules
              </CardTitle>
              <CardDescription className="!text-muted-foreground dark:!text-gray-300">
                Manage universal configuration rules that control system behavior across
                organizations
              </CardDescription>
            </div>
            <Button
              onClick={onCreateRule}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-foreground shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters and Search */}
      <Card className="bg-background/50 dark:bg-background/50 backdrop-blur-xl border-border/20 dark:border-border/30">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search rules by name, description, or smart code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Customer Management">Customer Management</SelectItem>
                  <SelectItem value="Financial Integration">Financial Integration</SelectItem>
                  <SelectItem value="Inventory Management">Inventory Management</SelectItem>
                  <SelectItem value="Product Management">Product Management</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="validation">Validation</SelectItem>
                  <SelectItem value="transformation">Transformation</SelectItem>
                  <SelectItem value="business_logic">Business Logic</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('all')
                  setTypeFilter('all')
                  setStatusFilter('all')
                }}
                className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card className="bg-background/50 dark:bg-background/50 backdrop-blur-xl border-border/20 dark:border-border/30">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/20 dark:border-border/30">
                    <TableHead className="font-semibold !text-gray-100 dark:!text-gray-100">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center hover:text-primary dark:hover:text-blue-400 transition-colors"
                      >
                        Rule Name
                        {sortField === 'name' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold !text-gray-100 dark:!text-gray-100">
                      Type & Scope
                    </TableHead>
                    <TableHead className="font-semibold !text-gray-100 dark:!text-gray-100">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold !text-gray-100 dark:!text-gray-100">
                      <button
                        onClick={() => handleSort('priority')}
                        className="flex items-center hover:text-primary dark:hover:text-blue-400 transition-colors"
                      >
                        Priority
                        {sortField === 'priority' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold !text-gray-100 dark:!text-gray-100">
                      Performance
                    </TableHead>
                    <TableHead className="font-semibold !text-gray-100 dark:!text-gray-100">
                      Smart Code
                    </TableHead>
                    <TableHead className="font-semibold !text-gray-100 dark:!text-gray-100">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRules.map(rule => (
                    <TableRow
                      key={rule.id}
                      className="hover:bg-background/30 dark:hover:bg-muted/30 border-border/20 dark:border-border/30 transition-colors"
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium !text-gray-100 dark:!text-gray-100">
                            {rule.name}
                          </div>
                          <div className="text-sm !text-muted-foreground dark:!text-muted-foreground truncate max-w-xs">
                            {rule.description}
                          </div>
                          <div className="text-xs !text-muted-foreground dark:!text-muted-foreground mt-1">
                            {rule.category}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {getTypeBadge(rule.type)}
                          <div className="flex items-center gap-2">
                            {getScopeIcon(rule.scope)}
                            <span className="text-sm !text-muted-foreground dark:!text-muted-foreground capitalize">
                              {rule.scope}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(rule.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                            {rule.priority}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getSuccessRateIcon(rule.success_rate)}
                            <span className="text-sm font-medium !text-gray-100 dark:!text-gray-100">
                              {rule.success_rate}%
                            </span>
                          </div>
                          <div className="text-xs !text-muted-foreground dark:!text-muted-foreground">
                            Applied: {rule.applied_count.toLocaleString()}
                          </div>
                          {rule.error_count > 0 && (
                            <div className="text-xs text-red-600 dark:text-red-400">
                              Errors: {rule.error_count}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted dark:bg-muted px-2 py-1 rounded font-mono !text-gray-200 dark:!text-gray-200">
                          {rule.smart_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewRule?.(rule)}
                            className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          >
                            <Eye className="w-4 h-4 text-primary dark:text-blue-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditRule?.(rule)}
                            className="h-8 w-8 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                          >
                            <Pencil className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteRule?.(rule.id)}
                            className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && sortedRules.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Filter className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium !text-gray-100 dark:!text-gray-100">
                No rules found
              </p>
              <p className="text-sm !text-muted-foreground dark:!text-muted-foreground mt-1">
                Try adjusting your search criteria or create a new rule
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {!loading && sortedRules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200/30 dark:border-blue-800/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold !text-blue-700 dark:!text-blue-300">
                {rules.length}
              </div>
              <div className="text-sm !text-primary dark:!text-blue-400">Total Rules</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-200/30 dark:border-emerald-800/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold !text-emerald-700 dark:!text-emerald-300">
                {rules.filter(r => r.status === 'active').length}
              </div>
              <div className="text-sm !text-emerald-600 dark:!text-emerald-400">Active</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-200/30 dark:border-amber-800/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold !text-amber-700 dark:!text-amber-300">
                {Math.round(rules.reduce((sum, r) => sum + r.success_rate, 0) / rules.length)}%
              </div>
              <div className="text-sm !text-amber-600 dark:!text-amber-400">Avg Success Rate</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200/30 dark:border-purple-800/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold !text-purple-700 dark:!text-purple-300">
                {rules.reduce((sum, r) => sum + r.applied_count, 0).toLocaleString()}
              </div>
              <div className="text-sm !text-purple-600 dark:!text-purple-400">
                Total Applications
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
