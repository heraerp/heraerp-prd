# HERA DNA Hooks Documentation

## Overview

HERA DNA Hooks provide a standardized way to interact with the universal 6-table architecture. All hooks are organized with smart codes for easy discovery and reuse.

## Hook Categories

### 1. Authentication & Authorization Hooks

#### `useHERAAuth`

**Smart Code**: `HERA.DNA.HOOKS.AUTH.CORE.v1`

Core authentication hook for accessing user and organization context.

```typescript
import { useHERAAuth } from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function MyComponent() {
  const { user, organization, isAuthenticated, isLoading } = useHERAAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please login</div>

  return <div>Welcome {user?.email} from {organization?.name}</div>
}
```

#### `useDemoOrganization`

**Smart Code**: `HERA.DNA.HOOKS.AUTH.DEMO.v1`

Handles demo organization context for non-authenticated users.

```typescript
import { useDemoOrganization } from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function DemoComponent() {
  const { organizationId, organizationName, orgLoading } = useDemoOrganization()

  if (orgLoading) return <div>Loading demo...</div>

  return <div>Demo Organization: {organizationName}</div>
}
```

#### Industry-Specific Auth Hooks

**Smart Code**: `HERA.DNA.HOOKS.AUTH.INDUSTRY.v1`

```typescript
import {
  useSalonAuth,
  useRestaurantAuth,
  useHealthcareAuth,
  useManufacturingAuth
} from '@/src/lib/dna/hooks/hera-dna-hook-registry'

// Salon-specific component
function SalonDashboard() {
  const { isSalonUser, salonOrganization, salonPermissions } = useSalonAuth()

  if (!isSalonUser) return <div>This is for salon users only</div>

  return <div>Welcome to {salonOrganization?.name} Salon Dashboard</div>
}
```

### 2. CRUD Operation Hooks

#### `useCreateEntity`

**Smart Code**: `HERA.DNA.HOOKS.CRUD.CREATE.v1`

Create any business entity in the universal system.

```typescript
import { useCreateEntity } from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function CreateCustomerForm() {
  const createEntity = useCreateEntity()

  const handleSubmit = async formData => {
    const result = await createEntity({
      entity_type: 'customer',
      entity_name: formData.name,
      smart_code: 'HERA.SALON.CRM.CUSTOMER.v1',
      metadata: {
        email: formData.email,
        phone: formData.phone,
        preferred_stylist: formData.stylistId
      }
    })

    if (result.data) {
      console.log('Customer created:', result.data)
    }
  }
}
```

#### `useReadEntities`

**Smart Code**: `HERA.DNA.HOOKS.CRUD.READ.v1`

Read entities with filtering.

```typescript
import { useReadEntities } from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function CustomerList() {
  const readEntities = useReadEntities()
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    const loadCustomers = async () => {
      const result = await readEntities({
        entity_type: 'customer',
        smart_code: 'HERA.SALON.CRM.CUSTOMER.v1'
      })

      if (result.data) {
        setCustomers(result.data)
      }
    }

    loadCustomers()
  }, [])

  return (
    <div>
      {customers.map(customer => (
        <div key={customer.id}>{customer.entity_name}</div>
      ))}
    </div>
  )
}
```

#### `useUpdateEntity`

**Smart Code**: `HERA.DNA.HOOKS.CRUD.UPDATE.v1`

Update existing entities.

```typescript
import { useUpdateEntity } from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function EditCustomer({ customerId }) {
  const updateEntity = useUpdateEntity()

  const handleUpdate = async updates => {
    const result = await updateEntity(customerId, {
      entity_name: updates.name,
      metadata: {
        email: updates.email,
        phone: updates.phone
      }
    })

    if (result.data) {
      console.log('Customer updated')
    }
  }
}
```

#### `useDeleteEntity`

**Smart Code**: `HERA.DNA.HOOKS.CRUD.DELETE.v1`

Delete entities (soft delete recommended).

```typescript
import { useDeleteEntity } from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function DeleteCustomerButton({ customerId }) {
  const deleteEntity = useDeleteEntity()

  const handleDelete = async () => {
    if (confirm('Are you sure?')) {
      const result = await deleteEntity(customerId)

      if (result.success) {
        console.log('Customer deleted')
      }
    }
  }

  return <button onClick={handleDelete}>Delete</button>
}
```

### 3. Transaction Hooks

#### `useCreateTransaction`

**Smart Code**: `HERA.DNA.HOOKS.TXN.CREATE.v1`

Create business transactions.

```typescript
import { useCreateTransaction } from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function CreateSalonSale() {
  const createTransaction = useCreateTransaction()

  const handleSale = async saleData => {
    const result = await createTransaction({
      transaction_type: 'sale',
      transaction_date: new Date().toISOString(),
      total_amount: saleData.total,
      smart_code: 'HERA.SALON.TXN.SALE.v1',
      source_entity_id: saleData.customerId,
      target_entity_id: saleData.stylistId,
      metadata: {
        services: saleData.services,
        payment_method: saleData.paymentMethod
      }
    })

    return result
  }
}
```

#### `useCreateTransactionLines`

**Smart Code**: `HERA.DNA.HOOKS.TXN.LINES.CREATE.v1`

Create transaction line items.

```typescript
import { useCreateTransactionLines } from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function AddTransactionLines({ transactionId, services }) {
  const createLines = useCreateTransactionLines()

  const handleAddLines = async () => {
    const lines = services.map((service, index) => ({
      line_number: index + 1,
      line_entity_id: service.id,
      quantity: service.quantity,
      unit_price: service.price,
      line_amount: service.quantity * service.price,
      smart_code: 'HERA.SALON.TXN.LINE.SERVICE.v1',
      metadata: {
        service_name: service.name,
        duration_minutes: service.duration
      }
    }))

    const result = await createLines(transactionId, lines)
    return result
  }
}
```

### 4. Dynamic Data Hooks

#### `useSetDynamicField`

**Smart Code**: `HERA.DNA.HOOKS.DYNAMIC.SET.v1`

Add custom fields to any entity without schema changes.

```typescript
import { useSetDynamicField } from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function CustomerPreferences({ customerId }) {
  const setDynamicField = useSetDynamicField()

  const savePreference = async (fieldName, value) => {
    await setDynamicField(customerId, fieldName, value, 'HERA.SALON.CRM.PREFERENCE.v1')
  }

  // Examples
  await savePreference('favorite_color', 'Blonde')
  await savePreference('allergies', ['PPD', 'Ammonia'])
  await savePreference('last_visit', new Date())
  await savePreference('loyalty_points', 1250)
}
```

#### `useGetDynamicFields`

**Smart Code**: `HERA.DNA.HOOKS.DYNAMIC.GET.v1`

Retrieve all dynamic fields for an entity.

```typescript
import { useGetDynamicFields } from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function ShowCustomerDetails({ customerId }) {
  const getDynamicFields = useGetDynamicFields()
  const [fields, setFields] = useState({})

  useEffect(() => {
    const loadFields = async () => {
      const result = await getDynamicFields(customerId)

      if (result.data) {
        const fieldMap = {}
        result.data.forEach(field => {
          fieldMap[field.field_name] =
            field.field_value_text ||
            field.field_value_number ||
            field.field_value_date ||
            field.metadata
        })
        setFields(fieldMap)
      }
    }

    loadFields()
  }, [customerId])

  return (
    <div>
      <p>Favorite Color: {fields.favorite_color}</p>
      <p>Loyalty Points: {fields.loyalty_points}</p>
    </div>
  )
}
```

### 5. Relationship Hooks

#### `useCreateRelationship`

**Smart Code**: `HERA.DNA.HOOKS.REL.CREATE.v1`

Create relationships between entities.

```typescript
import { useCreateRelationship } from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function AssignCustomerToStylist({ customerId, stylistId }) {
  const createRelationship = useCreateRelationship()

  const handleAssign = async () => {
    await createRelationship({
      from_entity_id: customerId,
      to_entity_id: stylistId,
      relationship_type: 'preferred_stylist',
      smart_code: 'HERA.SALON.REL.PREFERRED.STYLIST.v1',
      metadata: {
        assigned_date: new Date().toISOString(),
        preference_level: 'primary'
      }
    })
  }
}
```

### 6. Composite Hooks (Common Patterns)

#### `useCreateEntityWithStatus`

**Smart Code**: `HERA.DNA.HOOKS.COMPOSITE.ENTITY.STATUS.v1`

Create an entity with initial status (using relationships).

```typescript
import { useCreateEntityWithStatus } from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function CreateAppointment() {
  const createEntityWithStatus = useCreateEntityWithStatus()

  const handleCreate = async appointmentData => {
    // Assuming you have status entities created
    const PENDING_STATUS_ID = 'status-entity-pending-id'

    const result = await createEntityWithStatus(
      {
        entity_type: 'appointment',
        entity_name: `Appointment - ${appointmentData.customerName}`,
        smart_code: 'HERA.SALON.APPT.BOOKING.v1',
        metadata: {
          date: appointmentData.date,
          time: appointmentData.time,
          services: appointmentData.services
        }
      },
      PENDING_STATUS_ID
    )

    return result
  }
}
```

#### `useCreateCompleteTransaction`

**Smart Code**: `HERA.DNA.HOOKS.COMPOSITE.TXN.COMPLETE.v1`

Create transaction with lines in one operation.

```typescript
import { useCreateCompleteTransaction } from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function CompleteSalonSale() {
  const createCompleteTransaction = useCreateCompleteTransaction()

  const processSale = async saleData => {
    const result = await createCompleteTransaction(
      // Transaction header
      {
        transaction_type: 'sale',
        transaction_date: new Date().toISOString(),
        total_amount: saleData.total,
        smart_code: 'HERA.SALON.TXN.SALE.v1',
        source_entity_id: saleData.customerId,
        target_entity_id: saleData.stylistId
      },
      // Transaction lines
      saleData.services.map((service, index) => ({
        line_number: index + 1,
        line_entity_id: service.id,
        quantity: 1,
        unit_price: service.price,
        line_amount: service.price,
        smart_code: 'HERA.SALON.TXN.LINE.SERVICE.v1'
      }))
    )

    return result
  }
}
```

## Smart Code Reference

### Authentication Hooks

- `HERA.DNA.HOOKS.AUTH.CORE.v1` - Core authentication
- `HERA.DNA.HOOKS.AUTH.DEMO.v1` - Demo organization
- `HERA.DNA.HOOKS.AUTH.SALON.v1` - Salon authentication
- `HERA.DNA.HOOKS.AUTH.RESTAURANT.v1` - Restaurant authentication
- `HERA.DNA.HOOKS.AUTH.HEALTHCARE.v1` - Healthcare authentication
- `HERA.DNA.HOOKS.AUTH.MANUFACTURING.v1` - Manufacturing authentication

### CRUD Hooks

- `HERA.DNA.HOOKS.CRUD.CREATE.v1` - Create entities
- `HERA.DNA.HOOKS.CRUD.READ.v1` - Read entities
- `HERA.DNA.HOOKS.CRUD.UPDATE.v1` - Update entities
- `HERA.DNA.HOOKS.CRUD.DELETE.v1` - Delete entities

### Transaction Hooks

- `HERA.DNA.HOOKS.TXN.CREATE.v1` - Create transactions
- `HERA.DNA.HOOKS.TXN.LINES.CREATE.v1` - Create transaction lines

### Dynamic Data Hooks

- `HERA.DNA.HOOKS.DYNAMIC.SET.v1` - Set dynamic fields
- `HERA.DNA.HOOKS.DYNAMIC.GET.v1` - Get dynamic fields

### Relationship Hooks

- `HERA.DNA.HOOKS.REL.CREATE.v1` - Create relationships
- `HERA.DNA.HOOKS.REL.GET.v1` - Get relationships

### Composite Hooks

- `HERA.DNA.HOOKS.COMPOSITE.ENTITY.STATUS.v1` - Entity with status
- `HERA.DNA.HOOKS.COMPOSITE.TXN.COMPLETE.v1` - Complete transaction

## Best Practices

1. **Always use organization context**: All hooks automatically include organization_id for multi-tenant isolation
2. **Use smart codes**: Every operation should have a meaningful smart code for business context
3. **Handle loading states**: Most hooks return loading states - use them in your UI
4. **Check for errors**: Always handle error cases in your components
5. **Use composite hooks**: For common patterns, use composite hooks to reduce boilerplate

## Testing

Use the test component to verify all hooks are working:

```typescript
import { TestHERADNAHooks } from '@/src/lib/dna/hooks/test-hera-dna-hooks'

// Add to a test page
<TestHERADNAHooks />
```

This will display the status of all hooks and their current state.
