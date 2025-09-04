'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Palette, Hash, ArrowUp, ArrowDown, Loader2, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CategoryEntity {
  id: string
  entity_type: string
  entity_name: string
  entity_code: string
  organization_id: string
  created_at: string
  updated_at: string
  metadata?: any
  status?: string
  // Dynamic fields merged
  description?: string
  color_code?: string
  icon?: string
  sort_order?: number
  is_active?: boolean
  service_count?: number
}

interface CategoryAnalytics {
  total_categories: number
  active_categories: number
  total_services: number
  average_services_per_category: number
}

// Available colors for categories
const COLOR_OPTIONS = [
  { value: '#FF6B6B', label: 'Red', className: 'bg-red-500' },
  { value: '#4ECDC4', label: 'Teal', className: 'bg-teal-500' },
  { value: '#45B7D1', label: 'Blue', className: 'bg-blue-500' },
  { value: '#96CEB4', label: 'Green', className: 'bg-green-500' },
  { value: '#FECA57', label: 'Yellow', className: 'bg-yellow-500' },
  { value: '#DDA0DD', label: 'Plum', className: 'bg-purple-400' },
  { value: '#FFA07A', label: 'Coral', className: 'bg-orange-400' },
  { value: '#98D8C8', label: 'Mint', className: 'bg-emerald-400' },
  { value: '#F7B801', label: 'Amber', className: 'bg-amber-500' },
  { value: '#F18701', label: 'Orange', className: 'bg-orange-600' },
  { value: '#7FCDCD', label: 'Cyan', className: 'bg-cyan-400' },
  { value: '#FC4445', label: 'Crimson', className: 'bg-red-600' }
]

// Available icons for categories
const ICON_OPTIONS = [
  { value: 'scissors', label: 'Scissors', icon: '✂️' },
  { value: 'sparkles', label: 'Sparkles', icon: '✨' },
  { value: 'heart', label: 'Heart', icon: '❤️' },
  { value: 'star', label: 'Star', icon: '⭐' },
  { value: 'flower', label: 'Flower', icon: '🌸' },
  { value: 'palette', label: 'Palette', icon: '🎨' },
  { value: 'crown', label: 'Crown', icon: '👑' },
  { value: 'diamond', label: 'Diamond', icon: '💎' },
  { value: 'butterfly', label: 'Butterfly', icon: '🦋' },
  { value: 'rainbow', label: 'Rainbow', icon: '🌈' },
  { value: 'lips', label: 'Lips', icon: '💋' },
  { value: 'nails', label: 'Nails', icon: '💅' }
]

const API_BASE = '/api/v1/salon/categories'

// Default organization ID for development
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

export default function CategoriesPage() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
  
  const [categories, setCategories] = useState<CategoryEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryEntity | null>(null)
  const [analytics, setAnalytics] = useState<CategoryAnalytics | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    color_code: '#FF6B6B',
    icon: 'scissors',
    sort_order: '0',
    is_active: true
  })
  
  const { toast } = useToast()

  // Simple loading check
  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-8 w-8 mx-auto text-purple-600" />
          <p className="text-muted-foreground">Loading categories management...</p>
        </div>
      </div>
    )
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}?organization_id=${organizationId}`)
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      
      setCategories(data.categories || [])
      setAnalytics(data.analytics || null)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organizationId) {
      fetchCategories()
    }
  }, [organizationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const endpoint = selectedCategory 
        ? `${API_BASE}/${selectedCategory.id}`
        : API_BASE
      
      const response = await fetch(endpoint, {
        method: selectedCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organization_id: organizationId,
        }),
      })

      if (!response.ok) throw new Error('Failed to save category')

      toast({
        title: 'Success',
        description: `Category ${selectedCategory ? 'updated' : 'created'} successfully`,
      })

      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
      resetForm()
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      toast({
        title: 'Error',
        description: 'Failed to save category',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Services using this category will need to be updated.')) return

    try {
      const response = await fetch(`${API_BASE}/${categoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete category')
      }

      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      })

      fetchCategories()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      category_name: '',
      description: '',
      color_code: '#FF6B6B',
      icon: 'scissors',
      sort_order: '0',
      is_active: true
    })
    setSelectedCategory(null)
  }

  const filteredCategories = categories.filter(category => {
    return category.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  const getCategoryIcon = (iconValue?: string) => {
    const icon = ICON_OPTIONS.find(i => i.value === iconValue)
    return icon?.icon || '✂️'
  }

  const getCategoryStatus = (category: CategoryEntity) => {
    return category.metadata?.is_active !== false && category.is_active !== false
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/salon/services')}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Services
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Categories</h1>
            <p className="text-muted-foreground">
              Organize your services into categories for better management
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_categories}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.active_categories} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_services}</div>
              <p className="text-xs text-muted-foreground">
                Across all categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Services</CardTitle>
              <ArrowUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.average_services_per_category}</div>
              <p className="text-xs text-muted-foreground">
                Per category
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.total_categories > 0 
                  ? Math.round((analytics.active_categories / analytics.total_categories) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Categories in use
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Icon</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Services</TableHead>
                <TableHead className="text-center">Sort Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto text-purple-600" />
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: category.color_code || '#FF6B6B' }}
                      >
                        {getCategoryIcon(category.icon)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{category.entity_name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {category.service_count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {category.sort_order || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCategoryStatus(category) ? 'default' : 'secondary'}>
                        {getCategoryStatus(category) ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory(category)
                            setFormData({
                              category_name: category.entity_name,
                              description: category.description || '',
                              color_code: category.color_code || '#FF6B6B',
                              icon: category.icon || 'scissors',
                              sort_order: category.sort_order?.toString() || '0',
                              is_active: getCategoryStatus(category)
                            })
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          disabled={category.service_count && category.service_count > 0}
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

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory 
                ? 'Update the category details below' 
                : 'Create a new service category'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category_name">Category Name</Label>
              <Input
                id="category_name"
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                placeholder="e.g., Hair Services"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this category..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ICON_OPTIONS.slice(0, 6).map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: option.value })}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        formData.icon === option.value 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_OPTIONS.slice(0, 6).map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color_code: option.value })}
                      className={`h-10 rounded-lg border-2 transition-all ${
                        formData.color_code === option.value 
                          ? 'border-gray-900 scale-110' 
                          : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: option.value }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
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
              <Button type="submit">
                {selectedCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}