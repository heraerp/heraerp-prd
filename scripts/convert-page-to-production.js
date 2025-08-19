#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Automated Page Converter
 * Converts progressive pages to production following the customers page pattern
 */

const PAGE_CONVERSIONS = {
  appointments: {
    hookName: 'useAppointment',
    entityName: 'Appointment',
    transformerName: 'transformToUIAppointment',
    formInterface: `interface NewAppointmentForm {
  clientName: string
  clientEmail: string
  clientPhone: string
  service: string
  date: string
  time: string
  duration: string
  notes: string
}`,
    formFields: ['clientName', 'clientEmail', 'clientPhone', 'service', 'date', 'time', 'duration', 'notes'],
    statsFields: ['totalAppointments', 'todayCount', 'weekCount', 'cancelledCount']
  },
  
  staff: {
    hookName: 'useEmployee',
    entityName: 'Employee',
    transformerName: 'transformToUIEmployee',
    formInterface: `interface NewStaffForm {
  name: string
  email: string
  phone: string
  role: string
  specialties: string
  hourlyRate: string
  commissionRate: string
}`,
    formFields: ['name', 'email', 'phone', 'role', 'specialties', 'hourlyRate', 'commissionRate'],
    statsFields: ['totalStaff', 'activeCount', 'seniorCount', 'juniorCount']
  },

  services: {
    hookName: 'useService',
    entityName: 'Service',
    transformerName: 'transformToUIService',
    formInterface: `interface NewServiceForm {
  name: string
  category: string
  price: string
  duration: string
  description: string
}`,
    formFields: ['name', 'category', 'price', 'duration', 'description'],
    statsFields: ['totalServices', 'hairServices', 'beautyServices', 'treatmentServices']
  },

  inventory: {
    hookName: 'useProduct',
    entityName: 'Product',
    transformerName: 'transformToUIProduct',
    formInterface: `interface NewProductForm {
  name: string
  sku: string
  category: string
  price: string
  cost: string
  stockLevel: string
  reorderPoint: string
}`,
    formFields: ['name', 'sku', 'category', 'price', 'cost', 'stockLevel', 'reorderPoint'],
    statsFields: ['totalProducts', 'lowStock', 'outOfStock', 'totalValue']
  },

  payments: {
    hookName: 'useTransaction',
    entityName: 'Transaction',
    transformerName: 'transformToUITransaction',
    formInterface: `interface NewPaymentForm {
  customerName: string
  amount: string
  paymentMethod: string
  referenceNumber: string
  notes: string
}`,
    formFields: ['customerName', 'amount', 'paymentMethod', 'referenceNumber', 'notes'],
    statsFields: ['totalPayments', 'todayTotal', 'weekTotal', 'pendingCount']
  }
}

function convertPageToProduction(pageName) {
  const config = PAGE_CONVERSIONS[pageName]
  if (!config) {
    console.error(`No conversion config for page: ${pageName}`)
    return
  }

  const progressivePath = `src/app/salon-progressive/${pageName}/page.tsx`
  const productionPath = `src/app/salon/${pageName}/page.tsx`

  if (!fs.existsSync(progressivePath)) {
    console.error(`Progressive page not found: ${progressivePath}`)
    return
  }

  console.log(`🔄 Converting ${pageName} page to production...`)

  // Read progressive page
  let progressiveContent = fs.readFileSync(progressivePath, 'utf8')

  // Extract the main content (between imports and export)
  const importEndMatch = progressiveContent.match(/from 'lucide-react'\n(.|\n)*?\n\n/)
  const exportMatch = progressiveContent.match(/export default function/)
  
  if (!importEndMatch || !exportMatch) {
    console.error('Could not parse progressive page structure')
    return
  }

  const importEndIndex = importEndMatch.index + importEndMatch[0].length
  const exportIndex = progressiveContent.indexOf('export default function')
  const middleContent = progressiveContent.substring(importEndIndex, exportIndex)

  // Generate new production page
  const productionContent = `'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar,
  Clock,
  User, 
  Search, 
  Plus, 
  Edit3,
  Trash2,
  Phone,
  Mail,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { ${config.hookName} } from '@/hooks/${config.hookName}'
import { useUserContext } from '@/hooks/useUserContext'
import { 
  ${config.transformerName},
  filter${config.entityName}s
} from '@/lib/transformers/${config.entityName.toLowerCase()}-transformer'

${config.formInterface}

export default function ${config.entityName}sProduction() {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  const { 
    items, 
    stats, 
    loading, 
    error, 
    refetch, 
    create${config.entityName}, 
    update${config.entityName}, 
    delete${config.entityName} 
  } = ${config.hookName}(organizationId)

  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // New item form state
  const [newItem, setNewItem] = useState<New${config.entityName}Form>({
    ${config.formFields.map(field => `${field}: ''`).join(',\n    ')}
  })

  // Transform items to UI format
  const uiItems = useMemo(() => 
    items.map(${config.transformerName}),
    [items]
  )

  // Filter items based on search
  const filteredItems = useMemo(() => 
    filter${config.entityName}s(uiItems, searchTerm),
    [uiItems, searchTerm]
  )

  // Get selected item details
  const selectedItemData = useMemo(() => 
    uiItems.find(item => item.id === selectedItem),
    [uiItems, selectedItem]
  )

  const handleAddItem = async () => {
    if (!newItem.${config.formFields[0]}) {
      setFormError('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    setFormError(null)

    try {
      await create${config.entityName}({
        ${config.formFields.map(field => `${field}: newItem.${field}`).join(',\n        ')}
      })

      // Reset form
      setNewItem({
        ${config.formFields.map(field => `${field}: ''`).join(',\n        ')}
      })
      setShowAddForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create ${config.entityName.toLowerCase()}')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this ${config.entityName.toLowerCase()}?')) {
      return
    }

    setIsDeleting(true)
    try {
      await delete${config.entityName}(itemId)
      setSelectedItem(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete ${config.entityName.toLowerCase()}')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access ${pageName} management.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Organization not found. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Copy the rest of the UI from progressive version
  // This is where we'd insert the actual UI components
  // For now, using a placeholder
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/salon">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  ${config.entityName} Management
                </h1>
                <p className="text-sm text-gray-600">Manage your ${pageName}</p>
              </div>
            </div>
            <div className="text-right">
              {userContext && (
                <>
                  <p className="text-sm font-medium">{userContext.user.name}</p>
                  <p className="text-xs text-gray-600">{userContext.organization.name}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* The UI components from progressive version would be inserted here */}
        {/* with data source changed from hardcoded to hooks */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Page UI needs to be copied from progressive version and updated to use production data.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
`

  // Save the production page
  fs.writeFileSync(productionPath, productionContent)
  console.log(`✅ Created production page structure: ${productionPath}`)
  
  console.log(`
📋 Next steps for ${pageName}:
1. Copy the UI components from progressive version
2. Replace hardcoded data with hook data
3. Update form handlers to use create${config.entityName}
4. Update delete handlers to use delete${config.entityName}
5. Test with: http://localhost:3007/salon/${pageName}
`)
}

// Parse command line arguments
const pageName = process.argv[2]

if (!pageName) {
  console.log(`
Usage: npm run convert-page [page-name]

Available pages:
${Object.keys(PAGE_CONVERSIONS).map(p => `  - ${p}`).join('\n')}

Example: npm run convert-page appointments
`)
} else {
  convertPageToProduction(pageName)
}