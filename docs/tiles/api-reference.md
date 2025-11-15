# HERA Universal Tile System - API Reference

## 🌐 Overview

The HERA Universal Tile System provides a comprehensive REST API for managing tiles, templates, and workspaces. All API endpoints follow HERA's Sacred Six patterns with organization-level isolation and actor-based auditing.

## 🔑 Authentication

### JWT Authentication
All API requests require a valid JWT token in the Authorization header:

```bash
Authorization: Bearer <jwt_token>
```

### Organization Context
Every request must include the organization ID header:

```bash
X-Organization-Id: <organization_uuid>
```

### Example Request
```bash
curl -X GET \
  'https://your-domain.com/api/v2/tiles/stats' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'X-Organization-Id: 123e4567-e89b-12d3-a456-426614174000' \
  -H 'Content-Type: application/json'
```

## 📊 Tiles API

### Get Tile Statistics

Retrieve real-time statistics for a specific tile.

**Endpoint:** `GET /api/v2/tiles/{tileId}/stats`

**Parameters:**
- `tileId` (path, required): UUID of the tile
- `refresh` (query, optional): Force refresh cache (`true`/`false`)
- `format` (query, optional): Response format (`json`, `minimal`)

**Response:**
```typescript
{
  success: boolean
  data: {
    value: number | string
    label: string
    format?: 'number' | 'currency' | 'percentage' | 'duration'
    trend?: {
      direction: 'up' | 'down' | 'stable'
      value: number
      period: string
    }
    additionalStats?: Array<{
      label: string
      value: number | string
      format?: string
    }>
    lastUpdated: string
    cacheHit?: boolean
  }
  metadata: {
    requestId: string
    executionTime: number
    cacheHit: boolean
    lastModified: string
  }
}
```

**Example:**
```bash
curl -X GET \
  'https://your-domain.com/api/v2/tiles/550e8400-e29b-41d4-a716-446655440000/stats?refresh=true' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'X-Organization-Id: YOUR_ORG_ID'
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "value": 1247,
    "label": "Active Customers",
    "format": "number",
    "trend": {
      "direction": "up",
      "value": 12.5,
      "period": "vs. last week"
    },
    "additionalStats": [
      {
        "label": "New This Month",
        "value": 89,
        "format": "number"
      },
      {
        "label": "Growth Rate",
        "value": 12.5,
        "format": "percentage"
      }
    ],
    "lastUpdated": "2024-01-15T10:30:00Z",
    "cacheHit": false
  },
  "metadata": {
    "requestId": "req_123456789",
    "executionTime": 245.8,
    "cacheHit": false,
    "lastModified": "2024-01-15T10:30:00Z"
  }
}
```

### Execute Tile Action

Execute a specific action on a tile.

**Endpoint:** `POST /api/v2/tiles/{tileId}/actions/{actionId}`

**Parameters:**
- `tileId` (path, required): UUID of the tile
- `actionId` (path, required): Action identifier

**Request Body:**
```typescript
{
  params?: Record<string, any>      // Action-specific parameters
  confirmation?: boolean            // Confirmation for destructive actions
  dryRun?: boolean                 // Preview action without executing
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    actionId: string
    result: any                    // Action-specific result
    executionTime: number
    sideEffects?: string[]         // List of side effects
    confirmationRequired?: boolean  // If confirmation is needed
  }
  metadata: {
    requestId: string
    actor: string                  // User who executed the action
    timestamp: string
  }
}
```

**Example - Refresh Action:**
```bash
curl -X POST \
  'https://your-domain.com/api/v2/tiles/550e8400-e29b-41d4-a716-446655440000/actions/refresh' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'X-Organization-Id: YOUR_ORG_ID' \
  -H 'Content-Type: application/json' \
  -d '{
    "params": {
      "force": true,
      "clearCache": true
    }
  }'
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "actionId": "refresh",
    "result": {
      "refreshed": true,
      "newValue": 1252,
      "previousValue": 1247
    },
    "executionTime": 1250.3,
    "sideEffects": [
      "cache_cleared",
      "stats_updated"
    ]
  },
  "metadata": {
    "requestId": "req_987654321",
    "actor": "user_123",
    "timestamp": "2024-01-15T10:35:00Z"
  }
}
```

### List Workspace Tiles

Get all tiles for a specific workspace.

**Endpoint:** `GET /api/v2/workspaces/{workspaceId}/tiles`

**Parameters:**
- `workspaceId` (path, required): UUID of the workspace
- `include` (query, optional): Include additional data (`stats`, `config`, `permissions`)
- `limit` (query, optional): Maximum number of tiles to return (default: 50)
- `offset` (query, optional): Number of tiles to skip (default: 0)

**Response:**
```typescript
{
  success: boolean
  data: {
    tiles: Array<{
      id: string
      templateId: string
      name: string
      position: {
        x: number
        y: number
        width: number
        height: number
      }
      config?: TileConfig          // If include=config
      stats?: TileStats           // If include=stats  
      permissions?: Permission[]   // If include=permissions
      lastUpdated: string
    }>
    totalCount: number
    hasMore: boolean
  }
  metadata: {
    requestId: string
    executionTime: number
  }
}
```

**Example:**
```bash
curl -X GET \
  'https://your-domain.com/api/v2/workspaces/workspace-123/tiles?include=stats,config&limit=20' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'X-Organization-Id: YOUR_ORG_ID'
```

### Create Workspace Tile

Add a new tile to a workspace.

**Endpoint:** `POST /api/v2/workspaces/{workspaceId}/tiles`

**Request Body:**
```typescript
{
  templateId: string              // Template to use
  position: {                     // Grid position
    x: number
    y: number  
    width: number
    height: number
  }
  name?: string                   // Custom tile name
  overrides?: {                   // User customizations
    title?: string
    color?: string
    refreshInterval?: number
    hidden?: boolean
  }
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    tileId: string
    templateId: string
    position: Position
    config: ResolvedTileConfig
    createdAt: string
  }
  metadata: {
    requestId: string
    actor: string
    timestamp: string
  }
}
```

**Example:**
```bash
curl -X POST \
  'https://your-domain.com/api/v2/workspaces/workspace-123/tiles' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'X-Organization-Id: YOUR_ORG_ID' \
  -H 'Content-Type: application/json' \
  -d '{
    "templateId": "template-456",
    "position": {
      "x": 0,
      "y": 0,
      "width": 4,
      "height": 2
    },
    "name": "My Sales Dashboard",
    "overrides": {
      "title": "Sales Overview",
      "color": "green",
      "refreshInterval": 60000
    }
  }'
```

### Update Tile

Update tile configuration or position.

**Endpoint:** `PUT /api/v2/tiles/{tileId}`

**Request Body:**
```typescript
{
  position?: {
    x?: number
    y?: number
    width?: number  
    height?: number
  }
  overrides?: {
    title?: string
    color?: string
    refreshInterval?: number
    hidden?: boolean
  }
  name?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    tileId: string
    updatedFields: string[]
    config: ResolvedTileConfig
    updatedAt: string
  }
  metadata: {
    requestId: string
    actor: string
    timestamp: string
  }
}
```

### Delete Tile

Remove a tile from a workspace.

**Endpoint:** `DELETE /api/v2/tiles/{tileId}`

**Query Parameters:**
- `confirmation` (optional): Set to `true` to confirm deletion

**Response:**
```typescript
{
  success: boolean
  data: {
    tileId: string
    deletedAt: string
    backupCreated?: boolean
  }
  metadata: {
    requestId: string
    actor: string
    timestamp: string
  }
}
```

## 🎨 Templates API

### List Templates

Get available tile templates.

**Endpoint:** `GET /api/v2/templates`

**Parameters:**
- `category` (query, optional): Filter by category
- `permissions` (query, optional): Only templates user can access
- `limit` (query, optional): Maximum templates to return
- `search` (query, optional): Search template names/descriptions

**Response:**
```typescript
{
  success: boolean
  data: {
    templates: Array<{
      id: string
      name: string
      description: string
      category: string
      icon: string
      color: string
      config: TileConfig
      permissions: Permission[]
      usage: {
        totalTiles: number
        activeUsers: number
      }
      createdAt: string
      updatedAt: string
    }>
    categories: string[]
    totalCount: number
  }
  metadata: {
    requestId: string
    executionTime: number
  }
}
```

**Example:**
```bash
curl -X GET \
  'https://your-domain.com/api/v2/templates?category=analytics&permissions=true' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'X-Organization-Id: YOUR_ORG_ID'
```

### Get Template Details

Get detailed information about a specific template.

**Endpoint:** `GET /api/v2/templates/{templateId}`

**Response:**
```typescript
{
  success: boolean
  data: {
    id: string
    name: string
    description: string
    category: string
    config: TileConfig
    permissions: Permission[]
    usage: {
      totalTiles: number
      activeUsers: number
      averagePerformance: number
    }
    versions: Array<{
      version: number
      changes: string
      createdAt: string
    }>
    metadata: {
      createdAt: string
      updatedAt: string
      createdBy: string
      updatedBy: string
    }
  }
}
```

### Create Template (Admin Only)

Create a new tile template.

**Endpoint:** `POST /api/v2/admin/templates`

**Request Body:**
```typescript
{
  name: string
  description: string
  category: string
  icon?: string
  color?: string
  config: TileConfig
  permissions?: Permission[]
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    templateId: string
    name: string
    config: TileConfig
    createdAt: string
  }
  metadata: {
    requestId: string
    actor: string
    timestamp: string
  }
}
```

### Update Template (Admin Only)

Update an existing template.

**Endpoint:** `PUT /api/v2/admin/templates/{templateId}`

**Request Body:**
```typescript
{
  name?: string
  description?: string
  config?: Partial<TileConfig>
  permissions?: Permission[]
  versionNotes?: string
}
```

### Delete Template (Admin Only)

Delete a template and handle existing tiles.

**Endpoint:** `DELETE /api/v2/admin/templates/{templateId}`

**Query Parameters:**
- `migration` (required): How to handle existing tiles (`delete`, `migrate`, `archive`)
- `migrationTarget` (optional): Template ID to migrate existing tiles to

## 🏢 Workspaces API

### List User Workspaces

Get workspaces accessible to the current user.

**Endpoint:** `GET /api/v2/workspaces`

**Response:**
```typescript
{
  success: boolean
  data: {
    workspaces: Array<{
      id: string
      name: string
      description: string
      tileCount: number
      lastAccessed: string
      permissions: string[]
    }>
  }
}
```

### Get Workspace Details

Get detailed information about a workspace.

**Endpoint:** `GET /api/v2/workspaces/{workspaceId}`

**Response:**
```typescript
{
  success: boolean
  data: {
    id: string
    name: string
    description: string
    layout: {
      type: 'grid' | 'list' | 'masonry'
      columns: number
      rows: number
      gap: number
    }
    tiles: WorkspaceTile[]
    permissions: Permission[]
    settings: {
      autoRefresh: boolean
      refreshInterval: number
      showGrid: boolean
    }
    metadata: {
      createdAt: string
      updatedAt: string
      lastAccessed: string
    }
  }
}
```

### Create Workspace

Create a new workspace.

**Endpoint:** `POST /api/v2/workspaces`

**Request Body:**
```typescript
{
  name: string
  description?: string
  layout?: {
    type?: 'grid' | 'list' | 'masonry'
    columns?: number
    rows?: number
  }
  templateId?: string           // Use workspace template
  shareWithRoles?: string[]     // Roles to share with
}
```

### Update Workspace

Update workspace configuration.

**Endpoint:** `PUT /api/v2/workspaces/{workspaceId}`

**Request Body:**
```typescript
{
  name?: string
  description?: string
  layout?: Partial<WorkspaceLayout>
  settings?: {
    autoRefresh?: boolean
    refreshInterval?: number
    showGrid?: boolean
  }
}
```

## 📈 Analytics API

### Tile Usage Analytics

Get usage analytics for tiles and templates.

**Endpoint:** `GET /api/v2/analytics/usage`

**Parameters:**
- `period` (query): Time period (`1d`, `7d`, `30d`, `90d`)
- `type` (query): Analytics type (`tiles`, `templates`, `users`)
- `granularity` (query): Data granularity (`hour`, `day`, `week`)

**Response:**
```typescript
{
  success: boolean
  data: {
    period: string
    metrics: {
      totalViews: number
      uniqueUsers: number
      averageSessionTime: number
      topTemplates: Array<{
        templateId: string
        name: string
        usage: number
        growth: number
      }>
      userActivity: Array<{
        date: string
        activeUsers: number
        totalInteractions: number
      }>
    }
  }
}
```

### Performance Analytics

Get performance metrics for the tile system.

**Endpoint:** `GET /api/v2/analytics/performance`

**Response:**
```typescript
{
  success: boolean
  data: {
    averageLoadTime: number
    cacheHitRate: number
    errorRate: number
    throughput: number
    slowestTemplates: Array<{
      templateId: string
      name: string
      averageLoadTime: number
      errorRate: number
    }>
    performanceTrend: Array<{
      date: string
      averageLoadTime: number
      errorRate: number
    }>
  }
}
```

## 🔧 Admin API

### System Health

Get overall system health status.

**Endpoint:** `GET /api/v2/admin/health`

**Response:**
```typescript
{
  success: boolean
  data: {
    status: 'healthy' | 'warning' | 'critical'
    components: {
      database: 'healthy' | 'warning' | 'critical'
      cache: 'healthy' | 'warning' | 'critical'
      api: 'healthy' | 'warning' | 'critical'
    }
    metrics: {
      uptime: number
      responseTime: number
      errorRate: number
      activeConnections: number
    }
    issues?: Array<{
      component: string
      severity: 'warning' | 'critical'
      message: string
      timestamp: string
    }>
  }
}
```

### User Management

Get user information and permissions.

**Endpoint:** `GET /api/v2/admin/users/{userId}/tiles`

**Response:**
```typescript
{
  success: boolean
  data: {
    userId: string
    workspaces: Array<{
      id: string
      name: string
      tileCount: number
      lastAccessed: string
    }>
    permissions: string[]
    usage: {
      totalTiles: number
      lastActivity: string
      averageSessionTime: number
    }
  }
}
```

### Configuration Management

Get and update system configuration.

**Endpoint:** `GET /api/v2/admin/config`
**Endpoint:** `PUT /api/v2/admin/config`

**Response/Request:**
```typescript
{
  performance: {
    defaultRefreshInterval: number
    maxConcurrentRequests: number
    cacheTimeout: number
  }
  security: {
    requirePermissions: boolean
    auditActions: boolean
    maxTilesPerWorkspace: number
  }
  features: {
    customTemplates: boolean
    realTimeUpdates: boolean
    analytics: boolean
  }
}
```

## 🔍 Search API

### Search Tiles and Templates

Search across tiles and templates.

**Endpoint:** `GET /api/v2/search`

**Parameters:**
- `q` (query, required): Search query
- `type` (query): Search type (`tiles`, `templates`, `both`)
- `filters` (query): Additional filters (JSON string)

**Response:**
```typescript
{
  success: boolean
  data: {
    tiles: Array<{
      id: string
      name: string
      description: string
      workspaceName: string
      relevance: number
    }>
    templates: Array<{
      id: string
      name: string
      description: string
      category: string
      relevance: number
    }>
    totalResults: number
  }
}
```

## 🎛️ Real-time API

### WebSocket Connection

Connect to real-time tile updates.

**Endpoint:** `WSS /api/v2/realtime/tiles`

**Connection:**
```typescript
const ws = new WebSocket('wss://your-domain.com/api/v2/realtime/tiles')

// Authentication message
ws.send(JSON.stringify({
  type: 'auth',
  token: 'YOUR_JWT_TOKEN',
  organizationId: 'YOUR_ORG_ID'
}))

// Subscribe to tile updates
ws.send(JSON.stringify({
  type: 'subscribe',
  tileIds: ['tile1', 'tile2', 'tile3']
}))
```

**Message Types:**
```typescript
// Tile stat update
{
  type: 'stats_update'
  tileId: string
  stats: TileStats
  timestamp: string
}

// Tile action completed
{
  type: 'action_completed'
  tileId: string
  actionId: string
  result: any
  timestamp: string
}

// Tile configuration changed
{
  type: 'config_update'
  tileId: string
  config: TileConfig
  updatedBy: string
  timestamp: string
}

// Connection status
{
  type: 'connection_status'
  status: 'connected' | 'disconnected' | 'error'
  message?: string
}
```

## 📝 Request/Response Examples

### Complete Workflow Example

Here's a complete example showing how to create a workspace with tiles:

```typescript
// 1. Create a workspace
const workspace = await fetch('/api/v2/workspaces', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'X-Organization-Id': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Sales Dashboard',
    description: 'Key metrics for sales team',
    layout: {
      type: 'grid',
      columns: 12,
      rows: 8
    }
  })
}).then(r => r.json())

// 2. Add tiles to the workspace
const salesOverviewTile = await fetch(`/api/v2/workspaces/${workspace.data.id}/tiles`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'X-Organization-Id': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    templateId: 'sales-overview-template',
    position: { x: 0, y: 0, width: 6, height: 3 },
    name: 'Sales Overview',
    overrides: {
      title: 'Monthly Sales',
      refreshInterval: 300000 // 5 minutes
    }
  })
}).then(r => r.json())

const customerStatsTile = await fetch(`/api/v2/workspaces/${workspace.data.id}/tiles`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'X-Organization-Id': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    templateId: 'customer-stats-template',
    position: { x: 6, y: 0, width: 3, height: 2 },
    name: 'Customer Stats'
  })
}).then(r => r.json())

// 3. Get real-time stats for the tiles
const stats1 = await fetch(`/api/v2/tiles/${salesOverviewTile.data.tileId}/stats`, {
  headers: {
    'Authorization': 'Bearer ' + token,
    'X-Organization-Id': orgId
  }
}).then(r => r.json())

const stats2 = await fetch(`/api/v2/tiles/${customerStatsTile.data.tileId}/stats`, {
  headers: {
    'Authorization': 'Bearer ' + token,
    'X-Organization-Id': orgId
  }
}).then(r => r.json())

// 4. Execute action on a tile
const refreshResult = await fetch(`/api/v2/tiles/${salesOverviewTile.data.tileId}/actions/refresh`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'X-Organization-Id': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    params: {
      force: true
    }
  })
}).then(r => r.json())
```

### Batch Operations Example

```typescript
// Batch update multiple tiles
const batchUpdate = await fetch('/api/v2/tiles/batch', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'X-Organization-Id': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    operations: [
      {
        tileId: 'tile1',
        action: 'update',
        data: { position: { x: 0, y: 0 } }
      },
      {
        tileId: 'tile2', 
        action: 'update',
        data: { position: { x: 3, y: 0 } }
      },
      {
        tileId: 'tile3',
        action: 'delete'
      }
    ]
  })
}).then(r => r.json())
```

## 🚨 Error Handling

### Error Response Format

All API errors follow a consistent format:

```typescript
{
  success: false
  error: {
    code: string              // Error code
    message: string          // Human-readable message
    details?: any           // Additional error details
    field?: string          // Field that caused validation error
  }
  metadata: {
    requestId: string
    timestamp: string
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `TILE_NOT_FOUND` | 404 | Tile does not exist or user lacks access |
| `TEMPLATE_NOT_FOUND` | 404 | Template does not exist |
| `WORKSPACE_NOT_FOUND` | 404 | Workspace does not exist |
| `PERMISSION_DENIED` | 403 | User lacks required permissions |
| `INVALID_POSITION` | 400 | Tile position conflicts with existing tiles |
| `VALIDATION_ERROR` | 400 | Request data validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `ORGANIZATION_MISMATCH` | 400 | Organization ID mismatch |
| `ACTION_NOT_ALLOWED` | 403 | Action not permitted for this tile |
| `DATA_SOURCE_ERROR` | 502 | External data source error |
| `CACHE_ERROR` | 500 | Cache system error |

### Error Handling Best Practices

```typescript
// Proper error handling
async function getTileStats(tileId: string) {
  try {
    const response = await fetch(`/api/v2/tiles/${tileId}/stats`, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'X-Organization-Id': orgId
      }
    })
    
    const data = await response.json()
    
    if (!data.success) {
      switch (data.error.code) {
        case 'TILE_NOT_FOUND':
          throw new Error('Tile not found or access denied')
        case 'PERMISSION_DENIED':
          throw new Error('You do not have permission to view this tile')
        case 'DATA_SOURCE_ERROR':
          // Retry with exponential backoff
          return await retryWithBackoff(() => getTileStats(tileId))
        default:
          throw new Error(data.error.message)
      }
    }
    
    return data.data
    
  } catch (error) {
    // Log error for debugging
    console.error('Failed to get tile stats:', error)
    throw error
  }
}
```

## 📏 Rate Limiting

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 1000        # Requests per hour
X-RateLimit-Remaining: 999     # Remaining requests
X-RateLimit-Reset: 1640995200  # Reset timestamp
```

### Rate Limits by Endpoint

| Endpoint Category | Limit | Window |
|-------------------|-------|---------|
| Tile Stats | 500 req/hour | Per user |
| Tile Actions | 100 req/hour | Per user |
| Template Operations | 50 req/hour | Per user |
| Admin Operations | 20 req/hour | Per user |
| Real-time Connections | 5 concurrent | Per user |

### Handling Rate Limits

```typescript
function handleRateLimit(response: Response) {
  if (response.status === 429) {
    const resetTime = response.headers.get('X-RateLimit-Reset')
    const waitTime = resetTime ? parseInt(resetTime) * 1000 - Date.now() : 60000
    
    throw new Error(`Rate limited. Try again in ${Math.ceil(waitTime / 1000)} seconds`)
  }
}
```

## 🔒 Security Considerations

### Input Validation

All API inputs are validated for:
- Required fields presence
- Data type correctness
- Value range limits
- Malicious content (XSS, SQL injection)
- Organization context consistency

### Permission Checks

Every API call performs:
- JWT token validation
- Organization membership verification
- Role-based permission checks
- Resource-specific access validation

### Data Sanitization

Responses are sanitized to:
- Remove sensitive internal data
- Filter based on user permissions
- Escape potentially dangerous content
- Apply organization data filters

---

*For additional support and examples, see the [Developer Documentation](./README.md) and [Admin Guide](./admin-guide.md).*