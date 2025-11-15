/**
 * HERA Universal Tile System - Resolved Tile Configuration
 * Runtime shape for frontend consumption after template + workspace tile merge
 * Smart Code: HERA.PLATFORM.UI.TILE.RESOLVED_CONFIG.v1
 */

import { ConditionExpression } from './dsl-types'

// ================================================================================
// CORE TYPES
// ================================================================================

export type TileKind = 'ENTITIES' | 'TRANSACTIONS' | 'WORKFLOW' | 'RELATIONSHIPS' | 'ANALYTICS'

export type OperationCategory =
  | 'MASTER_DATA'
  | 'FINANCIAL' 
  | 'PROCESS'
  | 'GRAPH'
  | 'REPORTING'

// ================================================================================
// LAYOUT & UI CONFIGURATION
// ================================================================================

export interface ResolvedTileLayout {
  position: number         // from tile_position
  size: 'small' | 'medium' | 'large' | 'wide' | 'tall'
  resizable: boolean
}

export interface ResolvedTileUI {
  icon: string            // e.g. "Database", "Receipt"
  color: string           // hex color
  gradient?: string       // tailwind class string
  title: string
  subtitle?: string
  description?: string
}

// ================================================================================
// SCOPE DEFINITIONS
// ================================================================================

export interface ResolvedEntityScope {
  include?: string[]      // ["HARBOUR", "VESSEL", ...]
  exclude?: string[]
  categoryFilter?: string // "AGRO_LOGISTICS"
}

export interface ResolvedTransactionScope {
  include?: string[]      // ["AGRO_HARBOUR_INTAKE"]
  statusFilter?: string[] // ["DRAFT","PENDING","POSTED"]
}

// ================================================================================
// ACTION CONFIGURATION
// ================================================================================

export interface ResolvedTileAction {
  actionId: string
  label: string
  icon: string

  actionType: 'NAVIGATE' | 'API_CALL' | 'MODAL' | 'DRAWER' | 'WIZARD'

  // Navigation
  routePattern?: string   // "/{workspace_path}/transactions"

  // API
  apiEndpoint?: string    // "/api/v2/transactions/post"

  // Permissions / visibility
  requiresPermission?: string
  visibleWhen?: ConditionExpression
  disabledWhen?: ConditionExpression

  // UX
  isPrimary?: boolean
  requiresConfirmation?: boolean
}

// ================================================================================
// STATISTICS CONFIGURATION
// ================================================================================

export interface ResolvedStatTemplate {
  statId: string
  label: string
  queryType: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'count_distinct'
  aggregation?: {
    field: string
    operation: string
  }
  format?: 'number' | 'currency' | 'duration' | 'relative_time'
  filter: ConditionExpression  // already interpolated with org_id, etc.
}

// ================================================================================
// RESOLVED TILE CONFIGURATION
// ================================================================================

export interface ResolvedTileConfig {
  // Identity
  tileId: string
  workspaceId: string
  organizationId: string

  tileCode: string          // NAV-TILE-...
  tileName: string          // entity_name of APP_WORKSPACE_TILE

  tileType: TileKind        // "ENTITIES" | "TRANSACTIONS" ...
  operationCategory: OperationCategory

  // Template linkage
  templateCode: string      // TILE_TPL_ENTITIES / TILE_TPL_TRANSACTIONS
  templateSmartCode: string // from APP_TILE_TEMPLATE.smart_code

  // Layout + visuals
  layout: ResolvedTileLayout
  ui: ResolvedTileUI

  // Data scope (only one of these will be used depending on tileType)
  entityScope?: ResolvedEntityScope
  transactionScope?: ResolvedTransactionScope

  // Behavior
  actions: ResolvedTileAction[]
  stats: ResolvedStatTemplate[]

  // Future: visibility rules at tile level
  visibilityRules?: ConditionExpression
}

// ================================================================================
// TEMPLATE + DYNAMIC DATA TYPES
// ================================================================================

export interface TileTemplateConfig {
  code: string
  smart_code: string
  tile_type: string
  operation_category: string
  ui_schema: {
    default_icon: string
    default_color: string
    default_gradient?: string
    subtitle?: string
    description?: string
  }
  action_templates: Array<{
    action_id: string
    label: string
    icon: string
    action_type: string
    route_pattern?: string
    api_endpoint?: string
    requires_permission?: string
    visible_when?: ConditionExpression
    disabled_when?: ConditionExpression
    is_primary?: boolean
    requires_confirmation?: boolean
  }>
  stat_templates: Array<{
    stat_id: string
    label: string
    query_type: string
    aggregation?: { field: string; operation: string }
    format?: string
    filter: ConditionExpression
  }>
  default_layout_config?: {
    default_size?: string
    resizable?: boolean
  }
}

export interface WorkspaceTileRow {
  id: string
  entity_code: string
  entity_name: string
  parent_entity_id: string
  organization_id: string
}

export interface DynamicFieldMap {
  tile_position?: number
  is_enabled?: boolean
  custom_overrides?: {
    size?: string
    icon?: string
    color?: string
    gradient?: string
    title?: string
    subtitle?: string
    description?: string
  }
  entity_type_filter?: ResolvedEntityScope
  transaction_type_filter?: ResolvedTransactionScope
  enabled_actions?: string[]
  disabled_actions?: string[]
  action_overrides?: Record<string, any>
  visibility_rules?: ConditionExpression
}

// ================================================================================
// MERGE LOGIC
// ================================================================================

/**
 * Merge template + workspace tile → ResolvedTileConfig
 */
export function resolveTileConfig(args: {
  workspaceTile: WorkspaceTileRow
  tileDynamic: DynamicFieldMap
  template: TileTemplateConfig
}): ResolvedTileConfig {
  const { workspaceTile, tileDynamic, template } = args

  const overrides = tileDynamic.custom_overrides ?? {}
  const layoutCfg = template.default_layout_config ?? {
    default_size: 'medium',
    resizable: true,
  }

  const tileType = template.tile_type as TileKind

  return {
    tileId: workspaceTile.id,
    workspaceId: workspaceTile.parent_entity_id,
    organizationId: workspaceTile.organization_id,

    tileCode: workspaceTile.entity_code,
    tileName: workspaceTile.entity_name,

    tileType,
    operationCategory: template.operation_category as OperationCategory,

    templateCode: template.code,
    templateSmartCode: template.smart_code,

    layout: {
      position: tileDynamic.tile_position ?? 1,
      size: (overrides.size ?? layoutCfg.default_size ?? 'medium') as ResolvedTileLayout['size'],
      resizable: layoutCfg.resizable ?? true,
    },

    ui: {
      icon: overrides.icon ?? template.ui_schema.default_icon,
      color: overrides.color ?? template.ui_schema.default_color,
      gradient: overrides.gradient ?? template.ui_schema.default_gradient,
      title: overrides.title ?? workspaceTile.entity_name,
      subtitle: overrides.subtitle ?? template.ui_schema.subtitle,
      description: overrides.description ?? template.ui_schema.description,
    },

    entityScope:
      tileType === 'ENTITIES'
        ? tileDynamic.entity_type_filter ?? undefined
        : undefined,

    transactionScope:
      tileType === 'TRANSACTIONS'
        ? tileDynamic.transaction_type_filter ?? undefined
        : undefined,

    actions: resolveActions(template, tileDynamic),
    stats: resolveStats(template, tileDynamic),

    visibilityRules: tileDynamic.visibility_rules,
  }
}

/**
 * Resolve actions from template with workspace overrides
 */
function resolveActions(
  template: TileTemplateConfig,
  tileDynamic: DynamicFieldMap,
): ResolvedTileAction[] {
  const enabled = tileDynamic.enabled_actions
  const disabled = tileDynamic.disabled_actions
  const overrides = tileDynamic.action_overrides ?? {}

  return template.action_templates
    .filter((a) =>
      enabled ? enabled.includes(a.action_id) : !disabled?.includes(a.action_id),
    )
    .map((tpl) => {
      const ov = overrides[tpl.action_id] ?? {}
      return {
        actionId: tpl.action_id,
        label: ov.label ?? tpl.label,
        icon: ov.icon ?? tpl.icon,
        actionType: tpl.action_type as ResolvedTileAction['actionType'],
        routePattern: ov.route_pattern ?? tpl.route_pattern,
        apiEndpoint: ov.api_endpoint ?? tpl.api_endpoint,
        requiresPermission:
          ov.requires_permission ?? tpl.requires_permission,
        visibleWhen: ov.visible_when ?? tpl.visible_when,
        disabledWhen: ov.disabled_when ?? tpl.disabled_when,
        isPrimary:
          ov.is_primary ?? tpl.is_primary ?? false,
        requiresConfirmation:
          ov.requires_confirmation ?? tpl.requires_confirmation ?? false,
      }
    })
}

/**
 * Resolve stats from template with workspace overrides
 */
function resolveStats(
  template: TileTemplateConfig,
  tileDynamic: DynamicFieldMap,
): ResolvedStatTemplate[] {
  // For now, just use template stats as-is
  // Future: add stat overrides to DynamicFieldMap
  return template.stat_templates.map((tpl) => ({
    statId: tpl.stat_id,
    label: tpl.label,
    queryType: tpl.query_type as ResolvedStatTemplate['queryType'],
    aggregation: tpl.aggregation,
    format: tpl.format as ResolvedStatTemplate['format'],
    filter: tpl.filter,
  }))
}

// ================================================================================
// EXAMPLE CONFIGURATIONS
// ================================================================================

/**
 * Example: Harbour ENTITIES tile configuration
 */
export const EXAMPLE_HARBOUR_ENTITIES_TILE: ResolvedTileConfig = {
  tileId: "64d3c4af-9b5d-4164-a1a4-cf5a6c8bdd38",
  workspaceId: "5e24049d-42d2-4e65-991b-05ef511447d3",
  organizationId: "699453c2-950e-4456-9fc0-c0c71efa78fb",

  tileCode: "NAV-TILE-PROCUREMENT-HARBOUR_INTAKE-ENTITIES",
  tileName: "Harbour Intake Master Data",

  tileType: "ENTITIES",
  operationCategory: "MASTER_DATA",

  templateCode: "TILE_TPL_ENTITIES",
  templateSmartCode: "HERA.PLATFORM.UI.TILE.TPL.ENTITIES.v1",

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
    description: "Maintain master data used by Harbour Intake transactions"
  },

  entityScope: {
    include: ["HARBOUR", "VESSEL", "SUPPLIER", "CUSTOMER"],
    exclude: [],
    categoryFilter: "AGRO_LOGISTICS"
  },

  actions: [
    {
      actionId: "list",
      label: "View All",
      icon: "List",
      actionType: "NAVIGATE",
      routePattern: "/{workspace_path}/entities",
      isPrimary: true
    },
    {
      actionId: "create",
      label: "Create New",
      icon: "Plus",
      actionType: "NAVIGATE",
      routePattern: "/{workspace_path}/entities/new",
      requiresPermission: "{entity_type}.create"
    },
    {
      actionId: "import",
      label: "Bulk Import",
      icon: "Upload",
      actionType: "MODAL",
      routePattern: "/{workspace_path}/entities/import",
      requiresPermission: "{entity_type}.import"
    },
    {
      actionId: "export",
      label: "Export",
      icon: "Download",
      actionType: "API_CALL",
      apiEndpoint: "/api/v2/entities/export",
      requiresConfirmation: true
    }
  ],

  stats: [
    {
      statId: "total_count",
      label: "Total Records",
      queryType: "count",
      aggregation: { field: "*", operation: "count" },
      filter: {
        all: [
          { field: "organization_id", operator: "eq", value: "699453c2-950e-4456-9fc0-c0c71efa78fb" },
          { field: "entity_type", operator: "in", value: ["HARBOUR", "VESSEL", "SUPPLIER", "CUSTOMER"] }
        ]
      }
    },
    {
      statId: "recent_count",
      label: "Added Today",
      queryType: "count",
      aggregation: { field: "*", operation: "count" },
      filter: {
        all: [
          { field: "organization_id", operator: "eq", value: "699453c2-950e-4456-9fc0-c0c71efa78fb" },
          { field: "created_at", operator: "gte", value: "$today" }
        ]
      }
    }
  ]
}

/**
 * Example: Harbour TRANSACTIONS tile configuration
 */
export const EXAMPLE_HARBOUR_TRANSACTIONS_TILE: ResolvedTileConfig = {
  tileId: "f8475bca-f4b3-4f00-adab-772418f1d207",
  workspaceId: "5e24049d-42d2-4e65-991b-05ef511447d3",
  organizationId: "699453c2-950e-4456-9fc0-c0c71efa78fb",

  tileCode: "NAV-TILE-PROCUREMENT-HARBOUR_INTAKE-TRANSACTIONS",
  tileName: "Harbour Intake Transactions",

  tileType: "TRANSACTIONS",
  operationCategory: "FINANCIAL",

  templateCode: "TILE_TPL_TRANSACTIONS",
  templateSmartCode: "HERA.PLATFORM.UI.TILE.TPL.TRANSACTIONS.v1",

  layout: {
    position: 2,
    size: "medium",
    resizable: true
  },

  ui: {
    icon: "Receipt",
    color: "#0EA5E9",
    gradient: "from-sky-500 to-sky-600",
    title: "Harbour Intake",
    subtitle: "Open & posted intake transactions",
    description: "Create, review and post harbour intake transactions"
  },

  transactionScope: {
    include: ["AGRO_HARBOUR_INTAKE"],
    statusFilter: ["DRAFT", "PENDING", "POSTED"]
  },

  actions: [
    {
      actionId: "list",
      label: "View All",
      icon: "Receipt",
      actionType: "NAVIGATE",
      routePattern: "/{workspace_path}/transactions",
      isPrimary: true
    },
    {
      actionId: "create",
      label: "New Transaction",
      icon: "Plus",
      actionType: "NAVIGATE",
      routePattern: "/{workspace_path}/transactions/new",
      requiresPermission: "transactions.create"
    },
    {
      actionId: "pending",
      label: "Pending Approval",
      icon: "Clock",
      actionType: "NAVIGATE",
      routePattern: "/{workspace_path}/transactions?status=pending"
    },
    {
      actionId: "post_batch",
      label: "Batch Post",
      icon: "Layers",
      actionType: "API_CALL",
      apiEndpoint: "/api/v2/transactions/post",
      requiresPermission: "transactions.post",
      requiresConfirmation: true
    }
  ],

  stats: [
    {
      statId: "pending_count",
      label: "Pending",
      queryType: "count",
      filter: {
        all: [
          { field: "organization_id", operator: "eq", value: "699453c2-950e-4456-9fc0-c0c71efa78fb" },
          { field: "transaction_status", operator: "eq", value: "pending" }
        ]
      }
    },
    {
      statId: "posted_today",
      label: "Posted Today",
      queryType: "count",
      filter: {
        all: [
          { field: "organization_id", operator: "eq", value: "699453c2-950e-4456-9fc0-c0c71efa78fb" },
          { field: "transaction_status", operator: "eq", value: "posted" },
          { field: "transaction_date", operator: "gte", value: "$today" }
        ]
      }
    },
    {
      statId: "total_amount_today",
      label: "Amount",
      queryType: "sum",
      aggregation: { field: "total_amount", operation: "sum" },
      format: "currency",
      filter: {
        all: [
          { field: "organization_id", operator: "eq", value: "699453c2-950e-4456-9fc0-c0c71efa78fb" },
          { field: "transaction_date", operator: "gte", value: "$today" }
        ]
      }
    }
  ]
}