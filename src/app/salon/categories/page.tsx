'use client'

import React, { useState } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useCategoriesPlaybook } from '@/hooks/useCategoriesPlaybook'
import { CategoryList } from '@/components/salon/categories/CategoryList'
import { CategoryCard } from '@/components/salon/categories/CategoryCard'
import { CategoryModal } from '@/components/salon/categories/CategoryModal'
import { DeleteCategoryDialog } from '@/components/salon/categories/DeleteCategoryDialog'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { Category } from '@/types/salon-category'
import { PageHeader, PageHeaderSearch, PageHeaderButton } from '@/components/universal/PageHeader'
import { 
  Plus, 
  Grid3X3, 
  List, 
  Tag,
  Search
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#B794F4',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

function SalonCategoriesPageContent() {
  const { organization } = useHERAAuth()
  const organizationId = organization?.id || ''
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch categories
  const {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    archiveCategory
  } = useCategoriesPlaybook({
    organizationId,
    includeArchived
  })

  // Filter categories by search
  const filteredCategories = categories.filter(category =>
    category.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.entity_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // CRUD handlers
  const handleSave = async (data: any) => {
    const loadingId = showLoading(
      editingCategory ? 'Updating category...' : 'Creating category...',
      'Please wait while we save your changes'
    )
    
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data)
        removeToast(loadingId)
        showSuccess('Category updated successfully', `${data.name} has been updated`)
      } else {
        await createCategory(data)
        removeToast(loadingId)
        showSuccess('Category created successfully', `${data.name} has been added`)
      }
      setModalOpen(false)
      setEditingCategory(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError(
        editingCategory ? 'Failed to update category' : 'Failed to create category',
        error.message || 'Please try again or contact support'
      )
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setModalOpen(true)
  }

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return

    setIsDeleting(true)
    const loadingId = showLoading(
      'Deleting category...',
      'This action cannot be undone'
    )
    
    try {
      await deleteCategory(categoryToDelete.id)
      removeToast(loadingId)
      showSuccess(
        'Category deleted',
        `${categoryToDelete.entity_name} has been permanently removed`
      )
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError(
        'Failed to delete category',
        error.message || 'Please try again'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleArchive = async (category: Category) => {
    const loadingId = showLoading(
      `${category.status === 'archived' ? 'Restoring' : 'Archiving'} category...`,
      'Please wait'
    )
    
    try {
      await archiveCategory(category.id, category.status !== 'archived')
      removeToast(loadingId)
      showSuccess(
        category.status === 'archived' ? 'Category restored' : 'Category archived',
        `${category.entity_name} has been ${category.status === 'archived' ? 'restored' : 'archived'}`
      )
    } catch (error: any) {
      removeToast(loadingId)
      showError(
        `Failed to ${category.status === 'archived' ? 'restore' : 'archive'} category`,
        error.message || 'Please try again'
      )
    }
  }

  const handleRestore = handleArchive

  // Calculate stats
  const activeCount = categories.filter(c => c.status === 'active').length
  const totalServices = categories.reduce((sum, cat) => sum + cat.service_count, 0)

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="h-full flex flex-col">
        {/* Background gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(212, 175, 55, 0.15), transparent 50%), radial-gradient(ellipse at bottom left, rgba(15, 111, 92, 0.1), transparent 50%)'
          }}
        />

        {/* Main Content */}
        <div
          className="relative flex-1 overflow-auto"
          style={{
            backgroundColor: COLORS.charcoal,
            minHeight: '100vh',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)'
          }}
        >
          <PageHeader
            title="Service Categories"
            breadcrumbs={[
              { label: 'HERA' },
              { label: 'SALON OS' },
              { label: 'Categories', isActive: true }
            ]}
            actions={
              <>
                <PageHeaderSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search categories..."
                />
                <PageHeaderButton
                  variant="primary"
                  icon={Plus}
                  onClick={() => {
                    setEditingCategory(null)
                    setModalOpen(true)
                  }}
                >
                  New Category
                </PageHeaderButton>
              </>
            }
          />

          {/* Error Banner */}
          {error && (
            <div
              className="mx-6 mt-4 text-sm px-3 py-2 rounded-lg border flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderColor: 'rgba(255, 0, 0, 0.3)',
                color: COLORS.lightText
              }}
            >
              <Tag className="h-4 w-4" style={{ color: '#FF6B6B' }} />
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="mx-6 mt-6 grid grid-cols-3 gap-4">
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.bronze}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Total Categories
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.champagne }}>
                {categories.length}
              </p>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.bronze}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Active Categories
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.emerald }}>
                {activeCount}
              </p>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.bronze}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Total Services
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.gold }}>
                {totalServices}
              </p>
            </div>
          </div>

          {/* Filters and View Options */}
          <div className="mx-6 mt-6 flex items-center justify-between">
            <Tabs value={includeArchived ? 'all' : 'active'} onValueChange={(v) => setIncludeArchived(v === 'all')}>
              <TabsList style={{ backgroundColor: COLORS.charcoalLight }}>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="all">All Categories</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gold/20' : 'hover:bg-white/10'}`}
                style={{ color: viewMode === 'grid' ? COLORS.gold : COLORS.lightText }}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gold/20' : 'hover:bg-white/10'}`}
                style={{ color: viewMode === 'list' ? COLORS.gold : COLORS.lightText }}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="mx-6 mt-6 mb-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Tag className="w-12 h-12 mx-auto mb-3 animate-pulse" style={{ color: COLORS.gold }} />
                  <p style={{ color: COLORS.lightText }}>Loading categories...</p>
                </div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: COLORS.gold }} />
                  <p className="text-lg mb-1" style={{ color: COLORS.champagne }}>
                    {searchQuery ? 'No categories found' : 'No categories yet'}
                  </p>
                  <p className="text-sm opacity-60 mb-4" style={{ color: COLORS.lightText }}>
                    {searchQuery ? 'Try adjusting your search' : 'Create your first category to organize services'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setModalOpen(true)}
                      className="px-4 py-2 rounded-lg font-medium transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                        color: COLORS.black
                      }}
                    >
                      Create Category
                    </button>
                  )}
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCategories.map(category => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                    onRestore={handleRestore}
                  />
                ))}
              </div>
            ) : (
              <CategoryList
                categories={filteredCategories}
                loading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onRestore={handleRestore}
              />
            )}
          </div>

          {/* Modals */}
          <CategoryModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setEditingCategory(null)
            }}
            category={editingCategory}
            onSave={handleSave}
          />

          <DeleteCategoryDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false)
              setCategoryToDelete(null)
            }}
            onConfirm={handleConfirmDelete}
            category={categoryToDelete}
            loading={isDeleting}
          />
        </div>
      </div>
    </div>
  )
}

export default function SalonCategoriesPage() {
  return (
    <StatusToastProvider>
      <SalonCategoriesPageContent />
    </StatusToastProvider>
  )
}