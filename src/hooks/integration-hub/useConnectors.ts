import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { universalApi } from '@/lib/universal-api'
import type { IntegrationConnector, ConnectorConfig } from '@/types/integration-hub'
import { useToast } from '@/components/ui/use-toast'

// Fetch all connectors for an organization
export function useConnectors(organizationId: string) {
  return useQuery({
    queryKey: ['integration-connectors', organizationId],
    queryFn: async () => {
      const result = await universalApi.read({
        table: 'core_entities',
        filters: {
          entity_type: 'integration_connector',
          organization_id: organizationId
        }
      })
      return result.data as IntegrationConnector[]
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

// Fetch a single connector
export function useConnector(connectorId: string) {
  return useQuery({
    queryKey: ['integration-connector', connectorId],
    queryFn: async () => {
      const result = await universalApi.read({
        table: 'core_entities',
        filters: {
          id: connectorId,
          entity_type: 'integration_connector'
        }
      })
      return result.data[0] as IntegrationConnector
    },
    enabled: !!connectorId
  })
}

// Create a new connector
export function useCreateConnector() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      organizationId: string
      vendor: string
      name: string
      config: ConnectorConfig
    }) => {
      const connector = await universalApi.createEntity({
        entity_type: 'integration_connector',
        entity_name: data.name,
        entity_code: `CONN-${data.vendor.toUpperCase()}-${Date.now()}`,
        organization_id: data.organizationId,
        smart_code: `HERA.INTEGRATIONS.CONNECTOR.${data.vendor.toUpperCase()}.v1`,
        metadata: {
          vendor: data.vendor,
          status: 'configuring',
          config: data.config,
          capabilities: [],
          last_health_check: new Date().toISOString()
        }
      })

      return connector as IntegrationConnector
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['integration-connectors', variables.organizationId]
      })
      toast({
        title: 'Connector created',
        description: 'Integration connector has been created successfully.'
      })
    },
    onError: error => {
      toast({
        title: 'Failed to create connector',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Update connector configuration
export function useUpdateConnector() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      connectorId: string
      organizationId: string
      updates: Partial<IntegrationConnector>
    }) => {
      await universalApi.updateEntity({
        id: data.connectorId,
        metadata: data.updates
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['integration-connector', variables.connectorId]
      })
      queryClient.invalidateQueries({
        queryKey: ['integration-connectors', variables.organizationId]
      })
      toast({
        title: 'Connector updated',
        description: 'Integration connector has been updated successfully.'
      })
    },
    onError: error => {
      toast({
        title: 'Failed to update connector',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Delete a connector
export function useDeleteConnector() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { connectorId: string; organizationId: string }) => {
      await universalApi.deleteEntity(data.connectorId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['integration-connectors', variables.organizationId]
      })
      toast({
        title: 'Connector deleted',
        description: 'Integration connector has been deleted successfully.'
      })
    },
    onError: error => {
      toast({
        title: 'Failed to delete connector',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Test connector connection
export function useTestConnection() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (connectorId: string) => {
      const response = await fetch('/api/integration-hub/connectors/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectorId })
      })

      if (!response.ok) {
        throw new Error('Connection test failed')
      }

      return response.json()
    },
    onSuccess: data => {
      toast({
        title: 'Connection successful',
        description: 'Successfully connected to the integration service.'
      })
    },
    onError: error => {
      toast({
        title: 'Connection failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Get connector health status
export function useConnectorHealth(connectorId: string) {
  return useQuery({
    queryKey: ['integration-connector-health', connectorId],
    queryFn: async () => {
      const response = await fetch(`/api/integration-hub/connectors/${connectorId}/health`)
      if (!response.ok) {
        throw new Error('Failed to fetch health status')
      }
      return response.json()
    },
    enabled: !!connectorId,
    refetchInterval: 1000 * 60 // Refetch every minute
  })
}
