'use client'

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useMemo } from 'react'
import { EnterpriseDataTable } from '@/src/lib/dna/components/organisms/EnterpriseDataTable'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Plus, Search, Filter, Download, Upload, Package, BarChart, Edit, Eye, AlertCircle, CheckCircle, Sofa, Briefcase, Bed, Square, Grid3x3, Pencil, RefreshCw,
  Trash2
} from 'lucide-react'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { useFurnitureOrg, FurnitureOrgLoading } from '@/src/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/src/components/furniture/FurniturePageHeader'
import NewProductModal from '@/src/components/furniture/NewProductModal'
import EditProductModal from '@/src/components/furniture/EditProductModal'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'
import { useProductsData } from '@/src/lib/furniture/use-products-data'
import { ProductsPageSkeleton } from '@/src/components/furniture/ProductsPageSkeleton'
import { universalApi } from '@/src/lib/universal-api' // Category icons mapping
const categoryIcons = {
  office: Briefcase,
  seating: Sofa,
  tables: Square,
  storage: Grid3x3,
  beds: Bed
}

// Category colors mapping
const categoryColors = {
  office: 'bg-[var(--color-body)]/20 text-[var(--color-text-secondary)] border-[#6b6975]/50',
  seating: 'bg-[var(--color-body)]/20 text-[var(--color-text-secondary)] border-[#6b6975]/50',
  tables: 'bg-[var(--color-body)]/20 text-[var(--color-text-secondary)] border-[var(--color-accent-teal)]/50',
  storage: 'bg-[var(--color-body)]/20 text-[var(--color-text-secondary)] border-[var(--color-accent-teal)]/50',
  beds: 'bg-green-500/20 text-green-400 border-green-500/50'
}
export default function FurnitureProductCatalog() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()

const { organizationId, organizationName, orgLoading } = useFurnitureOrg()

const [searchTerm, setSearchTerm] = useState('')

const [editingProduct, setEditingProduct] = useState<any>(null)

const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

const [successMessage, setSuccessMessage] = useState<string | null>(null)

//   Use the optimized products data hook const { products, loading, error, refresh, filterProducts } = useProductsData(organizationId)
          // Column configuration for furniture products const columns = [ { key: 'entity_code', label: 'SKU', sortable: true, width: '120px', render: (value: string) => <span className="font-mono text-sm">{value}</span> }, { key: 'entity_name', label: 'Product Name', sortable: true, render: (value: string, row: any) => {
  const Icon =categoryIcons[row.category as keyof typeof categoryIcons] || Package return (
    <div className="bg-[var(--color-body)] flex items-center gap-2"> <Icon className="h-4 w-4 text-[#37353E]" /> <span className="font-medium">{value}</span>
      </div>
      )
    } }, { key: 'category', label: 'Category', sortable: true, render: (value: string) => { const colorClass = categoryColors[value as keyof typeof categoryColors] || 'bg-gray-9000/20 text-[var(--color-text-secondary)]' return (
    <Badge variant="outline" className={cn(
            'capitalize',
            colorClass
          )}>
          {value || 'uncategorized'} 
        </Badge>   ) }, { key: 'material', label: 'Material', sortable: true, render: (value: string) => <span className="capitalize">{value || '-'}</span> }, { key: 'dimensions', label: 'Dimensions (L×W×H)', render: (value: any, row: any) => ( <span className="text-sm font-mono"> {row.length_cm || 0}×{row.width_cm || 0}×{row.height_cm || 0}cm </span>   ), { key: 'price', label: 'Price', sortable: true, align: 'right' as const, render: (value: number) => ( <span className="font-mono font-medium">${(value || 0).toLocaleString()}</span>   ), { key: 'stock_quantity', label: 'Stock', sortable: true, align: 'right' as const, render: (value: number) => {
  const level =value || 0
  const color = level > 20 ? 'text-green-600 dark:text-green-400' : level > 10 ? 'text-[var(--color-accent-indigo)] dark:text-[var(--color-text-secondary)]' : 'text-red-600 dark:text-red-400' return <span className={cn(
            'font-medium',
            color
          )}>{level} units</span> } }, { key: 'status', label: 'Status', render: (value: string) => {
  const status =value || 'active' const config = { active: { color: 'bg-green-500/20 text-green-600 dark:text-green-400', label: 'Active' }, inactive: { color: 'bg-gray-9000/20 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]', label: 'Inactive' }, discontinued: { color: 'bg-red-500/20 text-red-600 dark:text-red-400', label: 'Discontinued' } }
  const statusConfig = config[status as keyof typeof config] || config.active return (
    <Badge variant="outline" className={statusConfig.color}>
          {statusConfig.label} 
        </Badge>   ) }, { key: 'actions', label: 'Actions', align: 'center' as const, render: (_: any, row: any) => ( <div className="bg-[var(--color-body)] flex gap-1 justify-center"> <Link href={`/furniture/products/${row.id}`}> <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[var(--color-sidebar)]/30" title="View" > <Eye className="h-4 w-4" /> </Button> </Link> <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[var(--color-sidebar)]/30" title="Edit" onClick={() => setEditingProduct(row)}
        > <Pencil className="h-4 w-4" /> </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-700 text-red-400" title="Delete" onClick={() => handleDelete(row.id)} disabled={deletingProductId === row.id} > {deletingProductId === row.id ? (
            <div className="bg-[var(--color-body)] animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" /> )
          : (
            <Trash2 className="h-4 w-4" /> )} </Button>
      </div>
      )
    } ] // Memoize filtered products to avoid recalculation
  const filteredProducts =useMemo(() => { return filterProducts(searchTerm  ), [products, searchTerm, filterProducts])
  const handleDelete = async (productId: string) => { if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
  return } setDeletingProductId(productId) try { universalApi.setOrganizationId(organizationId)

const result = await universalApi.deleteEntity(productId)
        if (result.success) {
  refresh() setSuccessMessage('Product deleted successfully') setTimeout(() => setSuccessMessage(null), 3000  ) else { throw new Error(result.error || 'Failed to delete product'  ) } catch (error) {
  console.error('Error deleting product:', error) alert('Failed to delete product. Please try again.'  ) finally { setDeletingProductId(null  ) }

const handleExport = () => { // Export functionality console.log('Exporting products...'  )

const stats = [ { label: 'Total Products', value: products.length, icon: Package, color: 'text-[var(--color-text-primary)]' }, { label: 'Active SKUs', value: products.filter(p => p.status === 'active').length, icon: BarChart, color: 'text-green-500' }, { label: 'Low Stock', value: products.filter(p => (p.stock_quantity || 0) < 10).length, icon: AlertCircle, color: 'text-[var(--color-text-primary)]' }, { label: 'Total Value', value: `$${products.reduce((sum, p) => sum + (p.stock_quantity || 0) * (p.cost || 0), 0).toLocaleString()}`, icon: BarChart, color: 'text-[var(--color-text-primary)]' } ] // Show loading state while organization is loading if (orgLoading) {
  return <FurnitureOrgLoading /> }
  // Show skeleton while data is loading if (loading && products.length === 0) {
  return (
    <div className="min-h-screen bg-[var(--color-body)]"> <div className="p-6"> <ProductsPageSkeleton /> </div>
      </div>
      )
    }
  // Show error state if (error) {
  return (
    <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center"> <div className="text-center"> <p className="text-red-400 mb-4">Error loading products: {error}</p> <Button onClick={refresh} variant="outline" className="gap-2 hover:bg-[var(--color-hover)]"> <RefreshCw className="h-4 w-4" /> Retry </Button> </div>
      </div>
      )
    }
  // Three-layer authorization pattern for authenticated users if (isAuthenticated) {
  if (!isAuthenticated) {
  return (
    <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center p-6"> <Alert className="max-w-md bg-[var(--color-body)]/50 border-[var(--color-border)]"> <AlertCircle className="h-4 w-4" /> <AlertDescription>Please log in to access the product catalog.</AlertDescription> </Alert>
      </div>
      )
    } if (contextLoading) {
  return (
    <div className="min-h-screen bg-[var(--color-body)]"> <div className="p-6"> <ProductsPageSkeleton /> </div>
      </div>
      )
    } }

  return (
    <div className="min-h-screen bg-[var(--color-body)]"> <div className="p-6 space-y-6"> {/* Success Message */} {successMessage && ( <Alert className="bg-green-900/20 border-green-800 text-green-400"> <CheckCircle className="h-4 w-4" /> <AlertDescription>{successMessage}</AlertDescription>
      </Alert>
    )} 
        {/* Header  */}
        <FurniturePageHeader title="Product Catalog" subtitle="Manage furniture products, BOMs, and specifications" actions={ <> <Button onClick={refresh} variant="ghost" size="icon" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
          disabled={loading} > <RefreshCw className={cn(
            'h-4 w-4',
            loading && 'animate-spin'
          )} /> </Button>
        <Button variant="outline" size="sm" onClick={handleExport}
        > <Download className="h-4 w-4 mr-2" /> Export </Button> <Link href="/furniture/products/catalog/import"> <Button variant="outline" size="sm"> <Upload className="h-4 w-4 mr-2" /> Import </Button> </Link> <NewProductModal organizationId={organizationId} organizationName={organizationName} onProductCreated={productId => {
          console.log('New product created:', productId)
          // Refresh the product list refresh() setSuccessMessage('Product created successfully') setTimeout(() => setSuccessMessage(null), 3000  )
    } /> </> } /> 
        {/* Stats Cards  */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4"> {stats.map((stat, index) => ( <Card key={index} className="p-4 bg-[var(--color-body)]/50 border-[var(--color-border)] hover:bg-[var(--color-body)]/70 transition-colors" > <div className="flex items-center justify-between"> <div> <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p> <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</p> </div> <stat.icon className={cn(
            'h-8 w-8',
            stat.color
          )} /> </div>
      </Card>
    ))} </div> 
        {/* Search and Filters  */}
        <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 bg-[var(--color-body)]/50 border-[var(--color-border)]"> <div className="flex gap-4"> <div className="relative flex-1"> <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" /> <Input placeholder="Search products by name, SKU, material, or category..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-[var(--color-body)]/50 border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]" /> </div> <Button variant="outline" size="default" className="border-[var(--color-border)] hover:bg-[var(--color-sidebar)]/30" > <Filter className="h-4 w-4 mr-2" /> Filters </Button> </div> </Card> 
        {/* Products Table  */}
        <div className="space-y-4"> <h2 className="bg-[var(--color-body)] text-xl font-semibold text-[var(--color-text-primary)]">Products</h2> <EnterpriseDataTable columns={columns} data={filteredProducts} loading={loading} searchable={false
        } // We handle search above sortable selectable pageSize={20} emptyState={{ icon: Package, title: 'No products found', description: searchTerm ? 'Try adjusting your search term.' : 'Start by adding your first furniture product to the catalog.' }
    } className="bg-[var(--color-body)]/50 border-[var(--color-border)]" /> </div> {/* Edit Product Modal */} {editingProduct && ( <EditProductModal open={!!editingProduct} onClose={() => setEditingProduct(null)} product={editingProduct} organizationId={organizationId} onSuccess={() => { refresh() setEditingProduct(null) setSuccessMessage('Product updated successfully') setTimeout(() => setSuccessMessage(null), 3000  )
    } /> )} </div>
      </div>
      )
}