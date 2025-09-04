/**
 * Product Brands Management Page
 * Manage product brands and manufacturers
 */

'use client'

import { UniversalConfigManager } from '@/components/universal-config/UniversalConfigManager'
import { CONFIG_TYPES } from '@/lib/universal-config/config-types'
import { Badge } from '@/components/ui/badge'
import { Globe, Star, Package } from 'lucide-react'

export default function BrandsPage() {
  return (
    <div className="container mx-auto p-6">
      <UniversalConfigManager
        config={CONFIG_TYPES.PRODUCT_BRAND}
        apiEndpoint="/api/v1/salon/brands"
        additionalFields={[
          {
            name: 'description',
            label: 'Brand Description',
            type: 'textarea',
            defaultValue: '',
            placeholder: 'Brief description of the brand and its specialties'
          },
          {
            name: 'website',
            label: 'Website',
            type: 'url',
            placeholder: 'https://brand.com',
            helpText: 'Brand official website'
          },
          {
            name: 'contact_person',
            label: 'Brand Representative',
            type: 'text',
            placeholder: 'Contact person name'
          },
          {
            name: 'phone',
            label: 'Phone Number',
            type: 'text',
            placeholder: '+1 (555) 123-4567'
          },
          {
            name: 'email',
            label: 'Email Address',
            type: 'email',
            placeholder: 'contact@brand.com'
          },
          {
            name: 'is_preferred',
            label: 'Preferred Brand',
            type: 'checkbox',
            defaultValue: false,
            helpText: 'Mark as preferred brand for recommendations'
          },
          {
            name: 'discount_percentage',
            label: 'Brand Discount %',
            type: 'number',
            defaultValue: 0,
            min: 0,
            max: 100,
            helpText: 'Standard discount percentage for this brand'
          },
          {
            name: 'quality_rating',
            label: 'Quality Rating',
            type: 'select',
            options: [
              { value: '5', label: '⭐⭐⭐⭐⭐ Premium' },
              { value: '4', label: '⭐⭐⭐⭐ High Quality' },
              { value: '3', label: '⭐⭐⭐ Standard' },
              { value: '2', label: '⭐⭐ Budget' },
              { value: '1', label: '⭐ Entry Level' }
            ],
            defaultValue: '3'
          },
          {
            name: 'country_of_origin',
            label: 'Country of Origin',
            type: 'text',
            placeholder: 'e.g., USA, France, Italy'
          },
          {
            name: 'certifications',
            label: 'Certifications',
            type: 'textarea',
            placeholder: 'e.g., Cruelty-Free, Organic, Vegan',
            helpText: 'List any certifications or quality standards'
          }
        ]}
        customColumns={[
          {
            key: 'quality',
            header: 'Quality',
            render: (item) => {
              const rating = parseInt(item.quality_rating || '3')
              return (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )
            }
          },
          {
            key: 'preferred',
            header: 'Status',
            render: (item) => (
              <div className="space-y-1">
                {item.is_preferred && (
                  <Badge className="text-xs">Preferred</Badge>
                )}
                {item.discount_percentage > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {item.discount_percentage}% Off
                  </Badge>
                )}
              </div>
            )
          },
          {
            key: 'products',
            header: 'Products',
            render: (item) => (
              <div className="flex items-center gap-1.5 text-sm">
                <Package className="w-3 h-3 text-muted-foreground" />
                <span>{item.salon_product_item_count || 0}</span>
              </div>
            )
          },
          {
            key: 'website',
            header: 'Website',
            render: (item) => (
              item.website ? (
                <a 
                  href={item.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Globe className="w-3 h-3" />
                  Visit
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )
            )
          }
        ]}
        showAnalytics={true}
        analyticsConfig={{
          title: 'Brand Analytics',
          metrics: [
            {
              label: 'Total Brands',
              value: (items) => items.length
            },
            {
              label: 'Preferred Brands',
              value: (items) => items.filter(item => item.is_preferred).length
            },
            {
              label: 'Premium Brands',
              value: (items) => items.filter(item => parseInt(item.quality_rating || '0') >= 4).length
            }
          ]
        }}
      />
    </div>
  )
}