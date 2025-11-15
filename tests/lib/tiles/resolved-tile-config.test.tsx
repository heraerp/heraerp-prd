/**
 * HERA Universal Tile System - ResolvedTileConfig Unit Tests
 * Comprehensive test suite for tile configuration merging and resolution
 */

import { describe, it, expect } from 'vitest'
import { resolveTileConfig } from '@/lib/tiles/resolved-tile-config'
import type { TileTemplate, WorkspaceTile } from '@/lib/tiles/resolved-tile-config'

describe('resolveTileConfig', () => {
  const mockTemplate: TileTemplate = {
    templateId: 'entities-template-1',
    tileType: 'ENTITIES',
    operationCategory: 'data_management',
    
    ui: {
      title: 'Template Title',
      subtitle: 'Template Subtitle',
      icon: 'Database',
      color: '#3B82F6',
      gradient: 'from-blue-500 to-blue-600'
    },
    
    layout: {
      size: 'medium',
      position: 1
    },
    
    conditions: [
      {
        field: 'user_role',
        operator: 'equals',
        value: 'admin'
      }
    ],
    
    stats: [
      {
        statId: 'total-entities',
        label: 'Total Entities',
        query: {
          table: 'core_entities',
          operation: 'count',
          conditions: []
        },
        format: 'number',
        isPrivate: false
      },
      {
        statId: 'recent-entities',
        label: 'Recent Entities',
        query: {
          table: 'core_entities',
          operation: 'count',
          conditions: [
            { field: 'created_at', operator: 'greater_than', value: '{{last_7_days}}' }
          ]
        },
        format: 'number',
        isPrivate: false
      }
    ],
    
    actions: [
      {
        actionId: 'view-entities',
        label: 'View All',
        icon: 'Eye',
        actionType: 'NAVIGATE',
        isPrimary: true,
        requiresConfirmation: false,
        requiresPermission: false,
        route: '/entities',
        parameters: {}
      },
      {
        actionId: 'create-entity',
        label: 'Create New',
        icon: 'Plus',
        actionType: 'NAVIGATE',
        isPrimary: false,
        requiresConfirmation: false,
        requiresPermission: true,
        route: '/entities/new',
        parameters: {}
      }
    ]
  }

  const mockWorkspaceTile: WorkspaceTile = {
    tileId: 'workspace-tile-1',
    workspaceId: 'harbour-workspace',
    templateId: 'entities-template-1',
    enabled: true,
    
    // Override some template values
    ui: {
      title: 'Customer Entities',
      subtitle: 'Manage customer data',
      // icon and color inherited from template
    },
    
    layout: {
      size: 'large',
      position: 3
      // Other layout properties inherited from template
    },
    
    conditions: [
      // Additional condition
      {
        field: 'organization_type',
        operator: 'equals',
        value: 'enterprise'
      }
    ],
    
    stats: [
      // Override first stat
      {
        statId: 'total-entities',
        label: 'Total Customers',
        query: {
          table: 'core_entities',
          operation: 'count',
          conditions: [
            { field: 'entity_type', operator: 'equals', value: 'CUSTOMER' }
          ]
        },
        format: 'number',
        isPrivate: false
      }
      // Second stat inherited from template
    ],
    
    actions: [
      // Override first action
      {
        actionId: 'view-entities',
        label: 'View Customers',
        icon: 'Eye',
        actionType: 'NAVIGATE',
        isPrimary: true,
        requiresConfirmation: false,
        requiresPermission: false,
        route: '/customers',
        parameters: { type: 'CUSTOMER' }
      }
      // Second action inherited from template
    ]
  }

  describe('Basic Merging', () => {
    it('merges template and workspace tile correctly', () => {
      const result = resolveTileConfig(mockTemplate, mockWorkspaceTile)

      expect(result).toEqual({
        tileId: 'workspace-tile-1',
        workspaceId: 'harbour-workspace',
        templateId: 'entities-template-1',
        tileType: 'ENTITIES',
        operationCategory: 'data_management',
        enabled: true,
        
        ui: {
          title: 'Customer Entities', // Overridden
          subtitle: 'Manage customer data', // Overridden
          icon: 'Database', // Inherited
          color: '#3B82F6', // Inherited
          gradient: 'from-blue-500 to-blue-600' // Inherited
        },
        
        layout: {
          size: 'large', // Overridden
          position: 3 // Overridden
        },
        
        conditions: [
          // Template conditions
          {
            field: 'user_role',
            operator: 'equals',
            value: 'admin'
          },
          // Workspace conditions (merged)
          {
            field: 'organization_type',
            operator: 'equals',
            value: 'enterprise'
          }
        ],
        
        stats: [
          // Overridden stat
          {
            statId: 'total-entities',
            label: 'Total Customers',
            query: {
              table: 'core_entities',
              operation: 'count',
              conditions: [
                { field: 'entity_type', operator: 'equals', value: 'CUSTOMER' }
              ]
            },
            format: 'number',
            isPrivate: false
          },
          // Inherited stat
          {
            statId: 'recent-entities',
            label: 'Recent Entities',
            query: {
              table: 'core_entities',
              operation: 'count',
              conditions: [
                { field: 'created_at', operator: 'greater_than', value: '{{last_7_days}}' }
              ]
            },
            format: 'number',
            isPrivate: false
          }
        ],
        
        actions: [
          // Overridden action
          {
            actionId: 'view-entities',
            label: 'View Customers',
            icon: 'Eye',
            actionType: 'NAVIGATE',
            isPrimary: true,
            requiresConfirmation: false,
            requiresPermission: false,
            route: '/customers',
            parameters: { type: 'CUSTOMER' }
          },
          // Inherited action
          {
            actionId: 'create-entity',
            label: 'Create New',
            icon: 'Plus',
            actionType: 'NAVIGATE',
            isPrimary: false,
            requiresConfirmation: false,
            requiresPermission: true,
            route: '/entities/new',
            parameters: {}
          }
        ]
      })
    })

    it('handles template-only configuration', () => {
      const minimalWorkspaceTile: WorkspaceTile = {
        tileId: 'minimal-tile',
        workspaceId: 'test-workspace',
        templateId: 'entities-template-1',
        enabled: true,
        
        ui: {},
        layout: {},
        conditions: [],
        stats: [],
        actions: []
      }

      const result = resolveTileConfig(mockTemplate, minimalWorkspaceTile)

      // Should inherit everything from template
      expect(result.ui.title).toBe('Template Title')
      expect(result.ui.subtitle).toBe('Template Subtitle')
      expect(result.ui.icon).toBe('Database')
      expect(result.layout.size).toBe('medium')
      expect(result.stats).toHaveLength(2)
      expect(result.actions).toHaveLength(2)
    })
  })

  describe('Property Inheritance', () => {
    it('inherits UI properties correctly', () => {
      const workspaceTileWithPartialUI: WorkspaceTile = {
        ...mockWorkspaceTile,
        ui: {
          title: 'Custom Title'
          // All other UI properties should be inherited
        }
      }

      const result = resolveTileConfig(mockTemplate, workspaceTileWithPartialUI)

      expect(result.ui).toEqual({
        title: 'Custom Title', // Overridden
        subtitle: 'Template Subtitle', // Inherited
        icon: 'Database', // Inherited
        color: '#3B82F6', // Inherited
        gradient: 'from-blue-500 to-blue-600' // Inherited
      })
    })

    it('inherits layout properties correctly', () => {
      const workspaceTileWithPartialLayout: WorkspaceTile = {
        ...mockWorkspaceTile,
        layout: {
          position: 5
          // Size should be inherited from template
        }
      }

      const result = resolveTileConfig(mockTemplate, workspaceTileWithPartialLayout)

      expect(result.layout).toEqual({
        size: 'medium', // Inherited from template
        position: 5 // Overridden
      })
    })

    it('merges conditions arrays correctly', () => {
      const result = resolveTileConfig(mockTemplate, mockWorkspaceTile)

      expect(result.conditions).toHaveLength(2)
      expect(result.conditions).toContainEqual({
        field: 'user_role',
        operator: 'equals',
        value: 'admin'
      })
      expect(result.conditions).toContainEqual({
        field: 'organization_type',
        operator: 'equals',
        value: 'enterprise'
      })
    })
  })

  describe('Stats Merging', () => {
    it('overrides stats by statId', () => {
      const result = resolveTileConfig(mockTemplate, mockWorkspaceTile)

      const totalEntitiesStat = result.stats.find(s => s.statId === 'total-entities')
      expect(totalEntitiesStat).toBeDefined()
      expect(totalEntitiesStat?.label).toBe('Total Customers') // Overridden
      expect(totalEntitiesStat?.query.conditions).toHaveLength(1) // Custom condition

      const recentEntitiesStat = result.stats.find(s => s.statId === 'recent-entities')
      expect(recentEntitiesStat).toBeDefined()
      expect(recentEntitiesStat?.label).toBe('Recent Entities') // Inherited
    })

    it('adds new stats from workspace tile', () => {
      const workspaceTileWithNewStat: WorkspaceTile = {
        ...mockWorkspaceTile,
        stats: [
          ...mockWorkspaceTile.stats!,
          {
            statId: 'active-entities',
            label: 'Active Entities',
            query: {
              table: 'core_entities',
              operation: 'count',
              conditions: [
                { field: 'status', operator: 'equals', value: 'active' }
              ]
            },
            format: 'number',
            isPrivate: false
          }
        ]
      }

      const result = resolveTileConfig(mockTemplate, workspaceTileWithNewStat)

      expect(result.stats).toHaveLength(3)
      const activeStat = result.stats.find(s => s.statId === 'active-entities')
      expect(activeStat).toBeDefined()
      expect(activeStat?.label).toBe('Active Entities')
    })

    it('preserves stat order (workspace overrides first, then template)', () => {
      const result = resolveTileConfig(mockTemplate, mockWorkspaceTile)

      expect(result.stats[0].statId).toBe('total-entities') // Overridden
      expect(result.stats[1].statId).toBe('recent-entities') // Inherited
    })
  })

  describe('Actions Merging', () => {
    it('overrides actions by actionId', () => {
      const result = resolveTileConfig(mockTemplate, mockWorkspaceTile)

      const viewAction = result.actions.find(a => a.actionId === 'view-entities')
      expect(viewAction).toBeDefined()
      expect(viewAction?.label).toBe('View Customers') // Overridden
      expect(viewAction?.route).toBe('/customers') // Overridden
      expect(viewAction?.parameters).toEqual({ type: 'CUSTOMER' }) // Overridden

      const createAction = result.actions.find(a => a.actionId === 'create-entity')
      expect(createAction).toBeDefined()
      expect(createAction?.label).toBe('Create New') // Inherited
      expect(createAction?.route).toBe('/entities/new') // Inherited
    })

    it('adds new actions from workspace tile', () => {
      const workspaceTileWithNewAction: WorkspaceTile = {
        ...mockWorkspaceTile,
        actions: [
          ...mockWorkspaceTile.actions!,
          {
            actionId: 'export-entities',
            label: 'Export Data',
            icon: 'Download',
            actionType: 'API_CALL',
            isPrimary: false,
            requiresConfirmation: true,
            requiresPermission: true,
            route: '',
            parameters: { format: 'csv' }
          }
        ]
      }

      const result = resolveTileConfig(mockTemplate, workspaceTileWithNewAction)

      expect(result.actions).toHaveLength(3)
      const exportAction = result.actions.find(a => a.actionId === 'export-entities')
      expect(exportAction).toBeDefined()
      expect(exportAction?.label).toBe('Export Data')
      expect(exportAction?.requiresConfirmation).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles disabled workspace tiles', () => {
      const disabledWorkspaceTile: WorkspaceTile = {
        ...mockWorkspaceTile,
        enabled: false
      }

      const result = resolveTileConfig(mockTemplate, disabledWorkspaceTile)

      expect(result.enabled).toBe(false)
    })

    it('handles empty template arrays', () => {
      const emptyTemplate: TileTemplate = {
        ...mockTemplate,
        conditions: [],
        stats: [],
        actions: []
      }

      const result = resolveTileConfig(emptyTemplate, mockWorkspaceTile)

      expect(result.conditions).toHaveLength(1) // Only workspace conditions
      expect(result.stats).toHaveLength(1) // Only workspace stats
      expect(result.actions).toHaveLength(1) // Only workspace actions
    })

    it('handles empty workspace tile arrays', () => {
      const emptyWorkspaceTile: WorkspaceTile = {
        ...mockWorkspaceTile,
        conditions: [],
        stats: [],
        actions: []
      }

      const result = resolveTileConfig(mockTemplate, emptyWorkspaceTile)

      expect(result.conditions).toHaveLength(1) // Only template conditions
      expect(result.stats).toHaveLength(2) // Only template stats
      expect(result.actions).toHaveLength(2) // Only template actions
    })

    it('handles missing UI properties', () => {
      const templateWithMissingUI: TileTemplate = {
        ...mockTemplate,
        ui: {
          title: 'Template Title',
          icon: 'Database',
          color: '#3B82F6'
          // Missing subtitle and gradient
        }
      }

      const workspaceTileWithMissingUI: WorkspaceTile = {
        ...mockWorkspaceTile,
        ui: {
          title: 'Workspace Title'
          // Missing other properties
        }
      }

      const result = resolveTileConfig(templateWithMissingUI, workspaceTileWithMissingUI)

      expect(result.ui).toEqual({
        title: 'Workspace Title', // Overridden
        icon: 'Database', // Inherited
        color: '#3B82F6', // Inherited
        subtitle: undefined, // Not defined in either
        gradient: undefined // Not defined in either
      })
    })

    it('handles complex nested parameter merging', () => {
      const templateWithComplexParams: TileTemplate = {
        ...mockTemplate,
        actions: [
          {
            actionId: 'complex-action',
            label: 'Complex Action',
            icon: 'Settings',
            actionType: 'API_CALL',
            isPrimary: false,
            requiresConfirmation: false,
            requiresPermission: false,
            route: '/api/complex',
            parameters: {
              filters: {
                status: 'active',
                type: 'default'
              },
              options: {
                format: 'json',
                limit: 100
              }
            }
          }
        ]
      }

      const workspaceTileWithComplexParams: WorkspaceTile = {
        ...mockWorkspaceTile,
        actions: [
          {
            actionId: 'complex-action',
            label: 'Custom Complex Action',
            icon: 'Settings',
            actionType: 'API_CALL',
            isPrimary: false,
            requiresConfirmation: false,
            requiresPermission: false,
            route: '/api/custom-complex',
            parameters: {
              filters: {
                status: 'all', // Override
                category: 'premium' // Add new
              },
              options: {
                limit: 250 // Override
                // format inherited
              },
              metadata: {
                source: 'workspace'
              }
            }
          }
        ]
      }

      const result = resolveTileConfig(templateWithComplexParams, workspaceTileWithComplexParams)

      const complexAction = result.actions.find(a => a.actionId === 'complex-action')
      expect(complexAction?.parameters).toEqual({
        filters: {
          status: 'all', // Overridden
          category: 'premium' // Added
          // type: 'default' should not be inherited in this case due to object replacement
        },
        options: {
          limit: 250, // Overridden
          // format: 'json' should not be inherited due to object replacement
        },
        metadata: {
          source: 'workspace' // Added
        }
      })
    })

    it('preserves type information correctly', () => {
      const result = resolveTileConfig(mockTemplate, mockWorkspaceTile)

      expect(typeof result.tileId).toBe('string')
      expect(typeof result.enabled).toBe('boolean')
      expect(Array.isArray(result.conditions)).toBe(true)
      expect(Array.isArray(result.stats)).toBe(true)
      expect(Array.isArray(result.actions)).toBe(true)
    })
  })
})