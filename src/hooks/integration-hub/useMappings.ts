import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { universalApi } from '@/lib/universal-api'
import type { DataMapping, FieldMapping, TransformOperation } from '@/types/integration-hub'
import { useToast } from '@/components/ui/use-toast'

// Fetch all mappings for an organization
export function useMappings(organizationId: string) {
  return useQuery({
    queryKey: ['integration-mappings', organizationId],
    queryFn: async () => {
      const result = await universalApi.read({
        table: 'core_entities',
        filters: {
          entity_type: 'integration_mapping',
          organization_id: organizationId
        }
      })
      return result.data as DataMapping[]
    },
    enabled: !!organizationId
  })
}

// Fetch mappings for a specific connector
export function useConnectorMappings(connectorId: string) {
  return useQuery({
    queryKey: ['integration-mappings', 'connector', connectorId],
    queryFn: async () => {
      const result = await universalApi.read({
        table: 'core_entities',
        filters: {
          entity_type: 'integration_mapping'
        }
      })
      // Filter by connector_id in metadata
      return result.data.filter(m => m.metadata?.connector_id === connectorId) as DataMapping[]
    },
    enabled: !!connectorId
  })
}

// Fetch a single mapping
export function useMapping(mappingId: string) {
  return useQuery({
    queryKey: ['integration-mapping', mappingId],
    queryFn: async () => {
      const result = await universalApi.read({
        table: 'core_entities',
        filters: {
          id: mappingId,
          entity_type: 'integration_mapping'
        }
      })
      return result.data[0] as DataMapping
    },
    enabled: !!mappingId
  })
}

// Create a new mapping
export function useCreateMapping() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      organizationId: string
      connectorId: string
      name: string
      resource: string
      fieldMappings: FieldMapping[]
      transformOperations?: TransformOperation[]
    }) => {
      const mapping = await universalApi.createEntity({
        entity_type: 'integration_mapping',
        entity_name: data.name,
        entity_code: `MAP-${data.resource.toUpperCase()}-${Date.now()}`,
        organization_id: data.organizationId,
        smart_code: `HERA.INTEGRATIONS.MAPPING.${data.resource.toUpperCase()}.v1`,
        metadata: {
          connector_id: data.connectorId,
          field_mappings: data.fieldMappings,
          transform_operations: data.transformOperations || [],
          validation_rules: []
        }
      })

      return mapping as DataMapping
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['integration-mappings', variables.organizationId]
      })
      queryClient.invalidateQueries({
        queryKey: ['integration-mappings', 'connector', variables.connectorId]
      })
      toast({
        title: 'Mapping created',
        description: 'Data mapping has been created successfully.'
      })
    },
    onError: error => {
      toast({
        title: 'Failed to create mapping',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Update a mapping
export function useUpdateMapping() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      mappingId: string
      organizationId: string
      updates: Partial<DataMapping>
    }) => {
      await universalApi.updateEntity({
        id: data.mappingId,
        metadata: data.updates
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['integration-mapping', variables.mappingId]
      })
      queryClient.invalidateQueries({
        queryKey: ['integration-mappings', variables.organizationId]
      })
      toast({
        title: 'Mapping updated',
        description: 'Data mapping has been updated successfully.'
      })
    },
    onError: error => {
      toast({
        title: 'Failed to update mapping',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Delete a mapping
export function useDeleteMapping() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { mappingId: string; organizationId: string }) => {
      await universalApi.deleteEntity(data.mappingId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['integration-mappings', variables.organizationId]
      })
      toast({
        title: 'Mapping deleted',
        description: 'Data mapping has been deleted successfully.'
      })
    },
    onError: error => {
      toast({
        title: 'Failed to delete mapping',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Test a mapping with sample data
export function useTestMapping() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { mappingId: string; sampleData: any }) => {
      const response = await fetch('/api/integration-hub/mappings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Mapping test failed')
      }

      return response.json()
    },
    onSuccess: data => {
      toast({
        title: 'Mapping test successful',
        description: 'Data mapping validated successfully with sample data.'
      })
    },
    onError: error => {
      toast({
        title: 'Mapping test failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Auto-generate field mappings based on schema analysis
export function useAutoGenerateMappings() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { sourceSchema: any; targetSchema: any }) => {
      const response = await fetch('/api/integration-hub/mappings/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to auto-generate mappings')
      }

      return response.json()
    },
    onSuccess: data => {
      toast({
        title: 'Mappings generated',
        description: `Successfully generated ${data.fieldMappings.length} field mappings.`
      })
    },
    onError: error => {
      toast({
        title: 'Auto-generation failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}
