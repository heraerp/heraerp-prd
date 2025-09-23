/**
 * Universal Configuration Manager Component
 * Enterprise-grade UI for managing any configuration type
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, Settings, ChevronRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
// import { useToast } from '@/components/ui/use-toast' // Not needed for static generation
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { ConfigType } from '@/lib/universal-config/config-types'
import { CurrencyInput, CurrencyDisplay } from '@/components/ui/currency-input'

interface UniversalConfigManagerProps {
  config: ConfigType
  apiEndpoint: string
  additionalFields?: {
    name: string
    label: string
    type:
      | 'text'
      | 'number'
      | 'boolean'
      | 'checkbox'
      | 'textarea'
      | 'currency'
      | 'select'
      | 'multiselect'
      | 'date'
      | 'color'
    options?: { value: string; label: string }[]
    required?: boolean
    defaultValue?: any
    helpText?: string
    placeholder?: string
    min?: number
    max?: number
  }[]
  onItemClick?: (item: any) => void
  customColumns?: {
    key: string
    header: string
    render: (item: any) => React.ReactNode
  }[]
  showAnalytics?: boolean
  analyticsConfig?: {
    title: string
    metrics: {
      label: string
      value: (items: any[]) => React.ReactNode
    }[]
  }
}

export function UniversalConfigManager({
  config,
  apiEndpoint,
  additionalFields = [],
  onItemClick,
  customColumns = [],
  showAnalytics = false,
  analyticsConfig
}: UniversalConfigManagerProps) {
  const { currentOrganization, contextLoading  } = useHERAAuth()
  const DEFAULT_ORG_ID =
    process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState<any>({
    name: '',
    code: '',
    is_active: true
  })

  // const { toast } = useToast() // Commented out for static generation

  // Initialize form with additional fields
  useEffect(() => {
    const initialFormData: any = {
      name: '',
      code: '',
      is_active: true
    }

    additionalFields.forEach(field => {
      initialFormData[field.name] = field.defaultValue ?? ''
    })

    setFormData(initialFormData)
  }, [additionalFields])

  const fetchItems = async () => {
    if (!organizationId) return

    try {
      const response = await fetch(`${apiEndpoint}?organization_id=${organizationId}`)
      if (!response.ok) throw new Error(`Failed to fetch ${config.pluralName}`)

      const data = await response.json()
      const itemsKey = config.pluralName.toLowerCase().replace(/ /g, '_')

      setItems(data[itemsKey] || [])
      setAnalytics(data.analytics || null)
    } catch (error) {
      console.error(`Error fetching ${config.pluralName}:`, error)
      console.error(`Failed to load ${config.pluralName}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organizationId && !contextLoading) {
      fetchItems()
    }
  }, [organizationId, contextLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const endpoint = selectedItem ? `${apiEndpoint}?id=${selectedItem.id}` : apiEndpoint

      const method = selectedItem ? 'PUT' : 'POST'

      const payload = {
        organization_id: organizationId,
        ...formData
      }

      console.log(`Creating ${config.displayName} with payload:`, payload)

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error(`API Error:`, errorData)
        throw new Error(
          errorData.error || `Failed to ${selectedItem ? 'update' : 'create'} ${config.displayName}`
        )
      }

      console.log(
        'Success:',
        `${config.displayName} ${selectedItem ? 'updated' : 'created'} successfully`
      )

      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
      resetForm()
      fetchItems()
    } catch (error) {
      console.error('Error:', error)
      console.error(`Failed to ${selectedItem ? 'update' : 'create'} ${config.displayName}:`, error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return

    try {
      const response = await fetch(`${apiEndpoint}?id=${selectedItem.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to delete ${config.displayName}`)
      }

      console.log('Success:', `${config.displayName} deleted successfully`)

      setIsDeleteDialogOpen(false)
      setSelectedItem(null)
      fetchItems()
    } catch (error: any) {
      console.error('Delete failed:', error.message || `Failed to delete ${config.displayName}`)
    }
  }

  const resetForm = () => {
    const resetData: any = {
      name: '',
      code: '',
      is_active: true
    }

    additionalFields.forEach(field => {
      resetData[field.name] = field.defaultValue ?? ''
    })

    setFormData(resetData)
    setSelectedItem(null)
  }

  const openEditDialog = (item: any) => {
    setSelectedItem(item)
    const editData: any = {
      name: item.entity_name,
      code: item.entity_code,
      is_active: item.is_active ?? true
    }

    additionalFields.forEach(field => {
      editData[field.name] = item[field.name] ?? field.defaultValue ?? ''
    })

    setFormData(editData)
    setIsEditDialogOpen(true)
  }

  const filteredItems = items.filter(
    item =>
      item.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entity_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading {config.pluralName}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{config.pluralName}</h2>
          <p className="text-muted-foreground">
            Manage your {config.pluralName.toLowerCase()} configuration
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add {config.displayName}
        </Button>
      </div>

      {/* Analytics Cards */}
      {showAnalytics && analyticsConfig && (
        <Card>
          <CardHeader>
            <CardTitle>{analyticsConfig.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analyticsConfig.metrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <div className="text-2xl font-bold">{metric.value(filteredItems)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Default Analytics */}
      {!showAnalytics && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(analytics).map(([key, value]) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {key.replace(/_/g, ' ')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value as string}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${config.pluralName.toLowerCase()}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                {customColumns.map(col => (
                  <TableHead key={col.key}>{col.header}</TableHead>
                ))}
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4 + customColumns.length} className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4 + customColumns.length}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No {config.pluralName.toLowerCase()} found
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map(item => (
                  <TableRow
                    key={item.id}
                    className={onItemClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => onItemClick?.(item)}
                  >
                    <TableCell className="font-medium">{item.entity_name}</TableCell>
                    <TableCell>
                      <code className="text-sm">{item.entity_code}</code>
                    </TableCell>
                    {customColumns.map(col => (
                      <TableCell key={col.key}>{col.render(item)}</TableCell>
                    ))}
                    <TableCell>
                      <Badge variant={item.is_active !== false ? 'default' : 'secondary'}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Pencil Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={open => {
          if (!open) {
            setIsAddDialogOpen(false)
            setIsEditDialogOpen(false)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {selectedItem ? `Edit ${config.displayName}` : `Add New ${config.displayName}`}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? `Update the ${config.displayName.toLowerCase()} details below`
                : `Create a new ${config.displayName.toLowerCase()}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto px-1 -mx-1">
              <div className="space-y-6 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>

                {/* Additional Fields - Group by sections */}
                <div className="space-y-4">
                  {additionalFields.map((field, index) => {
                    // Add section headers based on field grouping
                    const shouldShowSectionHeader =
                      index === 0 ||
                      (field.name === 'service_commission_rate' &&
                        additionalFields[index - 1]?.name !== 'service_commission_rate') ||
                      (field.name === 'can_accept_tips' &&
                        additionalFields[index - 1]?.name !== 'can_accept_tips') ||
                      (field.name === 'permissions' &&
                        additionalFields[index - 1]?.name !== 'permissions')

                    const sectionTitle = field.name.includes('commission')
                      ? 'Commission Settings'
                      : field.name === 'can_accept_tips' || field.name === 'requires_license'
                        ? 'Professional Settings'
                        : field.name === 'permissions'
                          ? 'Permissions & Access'
                          : index === 0
                            ? 'Basic Information'
                            : null

                    return (
                      <React.Fragment key={field.name}>
                        {shouldShowSectionHeader && sectionTitle && (
                          <div className="pt-4 first:pt-0">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                              {sectionTitle}
                            </h3>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </Label>
                          {field.type === 'textarea' ? (
                            <Textarea
                              id={field.name}
                              value={formData[field.name]}
                              onChange={e =>
                                setFormData({ ...formData, [field.name]: e.target.value })
                              }
                              required={field.required}
                              className="min-h-[80px] max-h-[120px]"
                            />
                          ) : field.type === 'boolean' || field.type === 'checkbox' ? (
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={field.name}
                                checked={formData[field.name]}
                                onCheckedChange={checked =>
                                  setFormData({ ...formData, [field.name]: checked })
                                }
                              />
                              <Label
                                htmlFor={field.name}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {field.helpText || 'Enable this option'}
                              </Label>
                            </div>
                          ) : field.type === 'currency' ? (
                            <CurrencyInput
                              id={field.name}
                              value={formData[field.name]}
                              onChange={value =>
                                setFormData({ ...formData, [field.name]: value || 0 })
                              }
                              required={field.required}
                            />
                          ) : field.type === 'select' ? (
                            <select
                              id={field.name}
                              value={formData[field.name]}
                              onChange={e =>
                                setFormData({ ...formData, [field.name]: e.target.value })
                              }
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              required={field.required}
                            >
                              <option value="">Select {field.label}</option>
                              {field.options?.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : field.type === 'multiselect' ? (
                            <div className="border rounded-md">
                              <ScrollArea className="h-[240px] p-3">
                                <div className="space-y-3">
                                  {(() => {
                                    // Group permissions by category
                                    const groups: Record<string, typeof field.options> = {}
                                    field.options?.forEach(option => {
                                      const category = option.label.includes('📅')
                                        ? 'Appointments'
                                        : option.label.includes('👤')
                                          ? 'Client Management'
                                          : option.label.includes('✂️') ||
                                              option.label.includes('🛍️')
                                            ? 'Services & Products'
                                            : option.label.includes('💳') ||
                                                option.label.includes('💸') ||
                                                option.label.includes('💰')
                                              ? 'Financial'
                                              : option.label.includes('📦')
                                                ? 'Inventory'
                                                : option.label.includes('📊')
                                                  ? 'Reports'
                                                  : option.label.includes('⚙️')
                                                    ? 'Administration'
                                                    : 'Other'
                                      if (!groups[category]) groups[category] = []
                                      groups[category].push(option)
                                    })

                                    return Object.entries(groups).map(([category, options]) => (
                                      <div key={category} className="space-y-2">
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                          {category}
                                        </h4>
                                        <div className="space-y-1 pl-2">
                                          {options.map(option => (
                                            <label
                                              key={option.value}
                                              className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded-md transition-colors"
                                            >
                                              <Checkbox
                                                checked={
                                                  formData[field.name]?.includes(option.value) ||
                                                  false
                                                }
                                                onCheckedChange={checked => {
                                                  const currentValues = formData[field.name] || []
                                                  const newValues = checked
                                                    ? [...currentValues, option.value]
                                                    : currentValues.filter(
                                                        (v: string) => v !== option.value
                                                      )
                                                  setFormData({
                                                    ...formData,
                                                    [field.name]: newValues
                                                  })
                                                }}
                                              />
                                              <span className="text-sm">{option.label}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    ))
                                  })()}
                                </div>
                              </ScrollArea>
                              <div className="border-t px-3 py-2 bg-muted/50">
                                <p className="text-xs text-muted-foreground">
                                  {formData[field.name]?.length || 0} permissions selected
                                </p>
                              </div>
                            </div>
                          ) : field.type === 'color' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                id={field.name}
                                type="color"
                                value={formData[field.name]}
                                onChange={e =>
                                  setFormData({ ...formData, [field.name]: e.target.value })
                                }
                                className="h-10 w-20 cursor-pointer"
                              />
                              <Input
                                type="text"
                                value={formData[field.name]}
                                onChange={e =>
                                  setFormData({ ...formData, [field.name]: e.target.value })
                                }
                                placeholder="#000000"
                                className="flex-1"
                              />
                            </div>
                          ) : (
                            <Input
                              id={field.name}
                              type={field.type}
                              value={formData[field.name]}
                              onChange={e =>
                                setFormData({
                                  ...formData,
                                  [field.name]:
                                    field.type === 'number'
                                      ? parseFloat(e.target.value) || 0
                                      : e.target.value
                                })
                              }
                              required={field.required}
                              min={field.min}
                              max={field.max}
                              step={field.type === 'number' ? 'any' : undefined}
                              placeholder={field.placeholder}
                            />
                          )}
                          {field.helpText &&
                            field.type !== 'checkbox' &&
                            field.type !== 'boolean' && (
                              <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                            )}
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label>Active Status</Label>
                    <p className="text-sm text-muted-foreground">
                      {config.displayName} is available for use
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2 bg-background sticky bottom-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  setIsEditDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {selectedItem ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {selectedItem ? 'Update' : 'Create'} {config.displayName}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {config.displayName}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedItem?.entity_name}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedItem(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
