/**
 * Product Categories Management Page
 * Auto-generated using Universal Configuration Manager
 * Enterprise-grade UI for inventory configuration
 */

'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { UniversalConfigManager } from '@/src/components/universal-config/UniversalConfigManager'
import { CONFIG_TYPES } from '@/src/lib/universal-config/config-types'
import { useRouter } from 'next/navigation'
import { Badge } from '@/src/components/ui/badge'

export default function ProductCategoriesPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-6">
      <UniversalConfigManager
        config={CONFIG_TYPES.PRODUCT_CATEGORY}
        apiEndpoint="/api/v1/inventory/product-categories"
        additionalFields={[
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            defaultValue: ''
          },
          {
            name: 'color',
            label: 'Color',
            type: 'text',
            defaultValue: '#3B82F6'
          },
          {
            name: 'icon',
            label: 'Icon',
            type: 'text',
            defaultValue: 'Package'
          },
          {
            name: 'parent_category',
            label: 'Parent Category',
            type: 'text',
            defaultValue: ''
          },
          {
            name: 'sort_order',
            label: 'Sort Order',
            type: 'number',
            defaultValue: 0
          }
        ]}
        customColumns={[
          {
            key: 'products',
            header: 'Products',
            render: item => <Badge variant="outline">{item.product_count || 0} products</Badge>
          },
          {
            key: 'color',
            header: 'Color',
            render: item => (
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color || '#3B82F6' }}
                />
                <span className="text-sm">{item.color || '#3B82F6'}</span>
              </div>
            )
          }
        ]}
        onItemClick={item => {
          // Navigate to products filtered by this category
          router.push(`/inventory/products?category=${item.entity_code}`)
        }}
      />
    </div>
  )
}
