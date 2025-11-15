/**
 * HERA DNA UI - Entity Card with Glassmorphism
 * Smart Code: HERA.DNA.UI.ENTITY.CARD.GLASS.V1
 *
 * Reusable entity card component with modern glassmorphism design
 * Links with useReadEntities and useGetDynamicFields hooks
 */

'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { BadgeDNA } from './BadgeDNA'
import { LucideIcon } from 'lucide-react'

interface EntityCardGlassProps {
  entity: {
    id: string
    entity_type: string
    entity_name: string
    entity_code?: string
    metadata?: any
    created_at?: string
    smart_code?: string
  }
  dynamicFields?: Record<string, any>
  icon?: LucideIcon
  actions?: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

export function EntityCardGlass({
  entity,
  dynamicFields = {},
  icon: Icon,
  actions,
  onClick,
  className,
  variant = 'default'
}: EntityCardGlassProps) {
  // Glassmorphism styles based on variant
  const variantStyles = {
    default:
      'bg-white/80 dark:bg-gray-900/80 border-gray-200/50 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-900/90',
    primary:
      'bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20 hover:from-violet-500/20 hover:to-purple-500/20',
    success:
      'bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20 hover:from-emerald-500/20 hover:to-green-500/20',
    warning:
      'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/20',
    danger:
      'bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20 hover:from-red-500/20 hover:to-rose-500/20'
  }

  // Get status from metadata or relationships
  const status = entity.metadata?.status || dynamicFields.status || 'active'
  const statusVariant =
    status === 'active'
      ? 'success'
      : status === 'pending'
        ? 'warning'
        : status === 'inactive'
          ? 'secondary'
          : 'default'

  return (
    <div
      className={cn(
        // Base classes
        'relative overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-300',
        // Variant styles
        variantStyles[variant],
        // Shadow and hover effects
        'shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10',
        // Cursor
        onClick && 'cursor-pointer',
        // Custom classes
        className
      )}
      onClick={onClick}
    >
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            {Icon && (
              <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm">
                <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            )}

            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {entity.entity_name}
              </h3>

              {entity.entity_code && (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {entity.entity_code}
                </p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <BadgeDNA variant={statusVariant}>{status}</BadgeDNA>

                <BadgeDNA variant="secondary" className="text-xs">
                  {entity.entity_type}
                </BadgeDNA>
              </div>
            </div>
          </div>

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {/* Dynamic Fields Display */}
        {Object.keys(dynamicFields).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(dynamicFields)
                .slice(0, 4)
                .map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {value?.toString() || '-'}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Metadata Preview */}
        {entity.metadata && (
          <div className="mt-4 flex flex-wrap gap-2">
            {entity.metadata.tags?.map((tag: string) => (
              <BadgeDNA key={tag} variant="secondary" className="text-xs">
                {tag}
              </BadgeDNA>
            ))}
          </div>
        )}

        {/* Smart Code Footer */}
        {entity.smart_code && (
          <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
              {entity.smart_code}
            </p>
          </div>
        )}
      </div>

      {/* Decorative gradient orb */}
      <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 blur-3xl" />
    </div>
  )
}

/**
 * Usage Example:
 *
 * import { EntityCardGlass } from '@/lib/dna/components/ui/EntityCardGlass'
 * import { useReadEntities, useGetDynamicFields } from '@/lib/dna/hooks/hera-dna-hook-registry'
 *
 * function CustomerList() {
 *   const readEntities = useReadEntities()
 *   const getDynamicFields = useGetDynamicFields()
 *   const [customers, setCustomers] = useState([])
 *   const [customerFields, setCustomerFields] = useState({})
 *
 *   useEffect(() => {
 *     const loadCustomers = async () => {
 *       const result = await readEntities({ entity_type: 'customer' })
 *       if (result.data) {
 *         setCustomers(result.data)
 *
 *         // Load dynamic fields for each customer
 *         for (const customer of result.data) {
 *           const fields = await getDynamicFields(customer.id)
 *           if (fields.data) {
 *             setCustomerFields(prev => ({
 *               ...prev,
 *               [customer.id]: fields.data
 *             }))
 *           }
 *         }
 *       }
 *     }
 *     loadCustomers()
 *   }, [])
 *
 *   return (
 *     <div className="grid gap-4">
 *       {customers.map(customer => (
 *         <EntityCardGlass
 *           key={customer.id}
 *           entity={customer}
 *           dynamicFields={customerFields[customer.id]}
 *           icon={User}
 *           variant="primary"
 *           onClick={() => router.push(`/customers/${customer.id}`)}
 *           actions={
 *             <>
 *               <GhostButtonDNA icon={Edit} size="sm" />
 *               <GhostButtonDNA icon={Phone} size="sm" />
 *             </>
 *           }
 *         />
 *       ))}
 *     </div>
 *   )
 * }
 */
