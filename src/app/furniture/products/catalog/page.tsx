'use client'

import React, { useState, useEffect } from 'react'
import { EnterpriseDataTable } from '@/lib/dna/components/organisms/EnterpriseDataTable'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  Upload,
  Package,
  BarChart,
  Edit,
  Eye,
  AlertCircle,
  Sofa,
  Briefcase,
  Bed,
  Square,
  Grid3x3
} from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useFurnitureOrg, FurnitureOrgLoading } from '@/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Category icons mapping
const categoryIcons = {
  'office': Briefcase,
  'seating': Sofa,
  'tables': Square,
  'storage': Grid3x3,
  'beds': Bed
}

// Category colors mapping
const categoryColors = {
  'office': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  'seating': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  'tables': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  'storage': 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  'beds': 'bg-green-500/20 text-green-400 border-green-500/50'
}

// Column configuration for furniture products
const columns = [
  {
    key: 'entity_code',
    label: 'SKU',
    sortable: true,
    width: '120px',
    render: (value: string) => (
      <span className="font-mono text-sm">{value}</span>
    )
  },
  {
    key: 'entity_name',
    label: 'Product Name',
    sortable: true,
    render: (value: string, row: any) => {
      const Icon = categoryIcons[row.category as keyof typeof categoryIcons] || Package
      return (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      )
    }
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    render: (value: string) => {
      const colorClass = categoryColors[value as keyof typeof categoryColors] || 'bg-gray-500/20 text-gray-400'
      return (
        <Badge variant="outline" className={cn("capitalize", colorClass)}>
          {value || 'uncategorized'}
        </Badge>
      )
    }
  },
  {
    key: 'material',
    label: 'Material',
    sortable: true,
    render: (value: string) => (
      <span className="capitalize">{value || '-'}</span>
    )
  },
  {
    key: 'dimensions',
    label: 'Dimensions (L×W×H)',
    render: (value: any, row: any) => (
      <span className="text-sm font-mono">
        {row.length_cm || 0}×{row.width_cm || 0}×{row.height_cm || 0}cm
      </span>
    )
  },
  {
    key: 'price',
    label: 'Price',
    sortable: true,
    align: 'right' as const,
    render: (value: number) => (
      <span className="font-mono font-medium">
        ${(value || 0).toLocaleString()}
      </span>
    )
  },
  {
    key: 'stock_quantity',
    label: 'Stock',
    sortable: true,
    align: 'right' as const,
    render: (value: number) => {
      const level = value || 0
      const color = level > 20 ? 'text-green-600 dark:text-green-400' : 
                   level > 10 ? 'text-amber-600 dark:text-amber-400' : 
                   'text-red-600 dark:text-red-400'
      return <span className={cn("font-medium", color)}>{level} units</span>
    }
  },
  {
    key: 'status',
    label: 'Status',
    render: (value: string) => {
      const status = value || 'active'
      const config = {
        'active': { color: 'bg-green-500/20 text-green-600 dark:text-green-400', label: 'Active' },
        'inactive': { color: 'bg-gray-500/20 text-gray-600 dark:text-gray-400', label: 'Inactive' },
        'discontinued': { color: 'bg-red-500/20 text-red-600 dark:text-red-400', label: 'Discontinued' }
      }
      const statusConfig = config[status as keyof typeof config] || config.active
      return (
        <Badge variant="outline" className={statusConfig.color}>
          {statusConfig.label}
        </Badge>
      )
    }
  },
  {
    key: 'actions',
    label: 'Actions',
    align: 'center' as const,
    render: (_: any, row: any) => (
      <div className="flex gap-1 justify-center">
        <Link href={`/furniture/products/${row.id}`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-700">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
        <Link href={`/furniture/products/${row.id}/edit`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-700">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    )
  }
]

export default function FurnitureProductCatalog() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useFurnitureOrg()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])

  useEffect(() => {
    if (organizationId && !orgLoading) {
      loadProducts()
    }
  }, [organizationId, orgLoading])

  useEffect(() => {
    // Filter products based on search term
    if (searchTerm) {
      const filtered = products.filter(p => 
        p.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.entity_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.material?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [products, searchTerm])

  const loadProducts = async () => {
    try {
      setLoading(true)
      
      // Set organization context
      universalApi.setOrganizationId(organizationId)
      
      // Load all entities
      const { data: allEntities } = await universalApi.read({
        table: 'core_entities',
        organizationId: organizationId
      })
      
      // Filter for furniture products
      const productEntities = allEntities?.filter((e: any) => 
        e.entity_type === 'product' && 
        e.smart_code?.startsWith('HERA.FURNITURE.PRODUCT')
      ) || []

      // Load all dynamic data
      const { data: allDynamicData } = await universalApi.read({
        table: 'core_dynamic_data',
        organizationId: organizationId
      })

      // Enrich products with dynamic fields
      const enrichedProducts = productEntities.map((product: any) => {
        // Get dynamic fields for this product
        const productDynamicData = allDynamicData?.filter((d: any) => 
          d.entity_id === product.id
        ) || []

        // Transform dynamic data into object
        const dynamicFields = productDynamicData.reduce((acc: any, field: any) => {
          const value = field.field_value_text || 
                       field.field_value_number || 
                       field.field_value_boolean ||
                       (field.field_value_json ? JSON.parse(field.field_value_json) : null)
          if (value !== null) {
            acc[field.field_name] = value
          }
          return acc
        }, {})

        return {
          ...product,
          ...dynamicFields,
          category: dynamicFields.category || product.metadata?.category || 'uncategorized',
          sub_category: dynamicFields.sub_category || product.metadata?.sub_category
        }
      })

      setProducts(enrichedProducts)
      setFilteredProducts(enrichedProducts)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // Export functionality
    console.log('Exporting products...')
  }

  const stats = [
    { 
      label: 'Total Products', 
      value: products.length, 
      icon: Package,
      color: 'text-blue-500'
    },
    { 
      label: 'Active SKUs', 
      value: products.filter(p => p.status === 'active').length, 
      icon: BarChart,
      color: 'text-green-500'
    },
    { 
      label: 'Low Stock', 
      value: products.filter(p => (p.stock_quantity || 0) < 10).length, 
      icon: AlertCircle,
      color: 'text-amber-500'
    },
    { 
      label: 'Total Value', 
      value: `$${products.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.cost || 0)), 0).toLocaleString()}`, 
      icon: BarChart,
      color: 'text-purple-500'
    }
  ]

  // Show loading state while organization is loading
  if (orgLoading) {
    return <FurnitureOrgLoading />
  }

  // Three-layer authorization pattern for authenticated users
  if (isAuthenticated) {
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
          <Alert className="max-w-md bg-gray-800/50 border-gray-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to access the product catalog.
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    if (contextLoading) {
      return (
        <div className="min-h-screen bg-gray-900 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <FurniturePageHeader
          title="Product Catalog"
          subtitle="Manage furniture products, BOMs, and specifications"
          actions={
            <>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Link href="/furniture/products/catalog/import">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </Link>
              <Link href="/furniture/products/catalog/new">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </Link>
            </>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <stat.icon className={cn("h-8 w-8", stat.color)} />
              </div>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products by name, SKU, material, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
            <Button variant="outline" size="default" className="border-gray-600 hover:bg-gray-700">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </Card>

        {/* Products Table */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Products</h2>
          <EnterpriseDataTable
            columns={columns}
            data={filteredProducts}
            loading={loading}
            searchable={false} // We handle search above
            sortable
            selectable
            pageSize={20}
            emptyState={{
              icon: Package,
              title: "No products found",
              description: searchTerm 
                ? "Try adjusting your search term." 
                : "Start by adding your first furniture product to the catalog."
            }}
            className="bg-gray-800/50 border-gray-700"
          />
        </div>
      </div>
    </div>
  )
}