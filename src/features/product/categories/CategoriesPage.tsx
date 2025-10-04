'use client'

import React, { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useHeraProductCategories } from '@/hooks/useHeraProductCategories'
import {
  ProductCategory,
  ProductCategoryFormValues,
  ProductCategoryFormSchema
} from '@/types/salon-product-category'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { PageHeader, PageHeaderButton, PageHeaderSearch } from '@/components/universal/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Plus,
  Package,
  Edit,
  Archive,
  ArchiveRestore,
  Trash2,
  Tag,
  Sparkles,
  Diamond,
  ShoppingBag,
  Palette,
  Feather,
  Flame,
  Heart,
  Crown
} from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const DEFAULT_COLOR = '#D4AF37'
const DEFAULT_ICON = 'Tag'

const ICON_OPTIONS = [
  'Tag',
  'Package',
  'Sparkles',
  'Diamond',
  'ShoppingBag',
  'Palette',
  'Feather',
  'Flame',
  'Heart',
  'Crown'
] as const

const ICON_COMPONENTS: Record<(typeof ICON_OPTIONS)[number], React.ComponentType<any>> = {
  Tag,
  Package,
  Sparkles,
  Diamond,
  ShoppingBag,
  Palette,
  Feather,
  Flame,
  Heart,
  Crown
}

function useResolvedOrganizationId(): string | undefined {
  const { organization } = useHERAAuth()

  try {
    const salonContext = useSecuredSalonContext()
    if (salonContext?.organizationId) {
      return salonContext.organizationId
    }
  } catch {
    // ignore missing salon context
  }

  return organization?.id || undefined
}

function ProductCategoryDialog({
  open,
  onClose,
  onSubmit,
  initialCategory,
  isSubmitting
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: ProductCategoryFormValues) => Promise<void>
  initialCategory: ProductCategory | null
  isSubmitting: boolean
}) {
  const form = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(ProductCategoryFormSchema),
    defaultValues: {
      name: initialCategory?.entity_name || '',
      code: initialCategory?.entity_code || undefined,
      description: initialCategory?.description || undefined,
      color: initialCategory?.color || DEFAULT_COLOR,
      icon: initialCategory?.icon || DEFAULT_ICON,
      sort_order: initialCategory?.sort_order ?? 0
    }
  })

  React.useEffect(() => {
    form.reset({
      name: initialCategory?.entity_name || '',
      code: initialCategory?.entity_code || undefined,
      description: initialCategory?.description || undefined,
      color: initialCategory?.color || DEFAULT_COLOR,
      icon: initialCategory?.icon || DEFAULT_ICON,
      sort_order: initialCategory?.sort_order ?? 0
    })
  }, [initialCategory, form, open])

  const handleSubmit = async (values: ProductCategoryFormValues) => {
    await onSubmit({
      ...values,
      sort_order: Number.isFinite(values.sort_order) ? values.sort_order : 0
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {initialCategory ? 'Edit Product Category' : 'Create Product Category'}
          </DialogTitle>
          <DialogDescription>
            Configure how retail categories appear across the production salon experience.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category name</FormLabel>
                    <FormControl>
                      <Input placeholder="Shampoo & Treatments" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category code</FormLabel>
                    <FormControl>
                      <Input placeholder="CAT-HAIR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accent color</FormLabel>
                    <FormControl>
                      <Input type="color" className="h-10 w-20 p-1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ICON_OPTIONS.map(icon => {
                          const IconComponent = ICON_COMPONENTS[icon] || Tag
                          return (
                            <SelectItem key={icon} value={icon}>
                              <span className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {icon}
                              </span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={9999}
                        value={field.value ?? 0}
                        onChange={event => field.onChange(Number(event.target.value ?? 0))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Retail hair-care collection with professional grade treatment serums"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialCategory ? 'Save changes' : 'Create category'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function CategoriesPageContent() {
  const organizationId = useResolvedOrganizationId()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null)

  const {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    archiveCategory,
    isCreating,
    isUpdating,
    isDeleting,
    isArchiving
  } = useHeraProductCategories({ organizationId, includeArchived })

  const filteredCategories = useMemo(() => {
    if (!categories) return []
    if (!searchQuery) return categories

    const query = searchQuery.toLowerCase()
    return categories.filter(category => {
      const matchesName = category.entity_name.toLowerCase().includes(query)
      const matchesCode = category.entity_code?.toLowerCase().includes(query)
      const matchesDescription = category.description?.toLowerCase().includes(query)
      return matchesName || matchesCode || matchesDescription
    })
  }, [categories, searchQuery])

  const handleCreate = () => {
    setEditingCategory(null)
    setModalOpen(true)
  }

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category)
    setModalOpen(true)
  }

  const handleArchiveToggle = async (category: ProductCategory) => {
    const willArchive = category.status !== 'archived'
    const toastId = showLoading(
      willArchive ? 'Archiving category...' : 'Restoring category...',
      'Applying changes'
    )

    try {
      await archiveCategory(category, willArchive)
      showSuccess(
        willArchive ? 'Category archived' : 'Category restored',
        `${category.entity_name} is now ${willArchive ? 'archived' : 'active'}`
      )
    } catch (archiveError: any) {
      showError('Failed to update category', archiveError?.message || 'Please try again')
    } finally {
      removeToast(toastId)
    }
  }

  const handleDeleteRequest = (category: ProductCategory) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    const toastId = showLoading('Deleting category...', 'This cannot be undone')
    try {
      await deleteCategory(categoryToDelete.id)
      showSuccess('Category deleted', `${categoryToDelete.entity_name} has been removed`)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (deleteError: any) {
      showError('Failed to delete category', deleteError?.message || 'Please try again')
    } finally {
      removeToast(toastId)
    }
  }

  const handleModalSubmit = async (values: ProductCategoryFormValues) => {
    const action = editingCategory ? 'Updating category...' : 'Creating category...'
    const toastId = showLoading(action, 'Please wait while we persist changes')

    try {
      if (editingCategory) {
        await updateCategory(editingCategory, values)
        showSuccess('Category updated', `${values.name} has been updated successfully`)
      } else {
        await createCategory(values)
        showSuccess('Category created', `${values.name} is live for POS & inventory flows`)
      }
      setModalOpen(false)
      setEditingCategory(null)
    } catch (saveError: any) {
      showError('Failed to save category', saveError?.message || 'Please try again')
    } finally {
      removeToast(toastId)
    }
  }

  React.useEffect(() => {
    if (error) {
      showError('Unable to load categories', error)
    }
  }, [error, showError])

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="px-6 py-8">
        <PageHeader
          icon={<Package className="h-6 w-6" />}
          title="Product Categories"
          description="Managed retail & professional groupings connected to universal inventory DNA."
        >
          <PageHeaderButton icon={<Plus className="h-4 w-4" />} onClick={handleCreate}>
            New category
          </PageHeaderButton>
        </PageHeader>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <PageHeaderSearch
            placeholder="Search categories"
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <div className="flex items-center gap-3">
            <Switch
              checked={includeArchived}
              onCheckedChange={setIncludeArchived}
              id="include-archived-switch"
            />
            <label htmlFor="include-archived-switch" className="text-sm text-slate-300">
              Show archived
            </label>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-400">Overview</p>
                <h3 className="text-xl font-semibold text-slate-50">
                  {filteredCategories.length} category{filteredCategories.length === 1 ? '' : 'ies'}
                </h3>
              </div>
              {(isLoading || isCreating || isUpdating || isDeleting || isArchiving) && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px] text-slate-300">Category</TableHead>
                  <TableHead className="text-slate-300">Code</TableHead>
                  <TableHead className="text-slate-300">Sort</TableHead>
                  <TableHead className="text-slate-300">Products</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Updated</TableHead>
                  <TableHead className="text-right text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map(category => {
                  const iconKey = (category.icon as (typeof ICON_OPTIONS)[number]) || 'Tag'
                  const IconComponent = ICON_COMPONENTS[iconKey] || Tag

                  return (
                    <TableRow key={category.id} className="border-slate-800/60">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-10 w-10 items-center justify-center rounded-lg border"
                            style={{
                              borderColor: (category.color || DEFAULT_COLOR) + '40',
                              backgroundColor: (category.color || DEFAULT_COLOR) + '14'
                            }}
                          >
                            <IconComponent
                              className="h-4 w-4"
                              style={{ color: category.color || DEFAULT_COLOR }}
                            />
                          </span>
                          <div>
                            <p className="font-medium text-slate-100">{category.entity_name}</p>
                            {category.description && (
                              <p className="text-sm text-slate-400">{category.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {category.entity_code || '—'}
                      </TableCell>
                      <TableCell className="text-slate-300">{category.sort_order}</TableCell>
                      <TableCell className="text-slate-300">
                        {category.product_count ?? 0}
                      </TableCell>
                      <TableCell>
                        {category.status === 'archived' ? (
                          <Badge variant="outline" className="border-slate-700 text-slate-400">
                            Archived
                          </Badge>
                        ) : (
                          <Badge
                            style={{ backgroundColor: (category.color || DEFAULT_COLOR) + '20' }}
                          >
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {category.updated_at
                          ? formatDistanceToNow(new Date(category.updated_at), { addSuffix: true })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                            className="text-slate-300 hover:text-slate-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleArchiveToggle(category)}
                            className="text-slate-300 hover:text-slate-100"
                            disabled={isArchiving}
                          >
                            {category.status === 'archived' ? (
                              <ArchiveRestore className="h-4 w-4" />
                            ) : (
                              <Archive className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRequest(category)}
                            className="text-red-300 hover:text-red-200"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {!isLoading && filteredCategories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center text-slate-400">
                      No categories match your filters yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <ProductCategoryDialog
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingCategory(null)
        }}
        onSubmit={handleModalSubmit}
        initialCategory={editingCategory}
        isSubmitting={isCreating || isUpdating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {categoryToDelete?.entity_name}. Products using this
              category retain historical references but new POS & inventory flows need reassignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500 focus:ring-red-500"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <StatusToastProvider>
      <CategoriesPageContent />
    </StatusToastProvider>
  )
}
