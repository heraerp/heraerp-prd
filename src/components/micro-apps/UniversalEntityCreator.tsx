/**
 * Universal Entity Creator Component
 * Smart Code: HERA.MICRO_APPS.UNIVERSAL.ENTITY_CREATOR.v1
 * 
 * Main component for creating entities through micro-app runtime
 * Integrates micro-app discovery with HERA master data templates
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import HERAMasterDataTemplate from '@/components/hera/HERAMasterDataTemplate'
import { UniversalEntityRegistry, type WorkspaceEntityContext, type EntityCreationConfig } from '@/lib/micro-apps/UniversalEntityRegistry'
import { EntityCreationService, type EntityCreationPayload } from '@/lib/micro-apps/EntityCreationService'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Sparkles,
  Building2,
  FileText,
  User,
  DollarSign,
  Settings,
  MoreHorizontal
} from 'lucide-react'

interface UniversalEntityCreatorProps {
  workspaceContext: WorkspaceEntityContext
  entityType?: string
  backUrl?: string
  onSuccess?: (result: any) => void
}

// Icon mapping for sections
const SECTION_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'basic': FileText,
  'contact': User,
  'financial': DollarSign,
  'details': Settings,
  'additional': MoreHorizontal
}

export function UniversalEntityCreator({
  workspaceContext,
  entityType,
  backUrl,
  onSuccess
}: UniversalEntityCreatorProps) {
  const router = useRouter()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()

  const [availableEntityTypes, setAvailableEntityTypes] = useState<any[]>([])
  const [selectedEntityType, setSelectedEntityType] = useState<string>(entityType || '')
  const [entityConfig, setEntityConfig] = useState<EntityCreationConfig | null>(null)
  const [appMappings, setAppMappings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEntitySelection, setShowEntitySelection] = useState(!entityType)

  // Default back URL based on workspace context
  const defaultBackUrl = backUrl || `/${workspaceContext.domain}/domains/${workspaceContext.domain}/sections/${workspaceContext.section}`

  // Load available entity types on mount
  useEffect(() => {
    if (!isAuthenticated || !organization?.id) return

    const loadEntityTypes = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('🔍 Loading entity types for workspace:', workspaceContext)

        const { entityTypes, appMappings: mappings } = await UniversalEntityRegistry.getAvailableEntityTypes({
          ...workspaceContext,
          organization_id: organization.id
        })

        setAvailableEntityTypes(entityTypes)
        setAppMappings(mappings)

        // If only one entity type available, auto-select it
        if (entityTypes.length === 1 && !selectedEntityType) {
          setSelectedEntityType(entityTypes[0].entity_type)
          setShowEntitySelection(false)
        }

        console.log(`✅ Found ${entityTypes.length} entity types`)

      } catch (err) {
        console.error('❌ Error loading entity types:', err)
        setError(err instanceof Error ? err.message : 'Failed to load entity types')
      } finally {
        setLoading(false)
      }
    }

    loadEntityTypes()
  }, [isAuthenticated, organization?.id, workspaceContext, selectedEntityType])

  // Load entity configuration when entity type is selected
  useEffect(() => {
    if (!selectedEntityType || !organization?.id || showEntitySelection) return

    const loadEntityConfig = async () => {
      try {
        setLoading(true)
        setError(null)

        const appCode = appMappings[selectedEntityType] || 'HERA_DEFAULT'
        console.log('🔧 Loading entity config for:', selectedEntityType, 'from app:', appCode)

        const config = await UniversalEntityRegistry.getEntityCreationConfig(
          selectedEntityType,
          appCode,
          { ...workspaceContext, organization_id: organization.id }
        )

        if (!config) {
          throw new Error(`Configuration not found for entity type: ${selectedEntityType}`)
        }

        // Map section icons from string names to components
        const enhancedSections = config.sections.map(section => ({
          ...section,
          icon: SECTION_ICON_MAP[section.id] || FileText
        }))

        setEntityConfig({ ...config, sections: enhancedSections })
        console.log('✅ Entity config loaded:', config.entityLabel)

      } catch (err) {
        console.error('❌ Error loading entity config:', err)
        setError(err instanceof Error ? err.message : 'Failed to load entity configuration')
      } finally {
        setLoading(false)
      }
    }

    loadEntityConfig()
  }, [selectedEntityType, organization?.id, appMappings, workspaceContext, showEntitySelection])

  // Handle entity creation submission
  const handleEntitySubmit = useCallback(async (formData: Record<string, any>) => {
    if (!entityConfig || !user?.id || !organization?.id) {
      throw new Error('Missing required context for entity creation')
    }

    console.log('🚀 Submitting entity creation:', selectedEntityType, formData)

    const payload: EntityCreationPayload = {
      entityType: selectedEntityType,
      entityData: formData,
      dynamicFields: {}, // Could be populated from form data
      relationships: [], // Could be populated based on workspace relationships
      workspaceContext: {
        ...workspaceContext,
        organization_id: organization.id
      },
      appCode: entityConfig.microAppConfig.app_code
    }

    const result = await EntityCreationService.createEntity(payload, user.id)

    if (!result.success) {
      throw new Error(result.error || 'Entity creation failed')
    }

    console.log('✅ Entity created successfully:', result.entity_id)

    // Call success callback if provided
    if (onSuccess) {
      onSuccess(result)
    }

    return result

  }, [entityConfig, user?.id, organization?.id, selectedEntityType, workspaceContext, onSuccess])

  // Handle entity type selection
  const handleEntityTypeSelect = useCallback((entityTypeId: string) => {
    setSelectedEntityType(entityTypeId)
    setShowEntitySelection(false)
  }, [])

  // Show loading state
  if (contextLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading entity creator...</p>
        </div>
      </div>
    )
  }

  // Show authentication error
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please log in to create entities.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show organization context error
  if (!organization?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No organization context available. Please select an organization.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 text-center">
            <Button onClick={() => router.push(defaultBackUrl)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show entity type selection
  if (showEntitySelection && availableEntityTypes.length > 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
        
        <div className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Create Entity</h1>
                <p className="text-xs text-gray-600">{workspaceContext.domain} • {workspaceContext.section}</p>
              </div>
            </div>
            <button 
              onClick={() => router.push(defaultBackUrl)}
              className="min-w-[44px] min-h-[44px] rounded-full bg-gray-100 flex items-center justify-center active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Entity Type</h2>
            <p className="text-gray-600">Select the type of entity you want to create</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableEntityTypes.map((entityType) => (
              <Card 
                key={entityType.entity_type}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleEntityTypeSelect(entityType.entity_type)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    {entityType.display_name}
                  </CardTitle>
                  <CardDescription>
                    {entityType.description || `Create and manage ${entityType.display_name_plural.toLowerCase()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {entityType.fields?.length || 0} fields
                    </Badge>
                    {appMappings[entityType.entity_type] !== 'HERA_DEFAULT' && (
                      <Badge variant="outline">
                        Micro-App
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {availableEntityTypes.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Entity Types Available</h3>
              <p className="text-gray-600 mb-6">No entity types are configured for this workspace.</p>
              <Button onClick={() => router.push(defaultBackUrl)} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show entity creation form
  if (entityConfig) {
    return (
      <HERAMasterDataTemplate
        entityType={entityConfig.entityType}
        entityLabel={entityConfig.entityLabel}
        sections={entityConfig.sections}
        fields={entityConfig.fields}
        backUrl={defaultBackUrl}
        onSubmit={handleEntitySubmit}
        defaultValues={{}}
        microAppConfig={entityConfig.microAppConfig}
        workspaceContext={entityConfig.workspaceContext}
        enableMicroAppFeatures={true}
      />
    )
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Preparing entity creator...</p>
      </div>
    </div>
  )
}

export default UniversalEntityCreator