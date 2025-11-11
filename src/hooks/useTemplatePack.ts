/**
 * HERA v3.0 Template Pack Hook
 * React hook for loading and using template packs in components
 */

import { useState, useEffect, useMemo } from 'react'
import { useHERAAuthV3 } from '@/components/auth/HERAAuthProviderV3'
import { 
  templateRegistry,
  type TemplatePack,
  type EntityTemplate,
  type NavigationConfig
} from '@/lib/platform/template-registry'
import { type IndustryType } from '@/lib/platform/constants'

interface UseTemplatePackResult {
  templatePack: TemplatePack | null
  navigation: NavigationConfig | null
  isLoading: boolean
  error: string | null
  reload: () => void
}

/**
 * Hook to load and use template pack for current organization
 */
export function useTemplatePack(): UseTemplatePackResult {
  const { organization } = useHERAAuthV3()
  const [templatePack, setTemplatePack] = useState<TemplatePack | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTemplatePack = async () => {
    if (!organization?.industry) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const pack = await templateRegistry.loadTemplatePack(organization.industry)
      
      if (pack) {
        // Validate the pack
        const validation = templateRegistry.validateTemplatePack(pack)
        
        if (!validation.isValid) {
          throw new Error(`Invalid template pack: ${validation.errors.join(', ')}`)
        }

        setTemplatePack(pack)
        
        // Apply branding from template pack
        templateRegistry.applyBranding(pack)
        
        console.log('✅ Template pack loaded successfully:', pack.pack_id)
      } else {
        throw new Error('Failed to load template pack')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('❌ Failed to load template pack:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load template pack when organization changes
  useEffect(() => {
    loadTemplatePack()
  }, [organization?.industry])

  // Generate navigation from template pack
  const navigation = useMemo(() => {
    return templatePack ? templateRegistry.generateNavigation(templatePack) : null
  }, [templatePack])

  return {
    templatePack,
    navigation,
    isLoading,
    error,
    reload: loadTemplatePack
  }
}

interface UseEntityTemplateResult {
  entityTemplate: EntityTemplate | null
  isLoading: boolean
  error: string | null
  reload: () => void
}

/**
 * Hook to load entity template
 */
export function useEntityTemplate(templateId: string): UseEntityTemplateResult {
  const { organization } = useHERAAuthV3()
  const [entityTemplate, setEntityTemplate] = useState<EntityTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEntityTemplate = async () => {
    if (!organization?.industry || !templateId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const template = await templateRegistry.loadEntityTemplate(
        organization.industry,
        templateId
      )
      
      if (template) {
        setEntityTemplate(template)
        console.log('✅ Entity template loaded:', templateId)
      } else {
        throw new Error('Failed to load entity template')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('❌ Failed to load entity template:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load entity template when dependencies change
  useEffect(() => {
    loadEntityTemplate()
  }, [organization?.industry, templateId])

  return {
    entityTemplate,
    isLoading,
    error,
    reload: loadEntityTemplate
  }
}

interface UseTemplateNavigationResult {
  navigation: NavigationConfig | null
  activeSection: string | null
  setActiveSection: (sectionId: string) => void
  getNavigationItem: (route: string) => NavigationItem | null
}

interface NavigationItem {
  label: string
  route: string
  icon: string
  sectionId: string
}

/**
 * Hook for navigation management with template packs
 */
export function useTemplateNavigation(currentRoute?: string): UseTemplateNavigationResult {
  const { navigation } = useTemplatePack()
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Find active section based on current route
  useEffect(() => {
    if (navigation && currentRoute) {
      for (const section of navigation.sections) {
        const matchingItem = section.items.find(item => 
          currentRoute.startsWith(item.route)
        )
        if (matchingItem) {
          setActiveSection(section.id)
          break
        }
      }
    }
  }, [navigation, currentRoute])

  // Get navigation item by route
  const getNavigationItem = (route: string): NavigationItem | null => {
    if (!navigation) return null

    for (const section of navigation.sections) {
      const item = section.items.find(item => item.route === route)
      if (item) {
        return {
          ...item,
          sectionId: section.id
        }
      }
    }

    return null
  }

  return {
    navigation,
    activeSection,
    setActiveSection,
    getNavigationItem
  }
}

/**
 * Hook for checking template pack features
 */
export function useTemplateFeatures() {
  const { templatePack } = useTemplatePack()

  const hasFeature = (featureName: string): boolean => {
    return templatePack?.features?.[featureName] === true
  }

  const getFeatures = (): Record<string, boolean> => {
    return templatePack?.features || {}
  }

  const getConfiguration = (key: string): any => {
    return templatePack?.configuration?.[key]
  }

  return {
    hasFeature,
    getFeatures,
    getConfiguration,
    features: templatePack?.features || {},
    configuration: templatePack?.configuration || {}
  }
}

/**
 * Hook for template pack branding
 */
export function useTemplateBranding() {
  const { templatePack } = useTemplatePack()
  const { organization } = useHERAAuthV3()

  // Merge template pack branding with organization branding
  const branding = useMemo(() => {
    const templateBranding = templatePack?.branding
    const orgBranding = organization?.settings?.branding

    if (!templateBranding && !orgBranding) return null

    // Organization branding overrides template branding
    return {
      primary_color: orgBranding?.primary_color || templateBranding?.primary_color || '#3b82f6',
      secondary_color: orgBranding?.secondary_color || templateBranding?.secondary_color || '#1d4ed8',
      accent_color: orgBranding?.accent_color || templateBranding?.accent_color || '#f59e0b',
      font_family: orgBranding?.font_family || templateBranding?.font_family || 'Inter',
      theme: orgBranding?.theme || templateBranding?.theme || 'light',
      logo_url: orgBranding?.logo_url,
      favicon_url: orgBranding?.favicon_url,
      custom_domain: orgBranding?.custom_domain
    }
  }, [templatePack, organization])

  return {
    branding,
    templateBranding: templatePack?.branding,
    organizationBranding: organization?.settings?.branding
  }
}