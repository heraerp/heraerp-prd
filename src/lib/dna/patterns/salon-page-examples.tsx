/**
 * HERA DNA Pattern: Salon Page Examples
 *
 * Example implementations of common salon pages using the Luxe CRUD pattern
 */

import { Package, Users, Calendar, CreditCard, Scissors, Gift, ShoppingBag } from 'lucide-react'
import { SalonLuxeCRUDPage } from './salon-luxe-crud-pattern'
import { SalonLuxeCard } from './salon-luxe-card'

// Example 1: Products Page
export function SalonProductsPage() {
  const PRODUCT_PRESET = {
    smart_code: 'HERA.SALON.PRODUCT.ENTITY.ITEM.V1',
    dynamicFields: [
      { field_name: 'name', field_type: 'text', smart_code: 'HERA.SALON.PRODUCT.DYN.NAME.V1' },
      { field_name: 'code', field_type: 'text', smart_code: 'HERA.SALON.PRODUCT.DYN.CODE.V1' },
      {
        field_name: 'description',
        field_type: 'text',
        smart_code: 'HERA.SALON.PRODUCT.DYN.DESCRIPTION.V1'
      },
      {
        field_name: 'category',
        field_type: 'text',
        smart_code: 'HERA.SALON.PRODUCT.DYN.CATEGORY.V1'
      },
      { field_name: 'brand', field_type: 'text', smart_code: 'HERA.SALON.PRODUCT.DYN.BRAND.V1' },
      { field_name: 'price', field_type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.V1' },
      { field_name: 'cost', field_type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.COST.V1' },
      {
        field_name: 'stock_quantity',
        field_type: 'number',
        smart_code: 'HERA.SALON.PRODUCT.DYN.STOCK.V1'
      },
      {
        field_name: 'barcode',
        field_type: 'text',
        smart_code: 'HERA.SALON.PRODUCT.DYN.BARCODE.V1'
      },
      { field_name: 'status', field_type: 'text', smart_code: 'HERA.SALON.PRODUCT.DYN.STATUS.V1' }
    ]
  }

  return (
    <SalonLuxeCRUDPage
      title="Products"
      description="Manage your salon retail products and inventory"
      entityType="PRODUCT"
      preset={PRODUCT_PRESET}
      icon={Package}
      searchPlaceholder="Search products by name, code, brand, or barcode..."
      renderCard={(product, handlers) => (
        <SalonLuxeCard
          title={product.dynamic_fields?.name?.value || product.entity_name}
          subtitle={product.dynamic_fields?.brand?.value}
          description={product.dynamic_fields?.description?.value}
          code={product.dynamic_fields?.code?.value}
          icon={Package}
          status={product.dynamic_fields?.status?.value || 'active'}
          badges={[
            { label: 'Price', value: `$${product.dynamic_fields?.price?.value || 0}` },
            { label: 'Stock', value: product.dynamic_fields?.stock_quantity?.value || 0 }
          ]}
          onEdit={handlers.onEdit}
          onArchive={handlers.onArchive}
          canEdit={handlers.canEdit}
          canDelete={handlers.canDelete}
          createdAt={product.created_at}
          updatedAt={product.updated_at}
        />
      )}
    />
  )
}

// Example 2: Services Page
export function SalonServicesPage() {
  const SERVICE_PRESET = {
    smart_code: 'HERA.SALON.SERVICE.ENTITY.ITEM.V1',
    dynamicFields: [
      { field_name: 'name', field_type: 'text', smart_code: 'HERA.SALON.SERVICE.DYN.NAME.V1' },
      { field_name: 'code', field_type: 'text', smart_code: 'HERA.SALON.SERVICE.DYN.CODE.V1' },
      {
        field_name: 'description',
        field_type: 'text',
        smart_code: 'HERA.SALON.SERVICE.DYN.DESCRIPTION.V1'
      },
      {
        field_name: 'category',
        field_type: 'text',
        smart_code: 'HERA.SALON.SERVICE.DYN.CATEGORY.V1'
      },
      {
        field_name: 'duration_minutes',
        field_type: 'number',
        smart_code: 'HERA.SALON.SERVICE.DYN.DURATION.V1'
      },
      { field_name: 'price', field_type: 'number', smart_code: 'HERA.SALON.SERVICE.DYN.PRICE.V1' },
      {
        field_name: 'commission_rate',
        field_type: 'number',
        smart_code: 'HERA.SALON.SERVICE.DYN.COMMISSION.V1'
      },
      {
        field_name: 'requires_consultation',
        field_type: 'boolean',
        smart_code: 'HERA.SALON.SERVICE.DYN.CONSULTATION.V1'
      },
      { field_name: 'status', field_type: 'text', smart_code: 'HERA.SALON.SERVICE.DYN.STATUS.V1' }
    ]
  }

  return (
    <SalonLuxeCRUDPage
      title="Services"
      description="Manage your salon service menu and pricing"
      entityType="SERVICE"
      preset={SERVICE_PRESET}
      icon={Scissors}
      searchPlaceholder="Search services by name, category, or description..."
      renderCard={(service, handlers) => (
        <SalonLuxeCard
          title={service.dynamic_fields?.name?.value || service.entity_name}
          subtitle={service.dynamic_fields?.category?.value}
          description={service.dynamic_fields?.description?.value}
          code={service.dynamic_fields?.code?.value}
          icon={Scissors}
          status={service.dynamic_fields?.status?.value || 'active'}
          badges={[
            { label: 'Price', value: `$${service.dynamic_fields?.price?.value || 0}` },
            {
              label: 'Duration',
              value: `${service.dynamic_fields?.duration_minutes?.value || 0} min`
            },
            {
              label: 'Commission',
              value: `${service.dynamic_fields?.commission_rate?.value || 0}%`
            }
          ]}
          onEdit={handlers.onEdit}
          onArchive={handlers.onArchive}
          canEdit={handlers.canEdit}
          canDelete={handlers.canDelete}
          createdAt={service.created_at}
          updatedAt={service.updated_at}
        />
      )}
    />
  )
}

// Example 3: Staff/Stylists Page
export function SalonStaffPage() {
  const STAFF_PRESET = {
    smart_code: 'HERA.SALON.STAFF.ENTITY.PERSON.V1',
    dynamicFields: [
      { field_name: 'name', field_type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.NAME.V1' },
      { field_name: 'code', field_type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.CODE.V1' },
      { field_name: 'email', field_type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.EMAIL.V1' },
      { field_name: 'phone', field_type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.PHONE.V1' },
      { field_name: 'role', field_type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.ROLE.V1' },
      {
        field_name: 'commission_rate',
        field_type: 'number',
        smart_code: 'HERA.SALON.STAFF.DYN.COMMISSION.V1'
      },
      {
        field_name: 'hire_date',
        field_type: 'date',
        smart_code: 'HERA.SALON.STAFF.DYN.HIRE_DATE.V1'
      },
      {
        field_name: 'specialties',
        field_type: 'text',
        smart_code: 'HERA.SALON.STAFF.DYN.SPECIALTIES.V1'
      },
      { field_name: 'status', field_type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.STATUS.V1' }
    ]
  }

  return (
    <SalonLuxeCRUDPage
      title="Staff"
      description="Manage your salon team and stylists"
      entityType="STAFF"
      preset={STAFF_PRESET}
      icon={Users}
      searchPlaceholder="Search staff by name, email, or specialties..."
      renderCard={(staff, handlers) => (
        <SalonLuxeCard
          title={staff.dynamic_fields?.name?.value || staff.entity_name}
          subtitle={staff.dynamic_fields?.role?.value}
          description={staff.dynamic_fields?.specialties?.value}
          code={staff.dynamic_fields?.code?.value}
          icon={Users}
          status={staff.dynamic_fields?.status?.value || 'active'}
          badges={[
            { label: 'Email', value: staff.dynamic_fields?.email?.value || 'N/A' },
            { label: 'Commission', value: `${staff.dynamic_fields?.commission_rate?.value || 0}%` }
          ]}
          footer={
            staff.dynamic_fields?.phone?.value && (
              <div className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                📱 {staff.dynamic_fields?.phone?.value}
              </div>
            )
          }
          onEdit={handlers.onEdit}
          onArchive={handlers.onArchive}
          canEdit={handlers.canEdit}
          canDelete={handlers.canDelete}
          createdAt={staff.dynamic_fields?.hire_date?.value || staff.created_at}
          updatedAt={staff.updated_at}
        />
      )}
    />
  )
}

// Example 4: Gift Cards Page
export function SalonGiftCardsPage() {
  const GIFT_CARD_PRESET = {
    smart_code: 'HERA.SALON.GIFTCARD.ENTITY.ITEM.V1',
    dynamicFields: [
      { field_name: 'code', field_type: 'text', smart_code: 'HERA.SALON.GIFTCARD.DYN.CODE.V1' },
      {
        field_name: 'initial_value',
        field_type: 'number',
        smart_code: 'HERA.SALON.GIFTCARD.DYN.INITIAL_VALUE.V1'
      },
      {
        field_name: 'current_value',
        field_type: 'number',
        smart_code: 'HERA.SALON.GIFTCARD.DYN.CURRENT_VALUE.V1'
      },
      {
        field_name: 'purchaser_name',
        field_type: 'text',
        smart_code: 'HERA.SALON.GIFTCARD.DYN.PURCHASER.V1'
      },
      {
        field_name: 'recipient_name',
        field_type: 'text',
        smart_code: 'HERA.SALON.GIFTCARD.DYN.RECIPIENT.V1'
      },
      {
        field_name: 'purchase_date',
        field_type: 'date',
        smart_code: 'HERA.SALON.GIFTCARD.DYN.PURCHASE_DATE.V1'
      },
      {
        field_name: 'expiry_date',
        field_type: 'date',
        smart_code: 'HERA.SALON.GIFTCARD.DYN.EXPIRY_DATE.V1'
      },
      { field_name: 'status', field_type: 'text', smart_code: 'HERA.SALON.GIFTCARD.DYN.STATUS.V1' }
    ]
  }

  return (
    <SalonLuxeCRUDPage
      title="Gift Cards"
      description="Manage gift cards and vouchers"
      entityType="GIFTCARD"
      preset={GIFT_CARD_PRESET}
      icon={Gift}
      searchPlaceholder="Search gift cards by code, purchaser, or recipient..."
      statusOptions={[
        { value: 'all', label: 'All Status', color: LUXE_COLORS.lightText },
        { value: 'active', label: 'Active', color: LUXE_COLORS.emerald },
        { value: 'redeemed', label: 'Redeemed', color: LUXE_COLORS.bronze },
        { value: 'expired', label: 'Expired', color: LUXE_COLORS.ruby }
      ]}
      renderCard={(giftCard, handlers) => {
        const currentValue = giftCard.dynamic_fields?.current_value?.value || 0
        const initialValue = giftCard.dynamic_fields?.initial_value?.value || 0
        const usedPercent =
          initialValue > 0 ? (((initialValue - currentValue) / initialValue) * 100).toFixed(0) : 0

        return (
          <SalonLuxeCard
            title={`Gift Card ${giftCard.dynamic_fields?.code?.value || giftCard.entity_name}`}
            subtitle={`To: ${giftCard.dynamic_fields?.recipient_name?.value || 'Unknown'}`}
            description={`From: ${giftCard.dynamic_fields?.purchaser_name?.value || 'Unknown'}`}
            icon={Gift}
            status={giftCard.dynamic_fields?.status?.value || 'active'}
            badges={[
              { label: 'Value', value: `$${currentValue} / $${initialValue}` },
              { label: 'Used', value: `${usedPercent}%` }
            ]}
            footer={
              giftCard.dynamic_fields?.expiry_date?.value && (
                <div className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                  Expires:{' '}
                  {new Date(giftCard.dynamic_fields.expiry_date.value).toLocaleDateString()}
                </div>
              )
            }
            onEdit={handlers.onEdit}
            onArchive={handlers.onArchive}
            canEdit={handlers.canEdit}
            canDelete={handlers.canDelete}
            createdAt={giftCard.dynamic_fields?.purchase_date?.value || giftCard.created_at}
            updatedAt={giftCard.updated_at}
          />
        )
      }}
    />
  )
}

// Example 5: Packages/Bundles Page
export function SalonPackagesPage() {
  const PACKAGE_PRESET = {
    smart_code: 'HERA.SALON.PACKAGE.ENTITY.ITEM.V1',
    dynamicFields: [
      { field_name: 'name', field_type: 'text', smart_code: 'HERA.SALON.PACKAGE.DYN.NAME.V1' },
      { field_name: 'code', field_type: 'text', smart_code: 'HERA.SALON.PACKAGE.DYN.CODE.V1' },
      {
        field_name: 'description',
        field_type: 'text',
        smart_code: 'HERA.SALON.PACKAGE.DYN.DESCRIPTION.V1'
      },
      {
        field_name: 'services_included',
        field_type: 'text',
        smart_code: 'HERA.SALON.PACKAGE.DYN.SERVICES.V1'
      },
      {
        field_name: 'original_price',
        field_type: 'number',
        smart_code: 'HERA.SALON.PACKAGE.DYN.ORIGINAL_PRICE.V1'
      },
      {
        field_name: 'package_price',
        field_type: 'number',
        smart_code: 'HERA.SALON.PACKAGE.DYN.PACKAGE_PRICE.V1'
      },
      {
        field_name: 'validity_days',
        field_type: 'number',
        smart_code: 'HERA.SALON.PACKAGE.DYN.VALIDITY.V1'
      },
      {
        field_name: 'max_redemptions',
        field_type: 'number',
        smart_code: 'HERA.SALON.PACKAGE.DYN.MAX_REDEMPTIONS.V1'
      },
      { field_name: 'status', field_type: 'text', smart_code: 'HERA.SALON.PACKAGE.DYN.STATUS.V1' }
    ]
  }

  return (
    <SalonLuxeCRUDPage
      title="Packages"
      description="Create service bundles and special offers"
      entityType="PACKAGE"
      preset={PACKAGE_PRESET}
      icon={ShoppingBag}
      searchPlaceholder="Search packages by name or included services..."
      renderCard={(pkg, handlers) => {
        const originalPrice = pkg.dynamic_fields?.original_price?.value || 0
        const packagePrice = pkg.dynamic_fields?.package_price?.value || 0
        const savings = originalPrice > packagePrice ? originalPrice - packagePrice : 0
        const savingsPercent = originalPrice > 0 ? ((savings / originalPrice) * 100).toFixed(0) : 0

        return (
          <SalonLuxeCard
            title={pkg.dynamic_fields?.name?.value || pkg.entity_name}
            subtitle={pkg.dynamic_fields?.services_included?.value}
            description={pkg.dynamic_fields?.description?.value}
            code={pkg.dynamic_fields?.code?.value}
            icon={ShoppingBag}
            status={pkg.dynamic_fields?.status?.value || 'active'}
            badges={[
              { label: 'Price', value: `$${packagePrice}`, color: LUXE_COLORS.gold },
              {
                label: 'Save',
                value: `$${savings} (${savingsPercent}%)`,
                color: LUXE_COLORS.emerald
              }
            ]}
            footer={
              <div className="flex justify-between text-sm" style={{ color: LUXE_COLORS.bronze }}>
                <span>Valid for {pkg.dynamic_fields?.validity_days?.value || 0} days</span>
                <span>Max {pkg.dynamic_fields?.max_redemptions?.value || 'unlimited'} uses</span>
              </div>
            }
            onEdit={handlers.onEdit}
            onArchive={handlers.onArchive}
            canEdit={handlers.canEdit}
            canDelete={handlers.canDelete}
            createdAt={pkg.created_at}
            updatedAt={pkg.updated_at}
          />
        )
      }}
    />
  )
}
