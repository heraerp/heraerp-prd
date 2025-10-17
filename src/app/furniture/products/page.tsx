'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  TrendingUp,
  DollarSign,
  Box,
  Tag
} from 'lucide-react'

interface Product {
  id: string
  sku: string
  name: string
  category: string
  price: number
  stock: number
  status: 'active' | 'inactive' | 'discontinued'
  description: string
}

const sampleProducts: Product[] = [
  {
    id: '1',
    sku: 'FUR-SOF-001',
    name: 'Premium Leather Sofa',
    category: 'Living Room',
    price: 1299.99,
    stock: 15,
    status: 'active',
    description: 'Luxurious 3-seater leather sofa with premium Italian leather'
  },
  {
    id: '2',
    sku: 'FUR-CHR-002',
    name: 'Executive Office Chair',
    category: 'Office',
    price: 549.99,
    stock: 8,
    status: 'active',
    description: 'Ergonomic office chair with lumbar support and adjustable height'
  },
  {
    id: '3',
    sku: 'FUR-TBL-003',
    name: 'Oak Dining Table',
    category: 'Dining Room',
    price: 899.99,
    stock: 5,
    status: 'active',
    description: 'Solid oak dining table seats 6 people comfortably'
  },
  {
    id: '4',
    sku: 'FUR-BED-004',
    name: 'King Size Bed Frame',
    category: 'Bedroom',
    price: 749.99,
    stock: 12,
    status: 'active',
    description: 'Modern upholstered king size bed frame with storage'
  },
  {
    id: '5',
    sku: 'FUR-WAR-005',
    name: 'Walk-in Wardrobe',
    category: 'Bedroom',
    price: 1899.99,
    stock: 3,
    status: 'inactive',
    description: 'Custom walk-in wardrobe with sliding doors and LED lighting'
  }
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(sampleProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    price: '',
    stock: '',
    status: 'active' as 'active' | 'inactive' | 'discontinued',
    description: ''
  })

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(products.map(p => p.category)))

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      category: '',
      price: '',
      stock: '',
      status: 'active',
      description: ''
    })
  }

  const handleCreate = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      sku: formData.sku,
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      status: formData.status,
      description: formData.description
    }
    setProducts([...products, newProduct])
    setIsCreateModalOpen(false)
    resetForm()
  }

  const handleEdit = () => {
    if (!selectedProduct) return
    
    const updatedProducts = products.map(p => 
      p.id === selectedProduct.id 
        ? {
            ...p,
            sku: formData.sku,
            name: formData.name,
            category: formData.category,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            status: formData.status,
            description: formData.description
          }
        : p
    )
    setProducts(updatedProducts)
    setIsEditModalOpen(false)
    setSelectedProduct(null)
    resetForm()
  }

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      status: product.status,
      description: product.description
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = () => {
    if (!productToDelete) return
    setProducts(products.filter(p => p.id !== productToDelete.id))
    setDeleteDialogOpen(false)
    setProductToDelete(null)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      inactive: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      discontinued: 'bg-red-500/20 text-red-400 border-red-500/30'
    }
    return variants[status as keyof typeof variants] || variants.active
  }

  const totalProducts = products.length
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  const lowStockCount = products.filter(p => p.stock < 10).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="jewelry-glass-panel min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="jewelry-crown-glow p-3 rounded-xl">
                <Package className="h-8 w-8 jewelry-text-gold" />
              </div>
              <div>
                <h1 className="text-3xl font-bold jewelry-text-luxury">Products Management</h1>
                <p className="jewelry-text-muted">Manage your furniture catalog and inventory</p>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="jewelry-glass-card p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm jewelry-text-muted">Total Products</p>
                    <p className="text-2xl font-bold jewelry-text-luxury">{totalProducts}</p>
                  </div>
                  <Box className="h-8 w-8 jewelry-text-gold" />
                </div>
              </div>

              <div className="jewelry-glass-card p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm jewelry-text-muted">Total Value</p>
                    <p className="text-2xl font-bold jewelry-text-luxury">${totalValue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 jewelry-text-gold" />
                </div>
              </div>

              <div className="jewelry-glass-card p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm jewelry-text-muted">Low Stock Items</p>
                    <p className="text-2xl font-bold jewelry-text-luxury">{lowStockCount}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 jewelry-text-gold" />
                </div>
              </div>

              <div className="jewelry-glass-card p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm jewelry-text-muted">Categories</p>
                    <p className="text-2xl font-bold jewelry-text-luxury">{categories.length}</p>
                  </div>
                  <Tag className="h-8 w-8 jewelry-text-gold" />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 jewelry-glass-input border-white/20 text-white placeholder-gray-400"
                  />
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48 jewelry-glass-input border-white/20 text-white">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-gray-600">
                    <SelectItem value="all" className="text-white hover:bg-white/10">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category} className="text-white hover:bg-white/10">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="jewelry-btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Products Table */}
          <div className="jewelry-glass-card rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white font-semibold">SKU</TableHead>
                  <TableHead className="text-white font-semibold">Product Name</TableHead>
                  <TableHead className="text-white font-semibold">Category</TableHead>
                  <TableHead className="text-white font-semibold">Price</TableHead>
                  <TableHead className="text-white font-semibold">Stock</TableHead>
                  <TableHead className="text-white font-semibold">Status</TableHead>
                  <TableHead className="text-white font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white font-mono">{product.sku}</TableCell>
                    <TableCell className="text-white font-medium">{product.name}</TableCell>
                    <TableCell className="text-gray-300">{product.category}</TableCell>
                    <TableCell className="text-white">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-white">{product.stock}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(product.status)}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black/90 border-gray-600">
                          <DropdownMenuItem 
                            onClick={() => openEditModal(product)}
                            className="text-white hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setProductToDelete(product)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No products found</p>
                <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={() => {
        setIsCreateModalOpen(false)
        setIsEditModalOpen(false)
        setSelectedProduct(null)
        resetForm()
      }}>
        <DialogContent className="max-w-2xl bg-black/95 border-gray-500 text-white">
          <DialogHeader className="relative pb-4 border-b border-gray-600">
            <DialogTitle className="text-white text-xl font-semibold">
              {isCreateModalOpen ? 'Add New Product' : 'Edit Product'}
            </DialogTitle>
            <button
              onClick={() => {
                setIsCreateModalOpen(false)
                setIsEditModalOpen(false)
                setSelectedProduct(null)
                resetForm()
              }}
              className="absolute right-0 top-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sku" className="text-white font-medium mb-2 block">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="bg-black/30 border-gray-500 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  placeholder="e.g., FUR-SOF-001"
                />
              </div>

              <div>
                <Label htmlFor="name" className="text-white font-medium mb-2 block">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-black/30 border-gray-500 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-white font-medium mb-2 block">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="bg-black/30 border-gray-500 text-white focus:border-yellow-500">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-gray-600">
                    <SelectItem value="Living Room" className="text-white hover:bg-white/10">Living Room</SelectItem>
                    <SelectItem value="Bedroom" className="text-white hover:bg-white/10">Bedroom</SelectItem>
                    <SelectItem value="Dining Room" className="text-white hover:bg-white/10">Dining Room</SelectItem>
                    <SelectItem value="Office" className="text-white hover:bg-white/10">Office</SelectItem>
                    <SelectItem value="Storage" className="text-white hover:bg-white/10">Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="price" className="text-white font-medium mb-2 block">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="bg-black/30 border-gray-500 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="stock" className="text-white font-medium mb-2 block">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  className="bg-black/30 border-gray-500 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-white font-medium mb-2 block">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'discontinued') => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-black/30 border-gray-500 text-white focus:border-yellow-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-gray-600">
                    <SelectItem value="active" className="text-white hover:bg-white/10">Active</SelectItem>
                    <SelectItem value="inactive" className="text-white hover:bg-white/10">Inactive</SelectItem>
                    <SelectItem value="discontinued" className="text-white hover:bg-white/10">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description" className="text-white font-medium mb-2 block">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-black/30 border-gray-500 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 min-h-[100px]"
                placeholder="Enter product description..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateModalOpen(false)
                setIsEditModalOpen(false)
                setSelectedProduct(null)
                resetForm()
              }}
              className="border-gray-500 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={isCreateModalOpen ? handleCreate : handleEdit}
              className="jewelry-btn-primary"
              disabled={!formData.name || !formData.sku || !formData.category || !formData.price || !formData.stock}
            >
              {isCreateModalOpen ? 'Create Product' : 'Update Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-black/95 border-gray-500 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-500 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}