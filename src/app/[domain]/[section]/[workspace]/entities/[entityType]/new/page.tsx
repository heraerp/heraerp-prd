/*
 * HERA Universal Dynamic Entity Creation Page
 * Smart Code: HERA.UNIVERSAL.ENTITY.CREATE.DYNAMIC.v1
 * 
 * Fully dynamic entity creation using existing production-ready components
 * - No hardcoding of entity types or fields
 * - Uses HERAMasterDataTemplate for consistent UX
 * - Integrates with hera_entities_crud_v1 RPC function via useUniversalEntityV1
 * - Mobile-optimized, enterprise-grade interface
 */

'use client'

import React, { use, useMemo } from 'react'
import { 
  Building2, 
  User, 
  MapPin, 
  DollarSign,
  FileText,
  Package,
  Users,
  CreditCard,
  Tags,
  Activity,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import HERAMasterDataTemplate from '@/components/hera/HERAMasterDataTemplate'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1'

// Icon mapping for entity types
const entityIconMap: Record<string, any> = {
  customers: Users,
  products: Package,
  suppliers: Building2,
  vendors: Building2,
  accounts: CreditCard,
  categories: Tags,
  items: Package,
  contacts: Users,
  leads: Activity,
  opportunities: BarChart3,
  staff: Users,
  employees: Users
}

// Section icon mapping for form sections
const sectionIconMap: Record<string, any> = {
  basic: Building2,
  contact: User,
  address: MapPin,
  financial: DollarSign,
  documents: FileText,
  details: FileText,
  configuration: Package,
  preferences: User
}

interface PageProps {
  params: Promise<{
    domain: string
    section: string
    workspace: string
    entityType: string
  }>
}

// Default field configurations for common entity types
const getDefaultFieldConfig = (entityType: string) => {
  const commonFields = {
    basic: [
      {
        id: 'entity_name',
        label: 'Name',
        type: 'text' as const,
        required: true,
        placeholder: `Enter ${entityType} name`,
        section: 'basic'
      },
      {
        id: 'entity_code',
        label: 'Code',
        type: 'text' as const,
        required: true,
        placeholder: 'Auto-generated from name',
        section: 'basic'
      },
      {
        id: 'description',
        label: 'Description',
        type: 'textarea' as const,
        placeholder: `Brief description of ${entityType}`,
        section: 'basic'
      }
    ],
    contact: [
      {
        id: 'email',
        label: 'Email',
        type: 'email' as const,
        placeholder: 'contact@example.com',
        section: 'contact',
        validation: (value: string) => {
          if (!value) return null
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          return !emailRegex.test(value) ? 'Please enter a valid email address' : null
        }
      },
      {
        id: 'phone',
        label: 'Phone',
        type: 'phone' as const,
        placeholder: '+971 50 123 4567',
        section: 'contact'
      }
    ],
    details: [
      {
        id: 'category',
        label: 'Category',
        type: 'select' as const,
        section: 'details',
        options: [
          { value: 'standard', label: 'Standard', description: 'Standard category' },
          { value: 'premium', label: 'Premium', description: 'Premium category' },
          { value: 'custom', label: 'Custom', description: 'Custom category' }
        ]
      },
      {
        id: 'priority',
        label: 'Priority',
        type: 'select' as const,
        section: 'details',
        options: [
          { value: 'low', label: 'Low', description: 'Low priority' },
          { value: 'medium', label: 'Medium', description: 'Medium priority' },
          { value: 'high', label: 'High', description: 'High priority' }
        ]
      },
      {
        id: 'value',
        label: 'Value',
        type: 'number' as const,
        placeholder: 'Enter value',
        section: 'details'
      }
    ]
  }

  return {
    sections: [
      { 
        id: 'basic', 
        label: 'Basic Information', 
        icon: Building2, 
        required: true,
        description: `Enter basic ${entityType} information`
      },
      { 
        id: 'contact', 
        label: 'Contact Details', 
        icon: User, 
        required: false,
        description: 'Add contact information'
      },
      { 
        id: 'details', 
        label: 'Additional Details', 
        icon: FileText, 
        required: false,
        description: 'Configure additional settings and details'
      }
    ],
    fields: [
      ...commonFields.basic,
      ...commonFields.contact,
      ...commonFields.details
    ]
  }
}

export default function UniversalEntityCreatePage({ params }: PageProps) {
  // Resolve params using React 19 use() API
  const { domain, section, workspace, entityType } = use(params)
  
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  
  // Universal Entity Hook for CRUD operations
  const { create, isLoading } = useUniversalEntityV1({
    entity_type: entityType.toUpperCase(),
    organizationId: organization?.id
  })

  // Generate dynamic configuration
  const entityConfig = useMemo(() => getDefaultFieldConfig(entityType), [entityType])

  // Early returns for auth checks
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">Please log in to create entities.</p>
        </div>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Organization Context Required</h2>
          <p className="text-gray-600">Please select an organization to continue.</p>
        </div>
      </div>
    )
  }

  // Get entity icon
  const EntityIcon = entityIconMap[entityType] || Package

  // Generate smart code
  const generateSmartCode = (formData: Record<string, any>) => {
    const industry = domain?.toUpperCase() || 'PLATFORM'
    const category = formData.category?.toUpperCase() || 'STANDARD'
    const code = formData.entity_code || 'GENERAL'
    
    return `HERA.${industry}.${entityType.toUpperCase()}.${category}.${code}.v1`
  }

  // Handle form submission with Universal Entity Hook
  const handleEntitySubmit = async (formData: Record<string, any>) => {
    if (!organization?.id) {
      throw new Error('No organization context available')
    }

    // Generate smart code for the entity
    const smartCode = generateSmartCode(formData)

    // Prepare dynamic fields (exclude core entity fields)
    const coreFields = ['entity_name', 'entity_code', 'description']
    const dynamicFields: Record<string, any> = {}
    
    Object.entries(formData).forEach(([key, value]) => {
      if (!coreFields.includes(key) && value !== '' && value !== null && value !== undefined) {
        // Determine field type and format for RPC
        let fieldType: string
        let formattedValue: any

        if (typeof value === 'number') {
          fieldType = 'number'
          formattedValue = value
        } else if (typeof value === 'boolean') {
          fieldType = 'boolean'
          formattedValue = value
        } else {
          fieldType = 'text'
          formattedValue = String(value)
        }

        dynamicFields[key] = {
          value: formattedValue,
          type: fieldType as any,
          smart_code: `${smartCode}.FIELD.${key.toUpperCase()}.v1`
        }
      }
    })

    // Create entity using Universal Entity Hook
    const entityData = {
      entity_type: entityType.toUpperCase(),
      entity_name: formData.entity_name,
      entity_code: formData.entity_code,
      smart_code: smartCode,
      metadata: {
        metadata_category: 'system_generated',
        domain,
        section,
        workspace,
        entity_type: entityType
      },
      dynamic_fields: dynamicFields
    }

    console.log('🚀 Creating dynamic entity:', entityData)
    
    try {
      const result = await create(entityData)
      console.log('✅ Entity created successfully:', result)
      return result
    } catch (error) {
      console.error('❌ Failed to create entity:', error)
      throw error
    }
  }

  // Get entity label
  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase()
  const backUrl = `/${domain}/${section}/${workspace}/entities/${entityType}`

  return (
    <HERAMasterDataTemplate
      entityType={entityType}
      entityLabel={entityLabel}
      sections={entityConfig.sections}
      fields={entityConfig.fields}
      backUrl={backUrl}
      onSubmit={handleEntitySubmit}
      defaultValues={{
        status: 'active',
        priority: 'medium',
        category: 'standard'
      }}
      className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
    />
  )
}