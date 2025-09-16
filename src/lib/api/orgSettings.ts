// ================================================================================
// ORGANIZATION SETTINGS API WRAPPER - SACRED SIX IMPLEMENTATION
// Smart Code: HERA.API.ORG_SETTINGS.v1
// Production-ready settings API using Sacred Six storage only
// ================================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  SalesPolicy, 
  Branch, 
  RoleGrant, 
  NotificationPolicy, 
  SystemSettings,
  UserRole,
  DEFAULT_ROLE_PERMISSIONS,
  SETTINGS_SMART_CODES,
  SETTINGS_DYNAMIC_DATA_KEYS
} from '@/src/lib/schemas/settings'
import { universalApi } from '@/src/lib/universal-api'

export function useOrgSettings(organizationId: string) {
  const queryClient = useQueryClient()

  // Query keys for React Query
  const keys = {
    salesPolicy: ['settings', 'salesPolicy', organizationId],
    branches: ['settings', 'branches', organizationId],
    roleGrants: ['settings', 'roleGrants', organizationId],
    notifications: ['settings', 'notifications', organizationId],
    systemSettings: ['settings', 'system', organizationId],
    featureFlags: ['settings', 'featureFlags', organizationId]
  }

  // ==================== SALES POLICY OPERATIONS ====================

  const getSalesPolicy = useQuery({
    queryKey: keys.salesPolicy,
    queryFn: async (): Promise<SalesPolicy> => {
      try {
        const result = await universalApi.getDynamicData(organizationId, SETTINGS_DYNAMIC_DATA_KEYS.SALES_POLICY)
        return result ? SalesPolicy.parse(result) : SalesPolicy.parse({})
      } catch (error) {
        console.error('Failed to get sales policy:', error)
        return SalesPolicy.parse({}) // Return defaults
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  const saveSalesPolicy = useMutation({
    mutationFn: async (policy: SalesPolicy): Promise<void> => {
      const parsedPolicy = SalesPolicy.parse({
        ...policy,
        updated_at: new Date().toISOString(),
        updated_by: 'current_user' // TODO: Get from auth context
      })

      await universalApi.setDynamicData(
        organizationId,
        SETTINGS_DYNAMIC_DATA_KEYS.SALES_POLICY,
        parsedPolicy,
        SETTINGS_SMART_CODES.SALES_POLICY_UPDATE
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.salesPolicy })
    }
  })

  // ==================== BRANCH OPERATIONS ====================

  const getBranches = useQuery({
    queryKey: keys.branches,
    queryFn: async (): Promise<Branch[]> => {
      try {
        const results = await universalApi.getEntities({
          organization_id: organizationId,
          entity_type: 'branch'
        })

        return results.map(entity => Branch.parse({
          organization_id: entity.organization_id,
          entity_type: entity.entity_type,
          entity_code: entity.entity_code,
          entity_name: entity.entity_name,
          smart_code: entity.smart_code,
          created_at: entity.created_at,
          updated_at: entity.updated_at,
          // Parse metadata for branch details
          ...entity.metadata,
          is_active: entity.metadata?.is_active ?? true
        }))
      } catch (error) {
        console.error('Failed to get branches:', error)
        return []
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  })

  const saveBranch = useMutation({
    mutationFn: async (branch: Branch): Promise<void> => {
      const parsedBranch = Branch.parse({
        ...branch,
        updated_at: new Date().toISOString()
      })

      // Check if branch exists
      const existingBranches = getBranches.data || []
      const existingBranch = existingBranches.find(b => b.entity_code === parsedBranch.entity_code)

      if (existingBranch) {
        // Update existing branch
        await universalApi.updateEntity(existingBranch.entity_code, {
          entity_name: parsedBranch.entity_name,
          smart_code: SETTINGS_SMART_CODES.BRANCH_UPDATE,
          metadata: {
            location: parsedBranch.location,
            contact: parsedBranch.contact,
            operating_hours: parsedBranch.operating_hours,
            is_active: parsedBranch.is_active,
            updated_at: parsedBranch.updated_at
          }
        })
      } else {
        // Create new branch
        await universalApi.createEntity({
          organization_id: organizationId,
          entity_type: 'branch',
          entity_code: parsedBranch.entity_code,
          entity_name: parsedBranch.entity_name,
          smart_code: SETTINGS_SMART_CODES.BRANCH_CREATE,
          metadata: {
            location: parsedBranch.location,
            contact: parsedBranch.contact,
            operating_hours: parsedBranch.operating_hours,
            is_active: parsedBranch.is_active,
            created_at: new Date().toISOString()
          }
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.branches })
    }
  })

  const deleteBranch = useMutation({
    mutationFn: async (branchCode: string): Promise<void> => {
      // Soft delete by setting is_active to false
      const branches = getBranches.data || []
      const branch = branches.find(b => b.entity_code === branchCode)
      
      if (branch) {
        await universalApi.updateEntity(branchCode, {
          metadata: {
            ...branch,
            is_active: false,
            updated_at: new Date().toISOString()
          }
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.branches })
    }
  })

  // ==================== ROLE GRANT OPERATIONS ====================

  const getRoleGrants = useQuery({
    queryKey: keys.roleGrants,
    queryFn: async (): Promise<RoleGrant[]> => {
      try {
        const result = await universalApi.getDynamicData(organizationId, SETTINGS_DYNAMIC_DATA_KEYS.ROLE_GRANTS)
        const grants = result || []
        return Array.isArray(grants) ? grants.map(g => RoleGrant.parse(g)) : []
      } catch (error) {
        console.error('Failed to get role grants:', error)
        return []
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  })

  const saveRoleGrant = useMutation({
    mutationFn: async (grant: RoleGrant): Promise<void> => {
      const parsedGrant = RoleGrant.parse({
        ...grant,
        granted_at: grant.granted_at || new Date().toISOString(),
        granted_by: grant.granted_by || 'current_user' // TODO: Get from auth context
      })

      const currentGrants = getRoleGrants.data || []
      const existingIndex = currentGrants.findIndex(g => g.user_email === parsedGrant.user_email)

      let updatedGrants: RoleGrant[]
      if (existingIndex >= 0) {
        // Update existing grant
        updatedGrants = [...currentGrants]
        updatedGrants[existingIndex] = parsedGrant
      } else {
        // Add new grant
        updatedGrants = [...currentGrants, parsedGrant]
      }

      await universalApi.setDynamicData(
        organizationId,
        SETTINGS_DYNAMIC_DATA_KEYS.ROLE_GRANTS,
        updatedGrants,
        SETTINGS_SMART_CODES.ROLE_GRANT
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.roleGrants })
    }
  })

  const revokeRoleGrant = useMutation({
    mutationFn: async (userEmail: string): Promise<void> => {
      const currentGrants = getRoleGrants.data || []
      const updatedGrants = currentGrants.filter(g => g.user_email !== userEmail)

      await universalApi.setDynamicData(
        organizationId,
        SETTINGS_DYNAMIC_DATA_KEYS.ROLE_GRANTS,
        updatedGrants,
        SETTINGS_SMART_CODES.ROLE_REVOKE
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.roleGrants })
    }
  })

  // ==================== NOTIFICATION POLICY OPERATIONS ====================

  const getNotificationPolicy = useQuery({
    queryKey: keys.notifications,
    queryFn: async (): Promise<NotificationPolicy> => {
      try {
        const result = await universalApi.getDynamicData(organizationId, SETTINGS_DYNAMIC_DATA_KEYS.NOTIFICATION_POLICY)
        return result ? NotificationPolicy.parse(result) : NotificationPolicy.parse({})
      } catch (error) {
        console.error('Failed to get notification policy:', error)
        return NotificationPolicy.parse({}) // Return defaults
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  const saveNotificationPolicy = useMutation({
    mutationFn: async (policy: NotificationPolicy): Promise<void> => {
      const parsedPolicy = NotificationPolicy.parse({
        ...policy,
        updated_at: new Date().toISOString(),
        updated_by: 'current_user' // TODO: Get from auth context
      })

      await universalApi.setDynamicData(
        organizationId,
        SETTINGS_DYNAMIC_DATA_KEYS.NOTIFICATION_POLICY,
        parsedPolicy,
        SETTINGS_SMART_CODES.NOTIFICATION_POLICY_UPDATE
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.notifications })
    }
  })

  // ==================== SYSTEM SETTINGS OPERATIONS ====================

  const getSystemSettings = useQuery({
    queryKey: keys.systemSettings,
    queryFn: async (): Promise<SystemSettings> => {
      try {
        const result = await universalApi.getDynamicData(organizationId, SETTINGS_DYNAMIC_DATA_KEYS.SYSTEM_SETTINGS)
        
        // Get organization info from core_entities
        const orgEntity = await universalApi.getEntity(organizationId, organizationId)
        
        const systemSettings = result ? SystemSettings.parse(result) : SystemSettings.parse({})
        
        // Merge with organization info
        if (orgEntity) {
          systemSettings.organization_info = {
            name: orgEntity.entity_name,
            code: orgEntity.entity_code,
            registration_number: orgEntity.metadata?.registration_number,
            tax_number: orgEntity.metadata?.tax_number,
            industry: orgEntity.metadata?.industry,
            established_date: orgEntity.created_at,
            website: orgEntity.metadata?.website,
            logo_url: orgEntity.metadata?.logo_url
          }
        }

        return systemSettings
      } catch (error) {
        console.error('Failed to get system settings:', error)
        return SystemSettings.parse({}) // Return defaults
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  const saveSystemSettings = useMutation({
    mutationFn: async (settings: SystemSettings): Promise<void> => {
      const parsedSettings = SystemSettings.parse({
        ...settings,
        updated_at: new Date().toISOString(),
        updated_by: 'current_user' // TODO: Get from auth context
      })

      await universalApi.setDynamicData(
        organizationId,
        SETTINGS_DYNAMIC_DATA_KEYS.SYSTEM_SETTINGS,
        parsedSettings,
        SETTINGS_SMART_CODES.SYSTEM_SETTINGS_UPDATE
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.systemSettings })
    }
  })

  // ==================== FEATURE FLAGS OPERATIONS ====================

  const getFeatureFlags = useQuery({
    queryKey: keys.featureFlags,
    queryFn: async (): Promise<SystemSettings['feature_flags']> => {
      try {
        const systemSettings = await universalApi.getDynamicData(organizationId, SETTINGS_DYNAMIC_DATA_KEYS.SYSTEM_SETTINGS)
        return systemSettings?.feature_flags || SystemSettings.parse({}).feature_flags
      } catch (error) {
        console.error('Failed to get feature flags:', error)
        return SystemSettings.parse({}).feature_flags
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  const updateFeatureFlag = useMutation({
    mutationFn: async ({ flag, enabled }: { flag: string; enabled: boolean }): Promise<void> => {
      const currentSettings = getSystemSettings.data || SystemSettings.parse({})
      const updatedFeatureFlags = {
        ...currentSettings.feature_flags,
        [flag]: enabled
      }

      await saveSystemSettings.mutateAsync({
        ...currentSettings,
        feature_flags: updatedFeatureFlags
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.systemSettings })
      queryClient.invalidateQueries({ queryKey: keys.featureFlags })
    }
  })

  // ==================== HELPER FUNCTIONS ====================

  const getUserPermissions = (userEmail: string): typeof DEFAULT_ROLE_PERMISSIONS['owner'] => {
    const roleGrants = getRoleGrants.data || []
    const userGrant = roleGrants.find(g => g.user_email === userEmail && g.is_active)
    
    if (!userGrant || userGrant.roles.length === 0) {
      return DEFAULT_ROLE_PERMISSIONS.stylist // Default minimal permissions
    }

    // Merge permissions from all assigned roles
    let mergedPermissions = { ...DEFAULT_ROLE_PERMISSIONS.stylist }
    
    for (const role of userGrant.roles) {
      const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role]
      Object.keys(rolePermissions).forEach(permission => {
        if (rolePermissions[permission as keyof typeof rolePermissions]) {
          mergedPermissions[permission as keyof typeof mergedPermissions] = true
        }
      })
    }

    return mergedPermissions
  }

  const hasPermission = (userEmail: string, permission: keyof typeof DEFAULT_ROLE_PERMISSIONS['owner']): boolean => {
    const permissions = getUserPermissions(userEmail)
    return permissions[permission] || false
  }

  const getUserRoles = (userEmail: string): UserRole[] => {
    const roleGrants = getRoleGrants.data || []
    const userGrant = roleGrants.find(g => g.user_email === userEmail && g.is_active)
    return userGrant?.roles || []
  }

  return {
    // Sales policy
    salesPolicy: getSalesPolicy.data,
    isSalesPolicyLoading: getSalesPolicy.isLoading,
    salesPolicyError: getSalesPolicy.error,
    saveSalesPolicy,

    // Branches
    branches: getBranches.data || [],
    isBranchesLoading: getBranches.isLoading,
    branchesError: getBranches.error,
    saveBranch,
    deleteBranch,

    // Role grants
    roleGrants: getRoleGrants.data || [],
    isRoleGrantsLoading: getRoleGrants.isLoading,
    roleGrantsError: getRoleGrants.error,
    saveRoleGrant,
    revokeRoleGrant,

    // Notification policy
    notificationPolicy: getNotificationPolicy.data,
    isNotificationPolicyLoading: getNotificationPolicy.isLoading,
    notificationPolicyError: getNotificationPolicy.error,
    saveNotificationPolicy,

    // System settings
    systemSettings: getSystemSettings.data,
    isSystemSettingsLoading: getSystemSettings.isLoading,
    systemSettingsError: getSystemSettings.error,
    saveSystemSettings,

    // Feature flags
    featureFlags: getFeatureFlags.data,
    isFeatureFlagsLoading: getFeatureFlags.isLoading,
    featureFlagsError: getFeatureFlags.error,
    updateFeatureFlag,

    // Helper functions
    getUserPermissions,
    hasPermission,
    getUserRoles,

    // Query invalidation
    refetch: {
      salesPolicy: () => queryClient.invalidateQueries({ queryKey: keys.salesPolicy }),
      branches: () => queryClient.invalidateQueries({ queryKey: keys.branches }),
      roleGrants: () => queryClient.invalidateQueries({ queryKey: keys.roleGrants }),
      notifications: () => queryClient.invalidateQueries({ queryKey: keys.notifications }),
      systemSettings: () => queryClient.invalidateQueries({ queryKey: keys.systemSettings }),
      all: () => queryClient.invalidateQueries({ queryKey: ['settings', organizationId] })
    }
  }
}