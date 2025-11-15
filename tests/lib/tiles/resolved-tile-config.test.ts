/**
 * HERA Universal Tile System - Resolved Tile Configuration Tests
 * Validates the merge logic and runtime shape
 * Smart Code: HERA.PLATFORM.UI.TEST.RESOLVED_CONFIG.v1
 */

import { describe, it, expect } from 'vitest'
import { 
  resolveTileConfig,
  TileTemplateConfig,
  WorkspaceTileRow,
  DynamicFieldMap,
  EXAMPLE_HARBOUR_ENTITIES_TILE,
  EXAMPLE_HARBOUR_TRANSACTIONS_TILE
} from '@/lib/tiles/resolved-tile-config'

// ================================================================================
// TEST DATA
// ================================================================================

const mockWorkspaceTile: WorkspaceTileRow = {
  id: "64d3c4af-9b5d-4164-a1a4-cf5a6c8bdd38",
  entity_code: "NAV-TILE-PROCUREMENT-HARBOUR_INTAKE-ENTITIES",
  entity_name: "Harbour Intake Master Data",
  parent_entity_id: "5e24049d-42d2-4e65-991b-05ef511447d3",
  organization_id: "699453c2-950e-4456-9fc0-c0c71efa78fb"
}

const mockEntitiesTemplate: TileTemplateConfig = {
  code: "TILE_TPL_ENTITIES",
  smart_code: "HERA.PLATFORM.UI.TILE.TPL.ENTITIES.v1",
  tile_type: "ENTITIES",
  operation_category: "MASTER_DATA",
  ui_schema: {
    default_icon: "Database",
    default_color: "#10B981",
    default_gradient: "from-blue-500 to-blue-600",
    subtitle: "Entity master data",
    description: "Manage entity records"
  },
  action_templates: [
    {
      action_id: "list",
      label: "View All",
      icon: "List",
      action_type: "NAVIGATE",
      route_pattern: "/{workspace_path}/entities",
      is_primary: true
    },
    {
      action_id: "create",
      label: "Create New",
      icon: "Plus",
      action_type: "NAVIGATE",
      route_pattern: "/{workspace_path}/entities/new",
      requires_permission: "{entity_type}.create"
    }
  ],
  stat_templates: [
    {
      stat_id: "total_count",
      label: "Total Records",
      query_type: "count",
      aggregation: { field: "*", operation: "count" },
      filter: {
        all: [
          { field: "organization_id", operator: "eq", value: "{{organization_id}}" },
          { field: "entity_type", operator: "in", value: "{{entity_types}}" }
        ]
      }
    }
  ],
  default_layout_config: {
    default_size: "medium",
    resizable: true
  }
}

const mockDynamicData: DynamicFieldMap = {
  tile_position: 1,
  is_enabled: true,
  custom_overrides: {
    title: "Harbour Masters",
    subtitle: "Harbour, Vessel & Party master data"
  },
  entity_type_filter: {
    include: ["HARBOUR", "VESSEL", "SUPPLIER", "CUSTOMER"],
    categoryFilter: "AGRO_LOGISTICS"
  }
}

// ================================================================================
// TESTS
// ================================================================================

describe('Resolved Tile Configuration', () => {
  describe('resolveTileConfig', () => {
    it('should merge template and workspace tile correctly', () => {
      const resolved = resolveTileConfig({
        workspaceTile: mockWorkspaceTile,
        tileDynamic: mockDynamicData,
        template: mockEntitiesTemplate
      })

      expect(resolved).toEqual({
        tileId: mockWorkspaceTile.id,
        workspaceId: mockWorkspaceTile.parent_entity_id,
        organizationId: mockWorkspaceTile.organization_id,
        tileCode: mockWorkspaceTile.entity_code,
        tileName: mockWorkspaceTile.entity_name,
        tileType: "ENTITIES",
        operationCategory: "MASTER_DATA",
        templateCode: mockEntitiesTemplate.code,
        templateSmartCode: mockEntitiesTemplate.smart_code,
        layout: {
          position: 1,
          size: "medium",
          resizable: true
        },
        ui: {
          icon: "Database",
          color: "#10B981",
          gradient: "from-blue-500 to-blue-600",
          title: "Harbour Masters",
          subtitle: "Harbour, Vessel & Party master data",
          description: "Manage entity records"
        },
        entityScope: {
          include: ["HARBOUR", "VESSEL", "SUPPLIER", "CUSTOMER"],
          categoryFilter: "AGRO_LOGISTICS"
        },
        transactionScope: undefined,
        actions: [
          {
            actionId: "list",
            label: "View All",
            icon: "List",
            actionType: "NAVIGATE",
            routePattern: "/{workspace_path}/entities",
            apiEndpoint: undefined,
            requiresPermission: undefined,
            visibleWhen: undefined,
            disabledWhen: undefined,
            isPrimary: true,
            requiresConfirmation: false
          },
          {
            actionId: "create",
            label: "Create New",
            icon: "Plus",
            actionType: "NAVIGATE",
            routePattern: "/{workspace_path}/entities/new",
            apiEndpoint: undefined,
            requiresPermission: "{entity_type}.create",
            visibleWhen: undefined,
            disabledWhen: undefined,
            isPrimary: false,
            requiresConfirmation: false
          }
        ],
        stats: [
          {
            statId: "total_count",
            label: "Total Records",
            queryType: "count",
            aggregation: { field: "*", operation: "count" },
            format: undefined,
            filter: {
              all: [
                { field: "organization_id", operator: "eq", value: "{{organization_id}}" },
                { field: "entity_type", operator: "in", value: "{{entity_types}}" }
              ]
            }
          }
        ],
        visibilityRules: undefined
      })
    })

    it('should handle custom overrides correctly', () => {
      const customDynamic: DynamicFieldMap = {
        tile_position: 3,
        custom_overrides: {
          size: "large",
          icon: "Building",
          color: "#FF6B6B",
          title: "Custom Title"
        }
      }

      const resolved = resolveTileConfig({
        workspaceTile: mockWorkspaceTile,
        tileDynamic: customDynamic,
        template: mockEntitiesTemplate
      })

      expect(resolved.layout.position).toBe(3)
      expect(resolved.layout.size).toBe("large")
      expect(resolved.ui.icon).toBe("Building")
      expect(resolved.ui.color).toBe("#FF6B6B")
      expect(resolved.ui.title).toBe("Custom Title")
    })

    it('should handle disabled actions', () => {
      const dynamicWithDisabledActions: DynamicFieldMap = {
        disabled_actions: ["create"]
      }

      const resolved = resolveTileConfig({
        workspaceTile: mockWorkspaceTile,
        tileDynamic: dynamicWithDisabledActions,
        template: mockEntitiesTemplate
      })

      expect(resolved.actions).toHaveLength(1)
      expect(resolved.actions[0].actionId).toBe("list")
    })

    it('should handle enabled actions filter', () => {
      const dynamicWithEnabledActions: DynamicFieldMap = {
        enabled_actions: ["list"]
      }

      const resolved = resolveTileConfig({
        workspaceTile: mockWorkspaceTile,
        tileDynamic: dynamicWithEnabledActions,
        template: mockEntitiesTemplate
      })

      expect(resolved.actions).toHaveLength(1)
      expect(resolved.actions[0].actionId).toBe("list")
    })

    it('should handle transaction scope for TRANSACTIONS tiles', () => {
      const transactionTemplate: TileTemplateConfig = {
        ...mockEntitiesTemplate,
        tile_type: "TRANSACTIONS",
        operation_category: "FINANCIAL"
      }

      const dynamicWithTxnScope: DynamicFieldMap = {
        transaction_type_filter: {
          include: ["AGRO_HARBOUR_INTAKE"],
          statusFilter: ["DRAFT", "PENDING"]
        }
      }

      const resolved = resolveTileConfig({
        workspaceTile: mockWorkspaceTile,
        tileDynamic: dynamicWithTxnScope,
        template: transactionTemplate
      })

      expect(resolved.tileType).toBe("TRANSACTIONS")
      expect(resolved.transactionScope).toEqual({
        include: ["AGRO_HARBOUR_INTAKE"],
        statusFilter: ["DRAFT", "PENDING"]
      })
      expect(resolved.entityScope).toBeUndefined()
    })
  })

  describe('Example configurations', () => {
    it('should have valid harbour entities tile example', () => {
      const tile = EXAMPLE_HARBOUR_ENTITIES_TILE

      expect(tile.tileType).toBe("ENTITIES")
      expect(tile.operationCategory).toBe("MASTER_DATA")
      expect(tile.entityScope?.include).toContain("HARBOUR")
      expect(tile.actions).toHaveLength(4)
      expect(tile.stats).toHaveLength(2)
      expect(tile.layout.position).toBe(1)
      expect(tile.ui.title).toBe("Harbour Masters")
    })

    it('should have valid harbour transactions tile example', () => {
      const tile = EXAMPLE_HARBOUR_TRANSACTIONS_TILE

      expect(tile.tileType).toBe("TRANSACTIONS")
      expect(tile.operationCategory).toBe("FINANCIAL")
      expect(tile.transactionScope?.include).toContain("AGRO_HARBOUR_INTAKE")
      expect(tile.actions).toHaveLength(4)
      expect(tile.stats).toHaveLength(3)
      expect(tile.layout.position).toBe(2)
      expect(tile.ui.title).toBe("Harbour Intake")
    })

    it('should have consistent organization IDs in examples', () => {
      const orgId = "699453c2-950e-4456-9fc0-c0c71efa78fb"
      
      expect(EXAMPLE_HARBOUR_ENTITIES_TILE.organizationId).toBe(orgId)
      expect(EXAMPLE_HARBOUR_TRANSACTIONS_TILE.organizationId).toBe(orgId)
    })

    it('should have consistent workspace IDs in examples', () => {
      const workspaceId = "5e24049d-42d2-4e65-991b-05ef511447d3"
      
      expect(EXAMPLE_HARBOUR_ENTITIES_TILE.workspaceId).toBe(workspaceId)
      expect(EXAMPLE_HARBOUR_TRANSACTIONS_TILE.workspaceId).toBe(workspaceId)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty dynamic data', () => {
      const resolved = resolveTileConfig({
        workspaceTile: mockWorkspaceTile,
        tileDynamic: {},
        template: mockEntitiesTemplate
      })

      expect(resolved.layout.position).toBe(1) // default
      expect(resolved.layout.size).toBe("medium") // from template
      expect(resolved.ui.title).toBe(mockWorkspaceTile.entity_name) // fallback
    })

    it('should handle missing template layout config', () => {
      const templateNoLayout: TileTemplateConfig = {
        ...mockEntitiesTemplate,
        default_layout_config: undefined
      }

      const resolved = resolveTileConfig({
        workspaceTile: mockWorkspaceTile,
        tileDynamic: {},
        template: templateNoLayout
      })

      expect(resolved.layout.size).toBe("medium") // fallback
      expect(resolved.layout.resizable).toBe(true) // fallback
    })

    it('should preserve action order from template', () => {
      const resolved = resolveTileConfig({
        workspaceTile: mockWorkspaceTile,
        tileDynamic: {},
        template: mockEntitiesTemplate
      })

      expect(resolved.actions[0].actionId).toBe("list")
      expect(resolved.actions[1].actionId).toBe("create")
    })
  })
})