/**
 * Suppliers Management Page
 * Manage product suppliers and vendors
 */

'use client'

import { UniversalConfigManager } from '@/components/universal-config/UniversalConfigManager'
import { CONFIG_TYPES } from '@/lib/universal-config/config-types'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, Calendar, Package } from 'lucide-react'
import { CurrencyDisplay } from '@/components/ui/currency-input'

export default function SuppliersPage() {
  const paymentTerms = [
    { value: 'COD', label: 'Cash on Delivery' },
    { value: 'NET7', label: 'Net 7 Days' },
    { value: 'NET15', label: 'Net 15 Days' },
    { value: 'NET30', label: 'Net 30 Days' },
    { value: 'NET45', label: 'Net 45 Days' },
    { value: 'NET60', label: 'Net 60 Days' },
    { value: 'PREPAID', label: 'Prepaid' },
    { value: '2/10NET30', label: '2% 10 Days, Net 30' }
  ]

  const deliveryDays = [
    { value: '1', label: 'Next Day' },
    { value: '2-3', label: '2-3 Days' },
    { value: '3-5', label: '3-5 Days' },
    { value: '7', label: '1 Week' },
    { value: '14', label: '2 Weeks' },
    { value: '21', label: '3 Weeks' },
    { value: '30', label: '1 Month' }
  ]

  return (
    <div className="container mx-auto p-6">
      <UniversalConfigManager
        config={CONFIG_TYPES.INVENTORY_SUPPLIER}
        apiEndpoint="/api/v1/salon/inventory-suppliers"
        additionalFields={[
          // Contact Information
          {
            name: 'contact_name',
            label: 'Contact Person',
            type: 'text',
            required: true,
            placeholder: 'Primary contact name'
          },
          {
            name: 'phone',
            label: 'Phone Number',
            type: 'text',
            required: true,
            placeholder: '+1 (555) 123-4567'
          },
          {
            name: 'email',
            label: 'Email Address',
            type: 'email',
            required: true,
            placeholder: 'supplier@example.com'
          },
          {
            name: 'website',
            label: 'Website',
            type: 'url',
            placeholder: 'https://supplier.com',
            helpText: 'Supplier website or online catalog'
          },
          
          // Business Information
          {
            name: 'address',
            label: 'Business Address',
            type: 'textarea',
            defaultValue: '',
            placeholder: 'Full business address'
          },
          {
            name: 'tax_id',
            label: 'Tax ID / VAT Number',
            type: 'text',
            placeholder: 'Business tax identification'
          },
          {
            name: 'payment_terms',
            label: 'Payment Terms',
            type: 'select',
            options: paymentTerms,
            defaultValue: 'NET30',
            required: true
          },
          
          // Ordering Information
          {
            name: 'delivery_days',
            label: 'Typical Delivery Time',
            type: 'select',
            options: deliveryDays,
            defaultValue: '3-5',
            helpText: 'Average time from order to delivery'
          },
          {
            name: 'minimum_order',
            label: 'Minimum Order Amount',
            type: 'currency',
            defaultValue: 0,
            helpText: 'Minimum order value required'
          },
          {
            name: 'free_shipping_threshold',
            label: 'Free Shipping Threshold',
            type: 'currency',
            defaultValue: 0,
            helpText: 'Order amount for free shipping'
          },
          
          // Relationship Details
          {
            name: 'is_preferred',
            label: 'Preferred Supplier',
            type: 'checkbox',
            defaultValue: false,
            helpText: 'Mark as preferred vendor for auto-suggestions'
          },
          {
            name: 'discount_percentage',
            label: 'Volume Discount %',
            type: 'number',
            defaultValue: 0,
            min: 0,
            max: 100,
            helpText: 'Standard discount percentage offered'
          },
          {
            name: 'account_number',
            label: 'Account Number',
            type: 'text',
            placeholder: 'Your account # with supplier',
            helpText: 'Your customer account number'
          },
          {
            name: 'notes',
            label: 'Additional Notes',
            type: 'textarea',
            defaultValue: '',
            placeholder: 'Special instructions, contacts, or notes'
          }
        ]}
        customColumns={[
          {
            key: 'contact',
            header: 'Contact',
            render: (item) => (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span>{item.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{item.email || 'No email'}</span>
                </div>
              </div>
            )
          },
          {
            key: 'terms',
            header: 'Terms',
            render: (item) => (
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">
                  {paymentTerms.find(t => t.value === item.payment_terms)?.label || item.payment_terms || 'Not set'}
                </Badge>
                {item.minimum_order > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Min: <CurrencyDisplay value={item.minimum_order} />
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'delivery',
            header: 'Delivery',
            render: (item) => (
              <div className="flex items-center gap-1.5 text-sm">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span>{deliveryDays.find(d => d.value === item.delivery_days)?.label || item.delivery_days || 'Not set'}</span>
              </div>
            )
          },
          {
            key: 'relationship',
            header: 'Relationship',
            render: (item) => (
              <div className="space-y-1">
                {item.is_preferred && (
                  <Badge className="text-xs">Preferred</Badge>
                )}
                {item.discount_percentage > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {item.discount_percentage}% Discount
                  </Badge>
                )}
              </div>
            )
          },
          {
            key: 'products',
            header: 'Products',
            render: (item) => (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Package className="w-3 h-3" />
                <span>{item.salon_product_item_count || 0} products</span>
              </div>
            )
          }
        ]}
        showAnalytics={true}
        analyticsConfig={{
          title: 'Supplier Overview',
          metrics: [
            {
              label: 'Total Suppliers',
              value: (items) => items.length
            },
            {
              label: 'Preferred Suppliers',
              value: (items) => items.filter(item => item.is_preferred).length
            },
            {
              label: 'Active Suppliers',
              value: (items) => items.filter(item => item.is_active !== false).length
            }
          ]
        }}
      />
    </div>
  )
}