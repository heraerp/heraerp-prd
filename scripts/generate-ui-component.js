#!/usr/bin/env node

/**
 * UI Component Generator
 * Creates consistent, enterprise-grade components
 */

const fs = require('fs').promises
const path = require('path')
const chalk = require('chalk')

// Component templates
const TEMPLATES = {
  configPage: `/**
 * {{displayName}} Management Page
 * Auto-generated with enterprise UI standards
 */

'use client'

import { UniversalConfigManager } from '@/components/universal-config/UniversalConfigManager'
import { CONFIG_TYPES } from '@/lib/universal-config/config-types'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export default function {{componentName}}Page() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-6">
      <UniversalConfigManager
        config={CONFIG_TYPES.{{configType}}}
        apiEndpoint="/api/v1/{{apiPath}}"
        additionalFields={[
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            defaultValue: '',
            placeholder: 'Enter description'
          },
          {
            name: 'is_active',
            label: 'Active',
            type: 'checkbox',
            defaultValue: true,
            helpText: 'Enable or disable this {{itemName}}'
          }
        ]}
        customColumns={[
          {
            key: 'status',
            header: 'Status',
            render: (item) => (
              <Badge variant={item.is_active ? 'default' : 'secondary'}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Badge>
            )
          }
        ]}
        showAnalytics={true}
        analyticsConfig={{
          title: '{{displayName}} Analytics',
          metrics: [
            {
              label: 'Total {{itemNamePlural}}',
              value: (items) => items.length
            },
            {
              label: 'Active {{itemNamePlural}}',
              value: (items) => items.filter(item => item.is_active).length
            }
          ]
        }}
      />
    </div>
  )
}`,

  formModal: `/**
 * {{displayName}} Form Modal
 * Auto-generated with enterprise UI standards
 */

'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { CurrencyInput } from '@/components/ui/currency-input'

interface {{componentName}}Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  item?: any
}

export function {{componentName}}({
  open,
  onOpenChange,
  onSuccess,
  item
}: {{componentName}}Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  // Form state
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    {{additionalFields}}
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      // API call here
      const response = await fetch('/api/v1/{{apiEndpoint}}', {
        method: item ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save')

      toast({
        title: 'Success',
        description: \`{{itemName}} \${item ? 'updated' : 'created'} successfully\`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save {{itemName}}',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] md:max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {item ? 'Edit {{itemName}}' : 'Create New {{itemName}}'}
          </DialogTitle>
          <DialogDescription>
            {item ? 'Update the details below' : 'Fill in the information to create a new {{itemName}}'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-1 -mx-1">
            <div className="space-y-6 pb-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Basic Information
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter description"
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              {{additionalSections}}
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2 bg-background sticky bottom-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {item ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{item ? 'Update' : 'Create'} {{itemName}}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}`,

  listPage: `/**
 * {{displayName}} List Page
 * Auto-generated with enterprise UI standards
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { {{modalName}} } from './{{modalFileName}}'

export default function {{componentName}}Page() {
  const { currentOrganization } = useMultiOrgAuth()
  const { toast } = useToast()
  
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  useEffect(() => {
    if (currentOrganization) {
      loadItems()
    }
  }, [currentOrganization])

  const loadItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(\`/api/v1/{{apiPath}}?organization_id=\${currentOrganization?.id}\`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load {{itemNamePlural}}',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{{displayName}}</h1>
          <p className="text-muted-foreground">Manage your {{itemNamePlural}}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add {{itemName}}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search {{itemNamePlural}}..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No {{itemNamePlural}} found
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item)
                            setShowModal(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
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

      {/* Modal */}
      <{{modalName}}
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open)
          if (!open) setSelectedItem(null)
        }}
        item={selectedItem}
        onSuccess={loadItems}
      />
    </div>
  )
}`
}

// Generate component
async function generateComponent(type, name, options = {}) {
  const componentName = name.split('-').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join('')
  
  const displayName = name.split('-').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ')
  
  const itemName = displayName.toLowerCase()
  const itemNamePlural = itemName + 's'
  
  const template = TEMPLATES[type]
  if (!template) {
    console.error(chalk.red(`Unknown component type: ${type}`))
    process.exit(1)
  }
  
  // Replace template variables
  let content = template
    .replace(/{{componentName}}/g, componentName)
    .replace(/{{displayName}}/g, displayName)
    .replace(/{{itemName}}/g, itemName)
    .replace(/{{itemNamePlural}}/g, itemNamePlural)
    .replace(/{{apiPath}}/g, options.apiPath || name)
    .replace(/{{apiEndpoint}}/g, options.apiPath || name)
    .replace(/{{configType}}/g, name.toUpperCase().replace(/-/g, '_'))
    .replace(/{{modalName}}/g, `${componentName}Modal`)
    .replace(/{{modalFileName}}/g, `${componentName}Modal`)
    
  // Add additional fields if specified
  if (options.fields) {
    const additionalFields = options.fields.map(field => 
      `${field}: item?.${field} || ''`
    ).join(',\n    ')
    content = content.replace(/{{additionalFields}}/g, additionalFields)
    
    // Add sections for fields
    const sections = options.fields.map(field => `
              {/* ${field.charAt(0).toUpperCase() + field.slice(1)} Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Additional Settings
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="${field}">${field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                  <Input
                    id="${field}"
                    value={formData.${field}}
                    onChange={(e) => setFormData({...formData, ${field}: e.target.value})}
                    placeholder="Enter ${field}"
                  />
                </div>
              </div>`).join('\n')
    content = content.replace(/{{additionalSections}}/g, sections)
  } else {
    content = content.replace(/{{additionalFields}}/g, '')
    content = content.replace(/{{additionalSections}}/g, '')
  }
  
  // Determine output path
  const outputDir = options.output || path.join('src/app', name)
  const outputFile = path.join(outputDir, 
    type === 'formModal' ? `${componentName}Modal.tsx` : 'page.tsx'
  )
  
  // Create directory
  await fs.mkdir(outputDir, { recursive: true })
  
  // Write file
  await fs.writeFile(outputFile, content)
  
  console.log(chalk.green(`✅ Generated ${type}: ${outputFile}`))
  
  // Generate additional files if needed
  if (type === 'listPage' && options.withModal) {
    await generateComponent('formModal', name, { 
      ...options, 
      output: outputDir 
    })
  }
  
  return outputFile
}

// Main CLI
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log(chalk.blue(`
UI Component Generator
======================

Usage: node scripts/generate-ui-component.js <type> <name> [options]

Types:
  configPage    - Universal configuration page
  listPage      - List page with table
  formModal     - Form modal component

Examples:
  node scripts/generate-ui-component.js configPage supplier-types
  node scripts/generate-ui-component.js listPage purchase-orders --withModal
  node scripts/generate-ui-component.js formModal edit-client --fields=phone,email

Options:
  --apiPath=path     Custom API path
  --output=path      Custom output directory
  --fields=f1,f2     Additional form fields
  --withModal        Generate modal with list page
`))
    process.exit(0)
  }
  
  const [type, name] = args
  const options = {}
  
  // Parse options
  args.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=')
      if (key === 'fields') {
        options.fields = value.split(',')
      } else if (key === 'withModal') {
        options.withModal = true
      } else {
        options[key] = value
      }
    }
  })
  
  try {
    await generateComponent(type, name, options)
    
    console.log(chalk.green('\n✨ Component generated successfully!'))
    console.log(chalk.gray('\nNext steps:'))
    console.log('1. Review the generated component')
    console.log('2. Add to your routing/navigation')
    console.log('3. Customize fields and behavior as needed')
    console.log('4. Run npm run ui:validate to ensure consistency')
  } catch (error) {
    console.error(chalk.red('Error:'), error.message)
    process.exit(1)
  }
}

main()