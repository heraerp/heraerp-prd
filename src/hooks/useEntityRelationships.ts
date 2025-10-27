'use client'

/**
 * Entity Relationships Hook
 * Smart Code: HERA.ENTERPRISE.MASTER_DATA.RELATIONSHIPS.v1
 * 
 * Manages entity relationship selection, search, and linking for master data forms
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { MasterDataRelationship } from '@/lib/master-data/yaml-parser'
import { getEntities } from '@/lib/universal-api-v2-client'
import { useDebounce } from '@/hooks/useDebounce'

export interface RelationshipOption {
  value: string
  label: string
  entity: any
  isSelected?: boolean
  metadata?: Record<string, any>
}

export interface RelationshipSearchState {
  query: string
  isSearching: boolean
  hasSearched: boolean
  results: RelationshipOption[]
  totalResults: number
  isLoading: boolean
  error: string | null
}

export interface RelationshipSelection {
  relationshipName: string
  selectedValues: string[]
  selectedOptions: RelationshipOption[]
  isValid: boolean
  errors: string[]
}

export interface UseEntityRelationshipsOptions {
  relationships: MasterDataRelationship[]
  initialSelections?: Record<string, any>
  onSelectionChange?: (relationshipName: string, selection: RelationshipSelection) => void
  searchDebounceMs?: number
  maxSearchResults?: number
}

export function useEntityRelationships(options: UseEntityRelationshipsOptions) {
  const { user, organization } = useHERAAuth()
  const {
    relationships,
    initialSelections = {},
    onSelectionChange,
    searchDebounceMs = 300,
    maxSearchResults = 50
  } = options

  // Search states for each relationship
  const [searchStates, setSearchStates] = useState<Record<string, RelationshipSearchState>>(() => {
    const states: Record<string, RelationshipSearchState> = {}
    for (const rel of relationships) {
      states[rel.name] = {
        query: '',
        isSearching: false,
        hasSearched: false,
        results: [],
        totalResults: 0,
        isLoading: false,
        error: null
      }
    }
    return states
  })

  // Current selections for each relationship
  const [selections, setSelections] = useState<Record<string, RelationshipSelection>>(() => {
    const initialState: Record<string, RelationshipSelection> = {}
    
    for (const rel of relationships) {
      const initialValue = initialSelections[rel.name]
      let selectedValues: string[] = []
      
      if (initialValue) {
        if (rel.type.includes('Many')) {
          selectedValues = Array.isArray(initialValue) ? initialValue : [initialValue]
        } else {
          selectedValues = [initialValue]
        }
      }
      
      initialState[rel.name] = {
        relationshipName: rel.name,
        selectedValues,
        selectedOptions: [],
        isValid: !rel.required || selectedValues.length > 0,
        errors: []
      }
    }
    
    return initialState
  })

  // Cached entity data for each target entity type
  const [entityCache, setEntityCache] = useState<Record<string, Map<string, any>>>({})

  // Debounced search queries
  const debouncedSearchQueries = useMemo(() => {
    const queries: Record<string, string> = {}
    for (const rel of relationships) {
      queries[rel.name] = useDebounce(searchStates[rel.name]?.query || '', searchDebounceMs)
    }
    return queries
  }, [relationships, searchStates, searchDebounceMs])

  // Entity queries for each relationship
  const entityQueries = useMemo(() => {
    const queries: Record<string, any> = {}
    
    for (const rel of relationships) {
      const searchQuery = debouncedSearchQueries[rel.name]
      const shouldSearch = searchQuery.length >= 2 || searchStates[rel.name]?.hasSearched
      
      queries[rel.name] = useQuery({
        queryKey: ['relationship-entities', organization?.id, rel.targetEntity, searchQuery, rel.filters],
        queryFn: async () => {
          if (!organization?.id) throw new Error('No organization')
          
          return await searchRelatedEntities(
            organization.id,
            rel,
            searchQuery,
            maxSearchResults
          )
        },
        enabled: shouldSearch && !!organization?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        select: (data) => transformEntitiesToOptions(data?.entities || [], rel)
      })
    }
    
    return queries
  }, [organization?.id, relationships, debouncedSearchQueries, searchStates, maxSearchResults])

  // Update search query for a specific relationship
  const updateSearchQuery = useCallback((relationshipName: string, query: string) => {
    setSearchStates(prev => ({
      ...prev,
      [relationshipName]: {
        ...prev[relationshipName],
        query,
        isSearching: query.length >= 2,
        hasSearched: prev[relationshipName].hasSearched || query.length >= 2
      }
    }))
  }, [])

  // Select/deselect options for a relationship
  const updateSelection = useCallback((
    relationshipName: string, 
    optionValue: string, 
    option: RelationshipOption,
    isSelected: boolean
  ) => {
    const relationship = relationships.find(r => r.name === relationshipName)
    if (!relationship) return

    setSelections(prev => {
      const currentSelection = prev[relationshipName]
      let newSelectedValues: string[] = []
      let newSelectedOptions: RelationshipOption[] = []

      if (relationship.type.includes('Many')) {
        // Multi-select logic
        if (isSelected) {
          newSelectedValues = [...currentSelection.selectedValues, optionValue]
          newSelectedOptions = [...currentSelection.selectedOptions, option]
        } else {
          newSelectedValues = currentSelection.selectedValues.filter(v => v !== optionValue)
          newSelectedOptions = currentSelection.selectedOptions.filter(o => o.value !== optionValue)
        }
      } else {
        // Single-select logic
        if (isSelected) {
          newSelectedValues = [optionValue]
          newSelectedOptions = [option]
        } else {
          newSelectedValues = []
          newSelectedOptions = []
        }
      }

      // Validate selection
      const isValid = !relationship.required || newSelectedValues.length > 0
      const errors: string[] = []
      
      if (relationship.required && newSelectedValues.length === 0) {
        errors.push(`${relationship.label} is required`)
      }

      const newSelection: RelationshipSelection = {
        relationshipName,
        selectedValues: newSelectedValues,
        selectedOptions: newSelectedOptions,
        isValid,
        errors
      }

      // Notify about selection change
      if (onSelectionChange) {
        onSelectionChange(relationshipName, newSelection)
      }

      return {
        ...prev,
        [relationshipName]: newSelection
      }
    })
  }, [relationships, onSelectionChange])

  // Clear selection for a relationship
  const clearSelection = useCallback((relationshipName: string) => {
    const relationship = relationships.find(r => r.name === relationshipName)
    if (!relationship) return

    const isValid = !relationship.required
    const errors = relationship.required ? [`${relationship.label} is required`] : []

    const newSelection: RelationshipSelection = {
      relationshipName,
      selectedValues: [],
      selectedOptions: [],
      isValid,
      errors
    }

    setSelections(prev => ({
      ...prev,
      [relationshipName]: newSelection
    }))

    if (onSelectionChange) {
      onSelectionChange(relationshipName, newSelection)
    }
  }, [relationships, onSelectionChange])

  // Get available options for a relationship (search results + selected items)
  const getOptionsForRelationship = useCallback((relationshipName: string): RelationshipOption[] => {
    const queryResult = entityQueries[relationshipName]
    const searchResults = queryResult?.data || []
    const currentSelection = selections[relationshipName]
    
    // Combine search results with selected options
    const selectedValueSet = new Set(currentSelection.selectedValues)
    const optionsMap = new Map<string, RelationshipOption>()
    
    // Add selected options first (always visible)
    for (const selectedOption of currentSelection.selectedOptions) {
      optionsMap.set(selectedOption.value, {
        ...selectedOption,
        isSelected: true
      })
    }
    
    // Add search results
    for (const option of searchResults) {
      const isSelected = selectedValueSet.has(option.value)
      optionsMap.set(option.value, {
        ...option,
        isSelected
      })
    }
    
    return Array.from(optionsMap.values())
  }, [entityQueries, selections])

  // Get search state for a relationship
  const getSearchStateForRelationship = useCallback((relationshipName: string) => {
    const queryResult = entityQueries[relationshipName]
    const baseState = searchStates[relationshipName]
    
    return {
      ...baseState,
      isLoading: queryResult?.isFetching || false,
      error: queryResult?.error?.message || null,
      results: queryResult?.data || [],
      totalResults: queryResult?.data?.length || 0
    }
  }, [entityQueries, searchStates])

  // Load initial selected options from IDs
  useEffect(() => {
    const loadInitialOptions = async () => {
      if (!organization?.id) return

      for (const rel of relationships) {
        const selection = selections[rel.name]
        
        if (selection.selectedValues.length > 0 && selection.selectedOptions.length === 0) {
          try {
            // Load full entity data for selected IDs
            const entities = await loadEntitiesByIds(
              organization.id,
              rel.targetEntity,
              selection.selectedValues
            )
            
            const options = transformEntitiesToOptions(entities, rel)
            
            setSelections(prev => ({
              ...prev,
              [rel.name]: {
                ...prev[rel.name],
                selectedOptions: options
              }
            }))
            
          } catch (error) {
            console.error(`Failed to load initial options for ${rel.name}:`, error)
          }
        }
      }
    }

    loadInitialOptions()
  }, [organization?.id, relationships, selections])

  return {
    // Search functionality
    updateSearchQuery,
    getSearchStateForRelationship,
    
    // Selection management
    updateSelection,
    clearSelection,
    selections,
    
    // Options and data
    getOptionsForRelationship,
    
    // Utility functions
    isRelationshipValid: (relationshipName: string) => selections[relationshipName]?.isValid ?? false,
    getRelationshipErrors: (relationshipName: string) => selections[relationshipName]?.errors ?? [],
    getSelectedValues: (relationshipName: string) => selections[relationshipName]?.selectedValues ?? [],
    getSelectedOptions: (relationshipName: string) => selections[relationshipName]?.selectedOptions ?? [],
    
    // Overall state
    hasValidationErrors: Object.values(selections).some(s => !s.isValid),
    getAllSelections: () => selections
  }
}

// Helper functions

async function searchRelatedEntities(
  organizationId: string,
  relationship: MasterDataRelationship,
  searchQuery: string,
  limit: number
) {
  const filters: any = {
    organization_id: organizationId,
    entity_type: relationship.targetEntity.toUpperCase().substring(0, 4),
    limit,
    offset: 0
  }

  // Apply relationship-specific filters
  if (relationship.filters) {
    Object.assign(filters, relationship.filters)
  }

  // Apply search query to configured search fields
  if (searchQuery && relationship.searchFields) {
    filters.search = searchQuery
  }

  try {
    const response = await getEntities(filters)
    return response
  } catch (error) {
    console.error('Failed to search related entities:', error)
    throw error
  }
}

async function loadEntitiesByIds(
  organizationId: string,
  entityType: string,
  entityIds: string[]
) {
  // This would typically use a batch get API endpoint
  // For now, we'll simulate with individual requests
  const entities = []
  
  for (const entityId of entityIds) {
    try {
      const response = await getEntities({
        organization_id: organizationId,
        entity_type: entityType.toUpperCase().substring(0, 4),
        entity_id: entityId
      })
      
      if (response.entities && response.entities.length > 0) {
        entities.push(response.entities[0])
      }
    } catch (error) {
      console.error(`Failed to load entity ${entityId}:`, error)
    }
  }
  
  return entities
}

function transformEntitiesToOptions(
  entities: any[],
  relationship: MasterDataRelationship
): RelationshipOption[] {
  return entities.map(entity => ({
    value: entity[relationship.valueField || 'entity_id'],
    label: entity[relationship.displayField || 'entity_name'] || 
           entity.entity_name || 
           entity.entity_code || 
           'Unnamed Entity',
    entity,
    metadata: {
      entity_type: entity.entity_type,
      entity_code: entity.entity_code,
      created_at: entity.created_at,
      ...entity.metadata
    }
  }))
}