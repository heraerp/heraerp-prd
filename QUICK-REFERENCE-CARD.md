# HERA Quick Reference Card - Copy/Paste Templates

## 🚀 Start Every Session With This Message:
```
I'm building a production-grade module for HERA ERP. Follow these rules:
1. NO DUMMY DATA - Everything from API/database
2. Use universal 6-table architecture (core_entities with metadata)
3. Include organizationId in all API calls
4. Handle loading states properly (contextLoading check)
5. Create default data in API if none exists
6. Follow the patterns in HERA-DEVELOPMENT-STANDARDS.md
```

## 📋 Copy/Paste Code Templates

### 1. New Page Component (Copy This)
```typescript
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Search, Plus, RefreshCw } from 'lucide-react'

const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

export default function ModulePage() {
  const router = useRouter()
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const { toast } = useToast()
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
  
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/v1/module/entities?organization_id=${organizationId}`)
      const result = await response.json()
      
      if (!response.ok) throw new Error(result.error || 'Failed to fetch data')
      if (result.success) setData(result.data)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])
  
  useEffect(() => {
    if (organizationId && !contextLoading) {
      fetchData()
    }
  }, [organizationId, contextLoading, fetchData])
  
  if (contextLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div className="p-6 max-w-7xl mx-auto">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Module Title</h1>
          <Button onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {/* Add your content here */}
      </div>
    </div>
  )
}
```

### 2. New API Route (Copy This)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withErrorHandler } from '@/lib/api-error-handler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')
  
  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: 'Organization ID is required' },
      { status: 400 }
    )
  }
  
  try {
    const { data, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'your_entity_type')
    
    if (error) throw error
    
    // Create defaults if none exist
    if (!data || data.length === 0) {
      await createDefaults(organizationId)
      // Fetch again
      const { data: newData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'your_entity_type')
      
      return NextResponse.json({
        success: true,
        data: transformData(newData || [])
      })
    }
    
    return NextResponse.json({
      success: true,
      data: transformData(data)
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
})

function transformData(entities: any[]): any[] {
  return entities.map(e => ({
    id: e.id,
    name: e.entity_name,
    code: e.entity_code,
    ...e.metadata
  }))
}

async function createDefaults(organizationId: string) {
  // Create sensible defaults
}
```

### 3. Form with Validation (Copy This)
```typescript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  phone: ''
})
const [formErrors, setFormErrors] = useState<Record<string, string>>({})
const [isSubmitting, setIsSubmitting] = useState(false)

const validateForm = (): boolean => {
  const errors: Record<string, string> = {}
  
  if (!formData.name.trim()) {
    errors.name = 'Name is required'
  }
  
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Invalid email format'
  }
  
  setFormErrors(errors)
  return Object.keys(errors).length === 0
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!validateForm()) return
  
  setIsSubmitting(true)
  try {
    const response = await fetch('/api/v1/module/entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, organizationId })
    })
    
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    
    toast({
      title: 'Success',
      description: 'Created successfully'
    })
    
    // Reset form or navigate
  } catch (error) {
    toast({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to create',
      variant: 'destructive'
    })
  } finally {
    setIsSubmitting(false)
  }
}
```

### 4. Search and Filter Pattern
```typescript
const [searchTerm, setSearchTerm] = useState('')
const [statusFilter, setStatusFilter] = useState('all')

const filteredData = useMemo(() => {
  return data.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    return matchesSearch && matchesStatus
  })
}, [data, searchTerm, statusFilter])

// In UI
<div className="flex gap-4 mb-6">
  <div className="flex-1 relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
    <Input
      placeholder="Search..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10"
    />
  </div>
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-[180px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Status</SelectItem>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="inactive">Inactive</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### 5. Empty State Pattern
```typescript
{data.length === 0 ? (
  <Card className="text-center py-12">
    <CardContent>
      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
      <p className="text-gray-600 mb-4">
        {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first item'}
      </p>
      <Button onClick={() => setShowAddDialog(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Add First Item
      </Button>
    </CardContent>
  </Card>
) : (
  // Show data grid/list
)}
```

## 🎯 Common Patterns Reference

### Dubai/UAE Localization
```typescript
// Currency formatting
amount.toLocaleString('en-AE', { 
  style: 'currency', 
  currency: 'AED',
  minimumFractionDigits: 0
})

// Date formatting
new Date().toLocaleDateString('en-AE', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

// Phone validation
/^(\+971|0)?[1-9]\d{8}$/.test(phone)

// Default values
tax_rate: 5.0  // Dubai VAT
timezone: 'Asia/Dubai'
currency: 'AED'
```

### Error Toast Pattern
```typescript
toast({
  title: 'Success',
  description: 'Operation completed successfully',
})

toast({
  title: 'Error',
  description: 'Something went wrong. Please try again.',
  variant: 'destructive'
})
```

### Loading Button Pattern
```typescript
<Button disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Processing...
    </>
  ) : (
    <>
      <Icon className="w-4 h-4 mr-2" />
      Submit
    </>
  )}
</Button>
```

### Confirmation Dialog Pattern
```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## 🚨 Remember These Rules

1. **NO DUMMY DATA** - Always fetch from API
2. **Organization ID** - Include in every API call
3. **Loading States** - Check contextLoading first
4. **Error Handling** - User-friendly messages
5. **Empty States** - Design for first-time users
6. **Metadata Pattern** - Store custom fields in metadata
7. **Smart Codes** - Every entity needs one
8. **Default Data** - API creates if none exists

## 📱 Responsive Classes Quick Reference
```
// Grid responsive
grid-cols-1 md:grid-cols-2 lg:grid-cols-3

// Text responsive  
text-sm md:text-base lg:text-lg

// Padding responsive
p-4 md:p-6 lg:p-8

// Hide/Show
hidden md:block
block md:hidden
```

## 🎨 Module Color Themes
```typescript
// Salon: Purple/Pink
bg-gradient-to-br from-purple-50 via-pink-50 to-white

// Finance: Blue/Cyan
bg-gradient-to-br from-blue-50 via-cyan-50 to-white

// Healthcare: Green/Emerald
bg-gradient-to-br from-green-50 via-emerald-50 to-white

// Restaurant: Orange/Red
bg-gradient-to-br from-orange-50 via-red-50 to-white
```

---

**Pro Tip**: Keep this file open in a separate tab and copy/paste templates as needed. Always check HERA-DEVELOPMENT-STANDARDS.md for detailed explanations.