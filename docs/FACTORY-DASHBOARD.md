# HERA Factory Dashboard

The HERA Factory Dashboard is a production-ready monitoring interface for the Universal Factory pipeline, displaying real-time pipeline runs, guardrail compliance, and KPIs - all reading from the Six Sacred Tables.

## 🚀 Quick Start

```bash
# Install dependencies (if not already installed)
npm install

# Create demo data
npm run factory:dashboard-demo

# Start development server
npm run dev

# Navigate to
http://localhost:3000/factory
# or http://localhost:3001/factory if port 3000 is in use
```

## 📊 Features

### **KPI Cards**
- **Lead Time**: Average days from PLAN to RELEASE
- **Test Coverage**: Average coverage across all test types
- **Guardrail Pass Rate**: Compliance success percentage
- **Audit Ready**: SBOM and attestation availability
- **Fiscal Aligned**: Open fiscal period check

### **Pipeline Transactions Table**
- **Module Grouping**: Transactions grouped by module
- **Status Indicators**: Visual status with animated icons
- **AI Confidence**: Progress bar showing AI confidence scores
- **Guardrail Badges**: Color-coded severity levels
- **Expandable Details**: Click to view transaction lines
- **Artifact Downloads**: Quick links to build outputs
- **Waiver Management**: Create policy waivers inline

### **Dependency Graph**
- **Interactive Canvas**: Click nodes for details
- **Module Dependencies**: Visual connection lines
- **Capability Requirements**: External dependencies
- **Color Coding**: Blue for modules, purple for capabilities

## 🏗️ Architecture

### **Data Flow**
```
Six Sacred Tables → Universal API → SWR Hook → React Components
```

### **Key Files**
- `/src/app/factory/page.tsx` - App Router page
- `/src/components/factory/FactoryDashboard.tsx` - Main dashboard
- `/src/lib/hooks/use-factory-dashboard.ts` - SWR data fetching
- `/src/lib/api/factory-dashboard.ts` - API client
- `/src/lib/metrics/kpi.ts` - KPI calculations
- `/tests/unit/kpi.spec.ts` - Unit tests

### **Smart Code Patterns**
```typescript
// Module smart codes
'HERA.REST.MODULE.LOYALTY.v1'      // Restaurant loyalty module
'HERA.ICE.MODULE.INVENTORY.v1'      // Ice cream inventory
'HERA.HLTH.MODULE.PORTAL.v1'        // Healthcare portal

// Factory stage smart codes
'HERA.FACTORY.MODULE.PLAN.PIPELINE.v1'
'HERA.FACTORY.MODULE.BUILD.PIPELINE.v1'
'HERA.FACTORY.MODULE.TEST.PIPELINE.v1'
'HERA.FACTORY.MODULE.COMPLY.PIPELINE.v1'
'HERA.FACTORY.MODULE.PACKAGE.PIPELINE.v1'
'HERA.FACTORY.MODULE.RELEASE.PIPELINE.v1'
```

## 🔌 Integration with Factory Pipeline

The dashboard reads pipeline data stored in the Six Sacred Tables:

### **Transactions Table**
```sql
-- Pipeline runs stored as universal_transactions
transaction_type: 'FACTORY.BUILD'
smart_code: 'HERA.REST.MODULE.LOYALTY.v1'
transaction_status: 'passed' | 'failed' | 'blocked' | 'running'
ai_confidence: 0.95
```

### **Transaction Lines Table**
```sql
-- Pipeline steps stored as universal_transaction_lines
line_type: 'STEP.UNIT'
metadata: {
  status: 'PASSED',
  coverage: 0.85,
  duration_ms: 12000,
  violations: []
}
```

### **Entities Table**
```sql
-- Modules stored as core_entities
entity_type: 'factory_module'
entity_name: 'Restaurant Loyalty'
metadata: {
  version: '1.0.0',
  channel: 'stable'
}
```

### **Relationships Table**
```sql
-- Dependencies stored as core_relationships
relationship_type: 'DEPENDS_ON'
from_entity_id: module_id
to_entity_id: capability_id
```

## 🧪 Testing

### **Unit Tests**
```bash
# Run KPI calculation tests
npx vitest run tests/unit/kpi.spec.ts

# Run all tests
npx vitest
```

### **Test Coverage**
- Lead time calculations ✓
- Coverage averaging ✓
- Guardrail pass rates ✓
- Audit readiness checks ✓
- Fiscal alignment validation ✓

## 🎨 UI Components

### **Design System**
- **Colors**: HERA brand colors with gradient backgrounds
- **Icons**: Lucide React for consistency
- **Animations**: Framer Motion for smooth transitions
- **Dark Mode**: Full dark theme support
- **Responsive**: Works on all screen sizes

### **Component Library**
- `KpiCards` - Metric display cards
- `TransactionsTable` - Expandable data table
- `DependencyGraph` - Canvas visualization
- `GuardrailBadge` - Status indicators
- `ArtifactLinks` - Download buttons

## 🚀 Demo Data

The demo script creates:
- 3 factory modules
- 11 pipeline transactions
- Complete pipeline for Restaurant Loyalty
- Blocked pipeline for Ice Cream (compliance issue)
- Running tests for Healthcare Portal
- Module dependencies and capabilities
- Open fiscal period

## 📈 Performance

- **SWR Caching**: Automatic request deduplication
- **Optimistic Updates**: Instant UI feedback
- **Lazy Loading**: Components load on demand
- **Memoization**: Expensive calculations cached
- **Virtual Scrolling**: (Ready for large datasets)

## 🔐 Security

- **Organization Isolation**: Sacred organization_id filtering
- **JWT Authentication**: Secure API access
- **RBAC Support**: Role-based permissions ready
- **Audit Trail**: All actions logged in transactions

## 🎯 Future Enhancements

- Real-time WebSocket updates
- Pipeline action buttons (retry, cancel)
- Advanced filtering and search
- Export to PDF/Excel
- Pipeline performance analytics
- Cost tracking per pipeline run
- Integration with CI/CD webhooks

## 📝 Troubleshooting

### **Port Already in Use**
If you see "Port 3000 is in use", the dev server will automatically use port 3001.

### **Missing Dependencies**
```bash
npm install swr
```

### **Type Errors**
The project has existing type errors that don't affect the Factory Dashboard functionality.

### **No Data Showing**
Run the demo script to create sample data:
```bash
npm run factory:dashboard-demo
```

## 🎉 Success Indicators

When working correctly, you should see:
- KPI cards showing calculated metrics
- Transaction table with expandable rows
- Interactive dependency graph
- Smooth animations and transitions
- No console errors related to Factory Dashboard

The Factory Dashboard demonstrates HERA's Universal Architecture principle - complex enterprise features built entirely on the Six Sacred Tables without any schema changes!