# HERA Universal Tile System - Developer Documentation

## 🎯 Overview

The HERA Universal Tile System is a dynamic, template-based dashboard framework that enables organizations to create customizable, data-driven workspaces. Built on the Sacred Six architecture, it provides enterprise-grade security, performance, and scalability.

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[DynamicTile Component] --> B[TileStatsDisplay]
        A --> C[TileActionsMenu]
        D[UniversalTileRenderer] --> A
        E[Workspace UI] --> D
    end
    
    subgraph "API Layer"
        F[Tile Stats API] --> G[/api/v2/tiles/:id/stats]
        H[Tile Actions API] --> I[/api/v2/tiles/:id/actions/:actionId]
        J[Template Resolution] --> K[DSL Evaluator]
    end
    
    subgraph "Data Layer"
        L[APP_TILE_TEMPLATE] --> M[Core Entities]
        N[APP_WORKSPACE_TILE] --> M
        O[Template Config] --> P[Dynamic Data]
        Q[Workspace Relationships] --> R[Core Relationships]
    end
    
    E --> F
    E --> H
    F --> L
    H --> N
    K --> O
```

## 🔑 Core Concepts

### 1. Tile Templates
Templates define the behavior and appearance of tiles. They include:
- **Configuration**: Display properties, data sources, actions
- **Conditions**: Dynamic visibility and behavior rules
- **Permissions**: Role-based access control
- **Smart Codes**: HERA DNA identification patterns

### 2. Workspace Tiles
Individual tile instances in user workspaces with:
- **Template Inheritance**: Base configuration from templates
- **User Customization**: Personal overrides and preferences
- **Position & Layout**: Grid-based positioning system
- **State Management**: Real-time data and interaction state

### 3. Dynamic Resolution
The system resolves final tile configuration through:
- **Template Merging**: Combining template and user configurations
- **Condition Evaluation**: DSL-based rule processing
- **Permission Filtering**: Role-based action availability
- **Data Binding**: Real-time statistics and content

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd heraerp-dev

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables

```bash
# Required
SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

# Optional for disaster recovery
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development vs Production
NODE_ENV=development|production
```

### Basic Usage

```typescript
import { UniversalTileRenderer } from '@/components/tiles/UniversalTileRenderer'
import { useWorkspaceTiles } from '@/hooks/tiles/useWorkspaceTiles'

function Dashboard({ workspaceId }: { workspaceId: string }) {
  const { tiles, loading, error } = useWorkspaceTiles(workspaceId)
  
  if (loading) return <div>Loading workspace...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div className="dashboard-grid">
      <UniversalTileRenderer 
        tiles={tiles}
        editable={true}
        onTileUpdate={(tileId, updates) => {
          // Handle tile updates
        }}
      />
    </div>
  )
}
```

## 📊 Data Model

### Sacred Six Integration

The tile system leverages HERA's Sacred Six tables:

```sql
-- Core entity types for tiles
core_entities: APP_TILE_TEMPLATE, APP_WORKSPACE_TILE

-- Dynamic configuration storage
core_dynamic_data: template_config, user_overrides, position_data

-- Workspace and template relationships
core_relationships: WORKSPACE_HAS_TILE, TILE_USES_TEMPLATE

-- Multi-tenant organization isolation
organization_id: Required on all operations
```

### Smart Code Patterns

```typescript
// Template smart codes
'HERA.WORKSPACE.TILE.TEMPLATE.ENTITIES.v1'
'HERA.WORKSPACE.TILE.TEMPLATE.TRANSACTIONS.v1'
'HERA.WORKSPACE.TILE.TEMPLATE.ANALYTICS.v1'
'HERA.WORKSPACE.TILE.TEMPLATE.WORKFLOW.v1'
'HERA.WORKSPACE.TILE.TEMPLATE.RELATIONSHIPS.v1'

// Instance smart codes
'HERA.WORKSPACE.TILE.INSTANCE.USER_CUSTOM.v1'
'HERA.WORKSPACE.TILE.INSTANCE.SYSTEM.v1'
```

### Database Schema

```typescript
interface TileTemplate {
  id: string                    // UUID primary key
  entity_type: 'APP_TILE_TEMPLATE'
  entity_name: string          // Human-readable template name
  smart_code: string           // HERA DNA identifier
  organization_id: string      // Multi-tenant boundary
  created_by: string           // Actor who created template
  updated_by: string           // Actor who last modified
  template_config: {           // Stored in core_dynamic_data
    type: string               // 'stat', 'chart', 'list', 'action'
    title: string
    subtitle?: string
    icon?: string
    color?: string
    size: 'small' | 'medium' | 'large' | 'extra-large'
    dataSource: {
      type: 'rpc' | 'api' | 'static'
      endpoint?: string
      query?: string
      params?: Record<string, any>
    }
    conditions?: Condition[]
    actions?: TileAction[]
    permissions?: PermissionRule[]
  }
}

interface WorkspaceTile {
  id: string                    // UUID primary key
  entity_type: 'APP_WORKSPACE_TILE'
  entity_name: string          // User-assigned tile name
  smart_code: string           // HERA DNA identifier
  organization_id: string      // Multi-tenant boundary
  created_by: string           // User who added tile
  updated_by: string           // User who last modified
  template_id: string          // Foreign key to template
  workspace_id: string         // Workspace this tile belongs to
  position_data: {             // Stored in core_dynamic_data
    x: number                  // Grid X position
    y: number                  // Grid Y position
    width: number              // Grid width
    height: number             // Grid height
  }
  user_overrides?: {           // User customizations
    title?: string
    color?: string
    hidden?: boolean
    refresh_interval?: number
  }
}
```

## 🎨 Component Architecture

### Core Components

#### 1. DynamicTile
The fundamental tile component that renders individual tiles.

```typescript
import { DynamicTile } from '@/components/tiles/DynamicTile'

<DynamicTile
  config={resolvedConfig}
  onAction={(actionId, params) => {
    // Handle tile actions
  }}
  onUpdate={(updates) => {
    // Handle configuration updates
  }}
  editable={true}
  className="custom-tile-styles"
/>
```

**Props:**
- `config: ResolvedTileConfig` - Complete resolved tile configuration
- `onAction?: (actionId: string, params: any) => Promise<void>` - Action handler
- `onUpdate?: (updates: Partial<TileConfig>) => void` - Update handler
- `editable?: boolean` - Enable editing mode
- `className?: string` - Additional CSS classes

#### 2. TileStatsDisplay
Displays statistical data with automatic formatting and updates.

```typescript
import { TileStatsDisplay } from '@/components/tiles/TileStatsDisplay'

<TileStatsDisplay
  stats={tileStats}
  format="number"
  showTrend={true}
  refreshInterval={30000}
  onRefresh={() => {
    // Handle manual refresh
  }}
/>
```

**Props:**
- `stats: TileStats` - Statistical data to display
- `format?: 'number' | 'currency' | 'percentage' | 'duration'` - Display format
- `showTrend?: boolean` - Show trend indicators
- `refreshInterval?: number` - Auto-refresh interval in milliseconds
- `onRefresh?: () => void` - Manual refresh handler

#### 3. TileActionsMenu
Permission-aware actions menu with confirmation workflows.

```typescript
import { TileActionsMenu } from '@/components/tiles/TileActionsMenu'

<TileActionsMenu
  actions={availableActions}
  onAction={(actionId, params) => {
    // Handle action execution
  }}
  permissions={userPermissions}
  confirmDestructive={true}
/>
```

**Props:**
- `actions: TileAction[]` - Available actions
- `onAction: (actionId: string, params: any) => Promise<void>` - Action handler
- `permissions?: Permission[]` - User permissions
- `confirmDestructive?: boolean` - Confirm destructive actions

#### 4. UniversalTileRenderer
Renders complete tile grids with layout management.

```typescript
import { UniversalTileRenderer } from '@/components/tiles/UniversalTileRenderer'

<UniversalTileRenderer
  tiles={workspaceTiles}
  layout="grid"
  editable={true}
  onTileMove={(tileId, newPosition) => {
    // Handle tile repositioning
  }}
  onTileResize={(tileId, newSize) => {
    // Handle tile resizing
  }}
/>
```

**Props:**
- `tiles: WorkspaceTile[]` - Tiles to render
- `layout?: 'grid' | 'list' | 'masonry'` - Layout style
- `editable?: boolean` - Enable drag & drop
- `onTileMove?: (tileId: string, position: Position) => void` - Move handler
- `onTileResize?: (tileId: string, size: Size) => void` - Resize handler

### React Hooks

#### useTileStats
Manages tile statistics with automatic refresh and caching.

```typescript
import { useTileStats } from '@/hooks/tiles/useTileStats'

const {
  stats,
  loading,
  error,
  lastUpdated,
  refresh,
  subscribe
} = useTileStats(tileId, {
  refreshInterval: 30000,
  cache: true
})
```

#### useTileActions
Handles tile action execution with permission checking.

```typescript
import { useTileActions } from '@/hooks/tiles/useTileActions'

const {
  executeAction,
  availableActions,
  loading,
  error
} = useTileActions(tileConfig, userPermissions)

// Execute an action
await executeAction('refresh', { force: true })
```

#### useWorkspaceTiles
Manages workspace tile collection with real-time updates.

```typescript
import { useWorkspaceTiles } from '@/hooks/tiles/useWorkspaceTiles'

const {
  tiles,
  templates,
  loading,
  error,
  addTile,
  updateTile,
  removeTile,
  reorderTiles
} = useWorkspaceTiles(workspaceId)

// Add a new tile
await addTile(templateId, {
  position: { x: 0, y: 0, width: 2, height: 1 },
  overrides: { title: 'My Custom Tile' }
})
```

### TypeScript Interfaces

#### Core Types

```typescript
interface TileConfig {
  type: 'stat' | 'chart' | 'list' | 'action' | 'custom'
  title: string
  subtitle?: string
  icon?: string
  color?: string
  size: 'small' | 'medium' | 'large' | 'extra-large'
  dataSource?: DataSource
  conditions?: Condition[]
  actions?: TileAction[]
  permissions?: PermissionRule[]
  customComponent?: string
  refreshInterval?: number
  cacheTimeout?: number
}

interface ResolvedTileConfig extends TileConfig {
  id: string
  templateId: string
  workspaceId: string
  userId: string
  organizationId: string
  position: Position
  resolved: {
    dataSource: ResolvedDataSource
    actions: ResolvedAction[]
    permissions: ResolvedPermission[]
    conditions: EvaluatedCondition[]
  }
  metadata: {
    createdAt: string
    updatedAt: string
    createdBy: string
    updatedBy: string
    version: number
  }
}

interface TileStats {
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

interface TileAction {
  id: string
  label: string
  icon?: string
  type: 'button' | 'link' | 'dropdown' | 'modal'
  variant?: 'primary' | 'secondary' | 'danger'
  confirmationRequired?: boolean
  confirmationMessage?: string
  endpoint?: string
  params?: Record<string, any>
  permissions?: string[]
  conditions?: Condition[]
}

interface Position {
  x: number
  y: number
  width: number
  height: number
}

interface DataSource {
  type: 'rpc' | 'api' | 'static' | 'realtime'
  endpoint?: string
  query?: string
  params?: Record<string, any>
  cacheTimeout?: number
  refreshInterval?: number
}
```

#### Condition System

```typescript
interface Condition {
  id: string
  field: string
  operator: ConditionOperator
  value: ConditionValue
  logicalOperator?: 'AND' | 'OR'
  group?: string
}

type ConditionOperator = 
  | 'equals' | 'not_equals'
  | 'greater_than' | 'less_than' 
  | 'greater_than_or_equal' | 'less_than_or_equal'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'is_empty' | 'is_not_empty'
  | 'in' | 'not_in'

interface ConditionValue {
  type: 'static' | 'dynamic' | 'user_attribute' | 'system_variable'
  value: any
  source?: string
}

interface EvaluatedCondition extends Condition {
  result: boolean
  evaluatedAt: string
  context: Record<string, any>
}
```

## 🔌 API Reference

### Tile Stats API

#### GET /api/v2/tiles/:id/stats

Retrieve real-time statistics for a specific tile.

**Parameters:**
- `id` (path): Tile ID
- `refresh` (query, optional): Force refresh cache
- `format` (query, optional): Response format preference

**Response:**
```typescript
{
  success: boolean
  data: TileStats
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
  'https://your-app.com/api/v2/tiles/tile-123/stats?refresh=true' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'X-Organization-Id: YOUR_ORG_ID'
```

### Tile Actions API

#### POST /api/v2/tiles/:id/actions/:actionId

Execute a specific action on a tile.

**Parameters:**
- `id` (path): Tile ID
- `actionId` (path): Action identifier
- `params` (body): Action parameters

**Request Body:**
```typescript
{
  params?: Record<string, any>
  confirmation?: boolean
  dryRun?: boolean
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    actionId: string
    result: any
    executionTime: number
    sideEffects?: string[]
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
  'https://your-app.com/api/v2/tiles/tile-123/actions/refresh' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'X-Organization-Id: YOUR_ORG_ID' \
  -d '{
    "params": {
      "force": true,
      "clearCache": true
    }
  }'
```

## 🎯 Development Workflow

### Creating a New Tile Template

1. **Define Template Configuration:**

```typescript
const templateConfig: TileConfig = {
  type: 'stat',
  title: 'Active Users',
  subtitle: 'Currently online',
  icon: 'users',
  color: 'blue',
  size: 'medium',
  dataSource: {
    type: 'rpc',
    endpoint: 'get_active_users_count',
    params: {
      time_window: '5m'
    },
    refreshInterval: 30000
  },
  actions: [
    {
      id: 'view_details',
      label: 'View Details',
      type: 'link',
      endpoint: '/users/active'
    },
    {
      id: 'refresh',
      label: 'Refresh',
      type: 'button',
      icon: 'refresh'
    }
  ]
}
```

2. **Create Template Entity:**

```typescript
import { createTileTemplate } from '@/lib/tiles/templates'

const template = await createTileTemplate({
  name: 'Active Users Counter',
  description: 'Shows real-time count of active users',
  config: templateConfig,
  permissions: ['view_users', 'admin'],
  organizationId: 'your-org-id'
})
```

3. **Register with System:**

```bash
# Use the template seeding script
npm run seed:tile-template "Active Users" "./path/to/config.json"

# Or use the admin API
curl -X POST '/api/v2/admin/templates' \
  -H 'Content-Type: application/json' \
  -d '{"template": {...}}'
```

### Adding Custom Components

1. **Create Custom Component:**

```typescript
// components/tiles/custom/ActiveUsersChart.tsx
import { FC } from 'react'
import { TileComponentProps } from '@/types/tiles'

export const ActiveUsersChart: FC<TileComponentProps> = ({
  config,
  stats,
  onAction
}) => {
  return (
    <div className="active-users-chart">
      {/* Custom chart implementation */}
    </div>
  )
}
```

2. **Register Component:**

```typescript
// lib/tiles/components/registry.ts
import { ActiveUsersChart } from '@/components/tiles/custom/ActiveUsersChart'

export const customComponents = {
  'active-users-chart': ActiveUsersChart,
  // ... other custom components
}
```

3. **Use in Template:**

```typescript
const templateConfig: TileConfig = {
  type: 'custom',
  customComponent: 'active-users-chart',
  // ... other configuration
}
```

### Testing Your Tiles

```typescript
// tests/tiles/active-users.test.tsx
import { render, screen } from '@testing-library/react'
import { DynamicTile } from '@/components/tiles/DynamicTile'

describe('Active Users Tile', () => {
  it('renders active user count', async () => {
    const config = {
      type: 'stat',
      title: 'Active Users',
      dataSource: {
        type: 'static',
        data: { value: 42 }
      }
    }
    
    render(<DynamicTile config={config} />)
    
    expect(screen.getByText('Active Users')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })
})
```

## 🔧 Configuration

### Environment Configuration

```typescript
// config/tiles.ts
export const tileConfig = {
  // Performance settings
  defaultRefreshInterval: 30000,      // 30 seconds
  maxRefreshInterval: 300000,         // 5 minutes
  minRefreshInterval: 5000,           // 5 seconds
  
  // Cache settings
  defaultCacheTimeout: 60000,         // 1 minute
  maxCacheTimeout: 3600000,          // 1 hour
  
  // Grid settings
  defaultGridSize: { width: 12, height: 8 },
  minTileSize: { width: 1, height: 1 },
  maxTileSize: { width: 12, height: 6 },
  
  // Security settings
  maxActionsPerTile: 10,
  allowCustomComponents: true,
  requirePermissionForActions: true,
  
  // API settings
  apiTimeout: 30000,                 // 30 seconds
  maxConcurrentRequests: 10,
  retryAttempts: 3
}
```

### Organization-Level Settings

```typescript
// Stored in core_dynamic_data for organization
const orgTileSettings = {
  allowedTemplates: ['*'],  // or specific template IDs
  maxTilesPerWorkspace: 50,
  allowCustomTemplates: true,
  defaultRefreshInterval: 60000,
  enableRealTimeUpdates: true,
  cacheStrategy: 'aggressive',
  allowedDataSources: ['rpc', 'api'],
  auditLevel: 'full'
}
```

## 📈 Performance

### Optimization Strategies

1. **Caching:**
   - Stats cached for 1-5 minutes
   - Template configs cached until changed
   - User preferences cached in browser

2. **Lazy Loading:**
   - Tiles rendered only when visible
   - Data loaded on-demand
   - Charts rendered progressively

3. **Batch Operations:**
   - Multiple tile updates batched
   - Stats requests consolidated
   - Action executions queued

4. **Real-time Updates:**
   - WebSocket connections for live data
   - Efficient diff-based updates
   - Automatic reconnection

### Performance Monitoring

```typescript
import { TilePerformanceMonitor } from '@/lib/tiles/monitoring'

const monitor = new TilePerformanceMonitor()

// Track render time
monitor.trackRender(tileId, renderStartTime)

// Track data load time
monitor.trackDataLoad(tileId, dataSource, loadTime)

// Track user interactions
monitor.trackInteraction(tileId, actionId, responseTime)

// Get performance report
const report = monitor.generateReport('7d')
```

## 🔒 Security

### Permission System

Tiles inherit from HERA's role-based permission system:

```typescript
interface TilePermission {
  action: string                    // 'view', 'edit', 'execute_action'
  resource: string                  // tile ID or template ID
  conditions?: Condition[]          // Additional restrictions
  expiresAt?: Date                 // Time-based permissions
}

// Check permissions
const hasPermission = await checkTilePermission({
  userId,
  organizationId,
  action: 'execute_action',
  resource: tileId,
  actionId: 'delete_record'
})
```

### Data Access Control

1. **Organization Isolation:**
   - All tile data filtered by organization_id
   - Cross-tenant access prevented
   - RLS policies enforced

2. **Actor Auditing:**
   - All modifications tracked to specific users
   - Complete audit trail maintained
   - Actor context in all API calls

3. **API Security:**
   - JWT authentication required
   - Organization context validated
   - Rate limiting per user/org

### Security Best Practices

```typescript
// ❌ Don't expose sensitive data in tile stats
const badStats = {
  value: user.creditCardNumber,  // Never expose PII
  additionalStats: [
    { label: 'API Key', value: config.apiKey }  // Never expose credentials
  ]
}

// ✅ Use aggregated, anonymized data
const goodStats = {
  value: totalUsers,
  additionalStats: [
    { label: 'Active Today', value: activeToday },
    { label: 'New This Week', value: newThisWeek }
  ]
}

// ✅ Validate all user inputs
const safeConfig = validateTileConfig(userConfig)
if (!safeConfig.valid) {
  throw new Error(`Invalid tile configuration: ${safeConfig.errors}`)
}
```

## 🚀 Deployment

### Production Checklist

- [ ] All tile templates seeded
- [ ] Performance monitoring configured
- [ ] Security permissions validated
- [ ] Cache settings optimized
- [ ] Error tracking enabled
- [ ] Backup procedures tested

### Deployment Commands

```bash
# Deploy tile system
npm run deploy:tiles:prod

# Run verification
npm run verify:prod
npm run smoke:test

# Monitor health
npm run health:monitor
```

For detailed deployment procedures, see [Operations Guide](./operations-guide.md).

## 🆘 Troubleshooting

### Common Issues

1. **Tiles Not Loading:**
   - Check organization_id context
   - Verify template exists
   - Check user permissions
   - Validate data source

2. **Performance Issues:**
   - Review refresh intervals
   - Check cache hit rates
   - Monitor API response times
   - Optimize data queries

3. **Permission Errors:**
   - Verify user roles
   - Check tile permissions
   - Validate organization membership
   - Review action permissions

### Debug Tools

```typescript
// Enable debug mode
localStorage.setItem('hera:tiles:debug', 'true')

// View tile debug info
import { debugTile } from '@/lib/tiles/debug'
debugTile(tileId)

// Performance analysis
import { analyzeTilePerformance } from '@/lib/tiles/performance'
const analysis = await analyzeTilePerformance(workspaceId)
```

## 📚 Additional Resources

- [API Documentation](./api-reference.md) - Complete API reference
- [Admin Guide](./admin-guide.md) - Administrative procedures
- [Operations Guide](./operations-guide.md) - Deployment and maintenance
- [Architecture Deep Dive](./architecture.md) - Technical architecture details
- [Contributing Guide](./CONTRIBUTING.md) - Development guidelines

---

*For support, see the [Troubleshooting Guide](./troubleshooting.md) or contact the development team.*