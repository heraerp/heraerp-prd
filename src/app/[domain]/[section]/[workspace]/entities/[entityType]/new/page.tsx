/*
 * HERA Universal Dynamic Entity Creation Page
 * Smart Code: HERA.UNIVERSAL.ENTITY.CREATE.DYNAMIC.v1
 * Style Source: /enterprise/procurement/vendors/new (HERAMasterDataTemplate pattern)
 */

'use client'

import React, { use } from 'react'
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
  BarChart3
} from 'lucide-react'
import HERAMasterDataTemplate from '@/components/hera/HERAMasterDataTemplate'
import { resolveUniversalConfig, generateUniversalSmartCode } from '@/lib/universal/config'

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

export default function UniversalEntityCreatePage({ params }: PageProps) {
  // Resolve params using React 19 use() API
  const { domain, section, workspace, entityType } = use(params)
  
  // Universal Configuration
  const config = resolveUniversalConfig(domain, section, workspace)
  const entityConfig = config.entityTypes.find(e => e.id === entityType)
  
  if (!entityConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-slate-600">Entity type &quot;{entityType}&quot; not found.</p>
        </div>
      </div>
    )
  }

  // Get entity icon
  const EntityIcon = entityIconMap[entityType] || Package

  // Generate dynamic form sections based on entity configuration
  const generateSections = () => {
    // Group fields by type or use default sections
    const fieldGroups: Record<string, any[]> = {}
    
    entityConfig.fields.forEach(field => {
      // Group fields by type or create logical groups
      let groupKey = 'basic'
      
      if (field.type === 'email' || field.type === 'phone' || field.name.includes('contact')) {
        groupKey = 'contact'
      } else if (field.name.includes('address') || field.name.includes('city') || field.name.includes('country')) {
        groupKey = 'address'
      } else if (field.name.includes('payment') || field.name.includes('price') || field.name.includes('cost')) {
        groupKey = 'financial'
      }
      
      if (!fieldGroups[groupKey]) {
        fieldGroups[groupKey] = []
      }
      fieldGroups[groupKey].push(field)
    })

    // Create sections from field groups
    const sections = Object.entries(fieldGroups).map(([key, fields]) => ({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1) + ' Information',
      icon: sectionIconMap[key] || Building2,
      required: fields.some(field => field.required),
      description: `Configure ${key} settings for this ${entityConfig.name.toLowerCase().slice(0, -1)}`
    }))

    return sections
  }

  // Generate dynamic form fields based on entity configuration
  const generateFields = () => {
    const formFields = entityConfig.fields.map(field => {
      // Determine section based on field type/name
      let section = 'basic'
      
      if (field.type === 'email' || field.type === 'phone' || field.name.includes('contact')) {
        section = 'contact'
      } else if (field.name.includes('address') || field.name.includes('city') || field.name.includes('country')) {
        section = 'address'  
      } else if (field.name.includes('payment') || field.name.includes('price') || field.name.includes('cost')) {
        section = 'financial'
      }

      return {
        id: field.id,
        label: field.label,
        type: field.type as any,
        required: field.required,
        placeholder: field.placeholder || `Enter ${field.label.toLowerCase()}`,
        section,
        options: field.options,
        validation: field.validation ? (value: string) => {
          // Simple validation based on type
          if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            return !emailRegex.test(value) ? 'Please enter a valid email address' : null
          }
          if (field.type === 'phone') {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
            return !phoneRegex.test(value.replace(/\D/g, '')) ? 'Please enter a valid phone number' : null
          }
          return null
        } : undefined
      }
    })

    // Add default entity fields if not present
    const hasName = formFields.some(f => f.id === 'name' || f.id === 'entity_name')
    const hasCode = formFields.some(f => f.id === 'code' || f.id === 'entity_code')

    if (!hasName) {
      formFields.unshift({
        id: 'entity_name',
        label: `${entityConfig.name.slice(0, -1)} Name`,
        type: 'text' as const,
        required: true,
        placeholder: `Enter ${entityConfig.name.toLowerCase().slice(0, -1)} name`,
        section: 'basic'
      })
    }

    if (!hasCode) {
      formFields.splice(1, 0, {
        id: 'entity_code',
        label: `${entityConfig.name.slice(0, -1)} Code`,
        type: 'text' as const,
        required: true,
        placeholder: 'Auto-generated from name',
        section: 'basic'
      })
    }

    return formFields
  }

  const sections = generateSections()
  const fields = generateFields()

  const handleEntitySubmit = async (formData: Record<string, any>) => {
    // Generate HERA DNA smart code
    const smartCode = generateUniversalSmartCode(
      domain,
      section,
      workspace,
      'ENTITY',
      entityType.toUpperCase()
    )
    
    // Prepare entity data for HERA API v2
    const entityData = {
      entity_type: entityType,
      entity_name: formData.entity_name,
      entity_code: formData.entity_code,
      smart_code: smartCode,
      dynamic_fields: fields
        .filter(field => formData[field.id] && field.id !== 'entity_name' && field.id !== 'entity_code')
        .map(field => ({
          field_name: field.id,
          field_value_text: formData[field.id],
          field_type: field.type,
          smart_code: generateUniversalSmartCode(
            domain, 
            section, 
            workspace, 
            'FIELD', 
            field.id.toUpperCase()
          )
        }))
    }
    
    console.log('Creating entity with HERA API v2:', entityData)
    
    // For now, save to localStorage to show in the list
    const newEntity = {
      id: Date.now().toString(),
      entity_name: formData.entity_name,
      entity_code: formData.entity_code,
      status: 'active',
      ...formData
    }
    
    // Get existing entities from localStorage
    const storageKey = `hera_${entityType}`
    const existingEntities = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    // Add new entity
    const updatedEntities = [...existingEntities, newEntity]
    
    // Save back to localStorage
    localStorage.setItem(storageKey, JSON.stringify(updatedEntities))
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Here you would call the HERA API v2 to create the entity
    // const result = await apiV2.post('entities', entityData)
  }

  return (
    <HERAMasterDataTemplate
      entityType={entityType}
      entityLabel={entityConfig.name.slice(0, -1)}
      sections={sections}
      fields={fields}
      backUrl={`/${domain}/${section}/${workspace}/entities/${entityType}`}
      onSubmit={handleEntitySubmit}
      defaultValues={{}}
      className=""
      icon={EntityIcon}
    />
  )
}