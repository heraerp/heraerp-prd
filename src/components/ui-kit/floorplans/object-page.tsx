/**
 * Object Page Floorplan
 * 
 * SAP Fiori Object Page pattern with glassmorphism design
 * For detailed entity view and editing with related data sections
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Edit, Trash2, ArrowLeft, MoreHorizontal, RefreshCw } from 'lucide-react'
import { DynamicPage, Section, LoadingSkeleton } from '../primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fadeSlide, staggerChildren } from '../design-tokens'

interface ObjectPageSection {
  id: string
  title: string
  content: React.ReactNode
  actions?: React.ReactNode
  collapsible?: boolean
  badge?: string | number
  icon?: React.ReactNode
}

interface ObjectPageProps<T> {
  title: string
  subtitle?: string
  entity: T | null
  loading?: boolean
  error?: string
  
  // Sections (tabs or accordion)
  sections: ObjectPageSection[]
  layout?: 'tabs' | 'accordion'
  
  // Actions
  onEdit?: (entity: T) => void
  onDelete?: (entity: T) => void
  onSave?: (entity: T, changes: Partial<T>) => void
  onRefresh?: () => void
  onBack?: () => void
  
  // Customization
  headerBadge?: React.ReactNode
  headerActions?: React.ReactNode
  isEditing?: boolean
  isSaving?: boolean
  className?: string
}

export function ObjectPage<T>({
  title,
  subtitle,
  entity,
  loading = false,
  error,
  sections,
  layout = 'tabs',
  onEdit,
  onDelete,
  onSave,
  onRefresh,
  onBack,
  headerBadge,
  headerActions,
  isEditing = false,
  isSaving = false,
  className = ""
}: ObjectPageProps<T>) {
  
  const [activeTab, setActiveTab] = React.useState(sections[0]?.id)
  
  // Loading state
  if (loading) {
    return (
      <DynamicPage title="Loading..." className={className}>
        <div className="space-y-6">
          <LoadingSkeleton lines={3} className="h-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <LoadingSkeleton lines={8} className="h-4" />
            <LoadingSkeleton lines={6} className="h-4" />
          </div>
        </div>
      </DynamicPage>
    )
  }

  // Error state
  if (error) {
    return (
      <DynamicPage title="Error" className={className}>
        <div className="text-center py-12">
          <p className="text-red-600">Error loading entity: {error}</p>
          {onRefresh && (
            <Button onClick={onRefresh} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </DynamicPage>
    )
  }

  // Not found state
  if (!entity) {
    return (
      <DynamicPage title="Not Found" className={className}>
        <div className="text-center py-12">
          <p className="text-gray-600">Entity not found</p>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </DynamicPage>
    )
  }

  return (
    <DynamicPage
      title={title}
      subtitle={subtitle}
      actions={
        <motion.div className="flex flex-wrap gap-2" {...fadeSlide(0.1)}>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          {headerActions}
          
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
          
          {isEditing ? (
            <>
              <Button 
                onClick={() => onSave?.(entity, {} as Partial<T>)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => {}}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              {onEdit && (
                <Button onClick={() => onEdit(entity)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="outline" 
                  onClick={() => onDelete(entity)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </>
          )}
        </motion.div>
      }
      headerExtras={
        headerBadge && (
          <motion.div {...fadeSlide(0.2)}>
            {headerBadge}
          </motion.div>
        )
      }
      className={className}
    >
      {layout === 'tabs' ? (
        <motion.div {...fadeSlide(0.3)}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-auto bg-white/50 backdrop-blur-sm">
              {sections.map((section) => (
                <TabsTrigger 
                  key={section.id} 
                  value={section.id}
                  className="flex items-center gap-2"
                >
                  {section.icon}
                  {section.title}
                  {section.badge && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {section.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {sections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="mt-6">
                <Section 
                  title={section.title}
                  actions={section.actions}
                  collapsible={section.collapsible}
                >
                  {section.content}
                </Section>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      ) : (
        <motion.div 
          className="space-y-6"
          {...staggerChildren}
        >
          {sections.map((section, index) => (
            <motion.div key={section.id} {...fadeSlide(index * 0.1)}>
              <Section 
                title={section.title}
                actions={section.actions}
                collapsible={section.collapsible}
              >
                {section.content}
              </Section>
            </motion.div>
          ))}
        </motion.div>
      )}
    </DynamicPage>
  )
}

// Form section helper for entity editing
export function FormSection({ 
  title, 
  children, 
  description,
  required = false,
  className = ""
}: {
  title: string
  children: React.ReactNode
  description?: string
  required?: boolean
  className?: string
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h4 className="text-lg font-medium flex items-center gap-2">
          {title}
          {required && <span className="text-red-500">*</span>}
        </h4>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  )
}

// Related data table section
export function RelatedDataSection({
  title,
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = "No related records found"
}: {
  title: string
  data: any[]
  columns: any[]
  onAdd?: () => void
  onEdit?: (item: any) => void
  onDelete?: (item: any) => void
  loading?: boolean
  emptyMessage?: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium">{title}</h4>
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add {title.slice(0, -1)} {/* Remove 's' from plural */}
          </Button>
        )}
      </div>
      
      {loading ? (
        <LoadingSkeleton lines={3} className="h-12" />
      ) : data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {columns.map((col, index) => (
                  <th key={index} className="text-left py-2 px-3 font-medium">
                    {col.header}
                  </th>
                ))}
                <th className="text-right py-2 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="py-2 px-3">
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-right">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => onDelete(item)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Pre-configured Object Page for HERA entities
export function HERAObjectPage<T extends { entity_id: string; entity_name: string; smart_code: string }>({
  entityId,
  entityType,
  useEntityHook,
  useMutationsHook,
  customSections = [],
  onBackToList,
  ...props
}: {
  entityId: string
  entityType: string
  useEntityHook: (id: string) => {
    data: T | null
    loading: boolean
    error: Error | null
    refetch: () => void
  }
  useMutationsHook: () => {
    updateEntity: (id: string, data: Partial<T>) => Promise<void>
    deleteEntity: (id: string) => Promise<void>
  }
  customSections?: ObjectPageSection[]
  onBackToList: () => void
} & Omit<ObjectPageProps<T>, 'entity' | 'loading' | 'error' | 'sections'>) {
  
  const { data: entity, loading, error, refetch } = useEntityHook(entityId)
  const { updateEntity, deleteEntity } = useMutationsHook()
  
  // Standard HERA sections
  const standardSections: ObjectPageSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      content: entity ? (
        <FormSection title="Basic Information">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <div className="text-lg font-semibold">{entity.entity_name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Smart Code</label>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
              {entity.smart_code}
            </code>
          </div>
        </FormSection>
      ) : null
    },
    ...customSections
  ]
  
  return (
    <ObjectPage
      {...props}
      title={entity?.entity_name || `${entityType} Details`}
      subtitle={`${entityType} • ${entityId}`}
      entity={entity}
      loading={loading}
      error={error?.message}
      sections={standardSections}
      onBack={onBackToList}
      onRefresh={refetch}
      onDelete={async (entity) => {
        if (confirm(`Are you sure you want to delete ${entity.entity_name}?`)) {
          await deleteEntity(entity.entity_id)
          onBackToList()
        }
      }}
      headerBadge={
        <Badge variant="outline">
          {entityType}
        </Badge>
      }
    />
  )
}