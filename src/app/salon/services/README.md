# Salon Services Management

Enterprise-grade service catalog management for HERA Salon module.

## Features

- ✨ Full CRUD operations with Playbook API integration
- 💰 Dynamic pricing, tax, and commission management
- 🏢 Multi-tenant with organization and branch isolation
- 🎨 Luxe dark theme matching salon dashboard
- ♿ Accessible with keyboard navigation
- 📊 Bulk operations and CSV export

## Smart Codes

### Entity Smart Codes
- `HERA.SALON.SERVICE.V1` - Service entity

### Dynamic Data Smart Codes
- `HERA.SALON.SERVICE.PRICE.V1` - Service pricing (value, currency, effective_from)
- `HERA.SALON.SERVICE.TAX.V1` - Tax configuration (rate)
- `HERA.SALON.SERVICE.COMMISSION.V1` - Commission settings (type, value)

## API Endpoints

### Playbook Integration
All endpoints use the Playbook API with Bearer authentication.

```typescript
// List services
GET /entities?type=HERA.SALON.SERVICE.V1&organization_id={org}&branch_id={branch}

// Create service
POST /entities
{
  organization_id: string,
  smart_code: 'HERA.SALON.SERVICE.V1',
  name: string,
  code?: string,
  status: 'active' | 'archived',
  duration_mins?: number,
  category?: string,
  metadata?: any
}

// Update service
PATCH /entities/{id}

// Dynamic data operations
POST /dynamic_data/upsert
POST /dynamic_data/query
```

## Environment Variables

```env
NEXT_PUBLIC_PLAYBOOK_BASE_URL=https://api.playbook.heraerp.com
NEXT_PUBLIC_PLAYBOOK_API_KEY=your-api-key-here
```

If environment variables are not set, the system will use deterministic mock data for development.

## Usage

### Basic Usage
```typescript
import { useServicesPlaybook } from '@/hooks/useServicesPlaybook'

const { items, total, isLoading, createOne, updateOne } = useServicesPlaybook({
  organizationId: 'org-123',
  branchId: 'branch-456',
  query: 'haircut',
  status: 'active',
  page: 1,
  pageSize: 25,
  sort: 'name:asc'
})
```

### Create Service with Dynamic Data
```typescript
await createOne({
  name: 'Premium Cut & Style',
  code: 'SVC001',
  duration_mins: 45,
  category: 'Hair',
  price: 120,
  currency: 'AED',
  tax_rate: 5,
  commission_type: 'percent',
  commission_value: 20
})
```

## Keyboard Shortcuts

- `/` - Focus search
- `n` - New service
- `Cmd/Ctrl + Enter` - Submit form
- `Esc` - Close modal

## Architecture

```
src/
├── app/salon/services/
│   └── page.tsx              # Main page component
├── components/salon/services/
│   ├── ServiceList.tsx       # Table/list view
│   ├── ServiceModal.tsx      # Create/edit form
│   └── BulkActionsBar.tsx   # Bulk operations UI
├── hooks/
│   └── useServicesPlaybook.ts # Data fetching hook
├── lib/playbook/
│   └── services.ts           # API client
└── schemas/
    └── service.ts            # TypeScript types & Zod schemas
```

## Testing

Run the test suite:
```bash
npm test src/schemas/__tests__/service.spec.ts
npm test src/components/salon/services/__tests__/ServiceList.spec.tsx
npm run test:e2e tests/e2e/salon-services.spec.ts
```

## Notes

- Services are stored as entities with `smart_code: HERA.SALON.SERVICE.V1`
- Pricing, tax, and commission are stored separately using dynamic data
- The system respects HERA's universal 6-table architecture
- No schema changes required - all extra fields use `core_dynamic_data`