# HERA Universal Schema - How Everything Works Automatically

## 🧬 The Magic of 6 Tables - Infinite Business Complexity

### The Sacred 6 Tables Handle EVERYTHING:

```sql
1. core_organizations     → WHO owns the data (multi-tenant isolation)
2. core_entities         → WHAT exists (customers, products, events, ANYTHING)
3. core_dynamic_data     → HOW to extend (unlimited custom fields)
4. core_relationships    → WHY things connect (hierarchies, workflows, associations)
5. universal_transactions → WHEN things happen (sales, bookings, movements)
6. universal_transaction_lines → DETAILS of what happened (items, amounts, quantities)
```

## 🎯 Real Examples: How Different Business Needs Use Same Tables

### Example 1: Salon Appointment Booking

```typescript
// 1. Customer is an entity
{
  table: 'core_entities',
  entity_type: 'customer',
  entity_name: 'Sarah Johnson',
  smart_code: 'HERA.SALON.CUSTOMER.v1'
}

// 2. Staff member is an entity
{
  table: 'core_entities',
  entity_type: 'staff',
  entity_name: 'Maria (Senior Stylist)',
  smart_code: 'HERA.SALON.STAFF.v1'
}

// 3. Service is an entity
{
  table: 'core_entities',
  entity_type: 'service',
  entity_name: 'Premium Hair Color',
  smart_code: 'HERA.SALON.SERVICE.v1'
}

// 4. Appointment is a transaction
{
  table: 'universal_transactions',
  transaction_type: 'appointment',
  transaction_date: '2024-01-20 14:00:00',
  from_entity_id: customer.id,  // Sarah
  to_entity_id: staff.id,       // Maria
  total_amount: 350.00,
  smart_code: 'HERA.SALON.APPOINTMENT.v1',
  metadata: {
    duration_minutes: 120,
    status: 'confirmed',
    notes: 'Allergic to PPD'
  }
}

// 5. Services in appointment are transaction lines
{
  table: 'universal_transaction_lines',
  transaction_id: appointment.id,
  line_entity_id: service.id,  // Premium Hair Color
  quantity: 1,
  unit_price: 350.00,
  line_amount: 350.00
}

// 6. Customer preferences in dynamic data
{
  table: 'core_dynamic_data',
  entity_id: customer.id,
  field_name: 'preferred_stylist',
  field_value_text: 'Maria',
  smart_code: 'HERA.SALON.PREFERENCE.v1'
}

// 7. Appointment status via relationships
{
  table: 'core_relationships',
  from_entity_id: appointment.id,
  to_entity_id: confirmed_status.id,
  relationship_type: 'has_status',
  smart_code: 'HERA.WORKFLOW.STATUS.v1'
}
```

### Example 2: Restaurant Order with Multiple Items

```typescript
// 1. Table/Customer
{
  table: 'core_entities',
  entity_type: 'restaurant_table',
  entity_name: 'Table 5',
  metadata: { capacity: 4, zone: 'patio' }
}

// 2. Menu items are entities
{
  table: 'core_entities',
  entity_type: 'menu_item',
  entity_name: 'Margherita Pizza',
  metadata: { 
    category: 'pizza',
    price: 45.00,
    prep_time: 15,
    ingredients: ['tomato', 'mozzarella', 'basil']
  }
}

// 3. Order is a transaction
{
  table: 'universal_transactions',
  transaction_type: 'restaurant_order',
  from_entity_id: table.id,
  to_entity_id: kitchen.id,
  total_amount: 127.50,
  metadata: {
    order_type: 'dine_in',
    waiter: 'John',
    special_requests: 'No nuts'
  }
}

// 4. Order items are transaction lines
[
  {
    table: 'universal_transaction_lines',
    line_entity_id: margherita_pizza.id,
    quantity: 2,
    unit_price: 45.00,
    line_amount: 90.00,
    metadata: { modifications: 'extra cheese' }
  },
  {
    table: 'universal_transaction_lines',
    line_entity_id: caesar_salad.id,
    quantity: 1,
    unit_price: 32.50,
    line_amount: 32.50,
    metadata: { modifications: 'no croutons' }
  }
]

// 5. Order workflow via relationships
{
  table: 'core_relationships',
  from_entity_id: order.id,
  to_entity_id: in_preparation_status.id,
  relationship_type: 'has_status',
  metadata: { 
    status_changed_at: '2024-01-20 19:15:00',
    changed_by: 'kitchen_system'
  }
}
```

### Example 3: Event Management System

```typescript
// 1. Event is an entity
{
  table: 'core_entities',
  entity_type: 'event',
  entity_name: 'Tech Conference 2024',
  metadata: {
    venue: 'Dubai World Trade Centre',
    capacity: 500,
    date: '2024-03-15',
    time: '09:00-18:00'
  }
}

// 2. Attendee registration is a transaction
{
  table: 'universal_transactions',
  transaction_type: 'event_registration',
  from_entity_id: attendee.id,
  to_entity_id: event.id,
  total_amount: 299.00,
  metadata: {
    ticket_type: 'early_bird',
    dietary_requirements: 'vegetarian',
    t_shirt_size: 'L'
  }
}

// 3. Sessions are related entities
{
  table: 'core_entities',
  entity_type: 'event_session',
  entity_name: 'AI in Healthcare',
  metadata: {
    speaker: 'Dr. Smith',
    time: '10:00-11:00',
    room: 'Hall A'
  }
}

// 4. Session attendance via relationships
{
  table: 'core_relationships',
  from_entity_id: attendee.id,
  to_entity_id: session.id,
  relationship_type: 'attending',
  metadata: {
    registered_at: '2024-01-15',
    seat_number: 'A-45'
  }
}
```

### Example 4: Manufacturing Bill of Materials

```typescript
// 1. Product and components are entities
{
  table: 'core_entities',
  entity_type: 'product',
  entity_name: 'Electric Bicycle Model X',
  metadata: {
    sku: 'EB-X-2024',
    weight: 25.5,
    color_options: ['black', 'white', 'red']
  }
}

// 2. BOM structure via relationships
{
  table: 'core_relationships',
  from_entity_id: bicycle.id,      // Parent product
  to_entity_id: battery.id,        // Component
  relationship_type: 'has_component',
  metadata: {
    quantity: 1,
    unit: 'piece',
    assembly_order: 1
  }
}

// 3. Production order is a transaction
{
  table: 'universal_transactions',
  transaction_type: 'production_order',
  from_entity_id: factory.id,
  to_entity_id: warehouse.id,
  total_amount: 50000.00,  // Cost to produce
  metadata: {
    quantity_ordered: 100,
    due_date: '2024-02-15',
    priority: 'high'
  }
}

// 4. Materials consumed are transaction lines
{
  table: 'universal_transaction_lines',
  line_entity_id: battery.id,
  quantity: 100,
  unit_price: 150.00,
  line_amount: 15000.00,
  metadata: {
    batch_number: 'BAT-2024-001',
    quality_check: 'passed'
  }
}
```

## 🎯 How It All Works Automatically

### 1. **Entities = ANY Business Object**
```typescript
// Instead of creating new tables, just use entity_type
entity_type: 'customer'      // Salon customer
entity_type: 'patient'       // Healthcare patient  
entity_type: 'student'       // Education student
entity_type: 'vehicle'       // Fleet vehicle
entity_type: 'property'      // Real estate property
entity_type: 'ticket'        // Support ticket
entity_type: 'campaign'      // Marketing campaign
entity_type: 'document'      // Any document
// ... literally ANYTHING
```

### 2. **Dynamic Data = Unlimited Custom Fields**
```typescript
// No need to add columns, just add dynamic fields
{
  entity_id: customer.id,
  field_name: 'loyalty_tier',
  field_value_text: 'platinum'
}

{
  entity_id: patient.id,
  field_name: 'blood_type',
  field_value_text: 'O+'
}

{
  entity_id: vehicle.id,
  field_name: 'last_service_date',
  field_value_date: '2024-01-10'
}
```

### 3. **Relationships = Any Connection**
```typescript
// Status workflows
relationship_type: 'has_status'      // Order → Pending
relationship_type: 'approved_by'     // Document → Manager
relationship_type: 'assigned_to'     // Task → Employee

// Hierarchies
relationship_type: 'parent_of'       // Company → Department
relationship_type: 'reports_to'      // Employee → Manager
relationship_type: 'part_of'         // Component → Product

// Associations
relationship_type: 'friend_of'       // User → User
relationship_type: 'follows'         // User → User
relationship_type: 'likes'           // User → Post
```

### 4. **Transactions = Any Business Event**
```typescript
transaction_type: 'sale'             // Retail sale
transaction_type: 'appointment'      // Service booking
transaction_type: 'transfer'         // Inventory movement
transaction_type: 'payment'          // Money movement
transaction_type: 'enrollment'       // Course registration
transaction_type: 'check_in'         // Attendance
transaction_type: 'prescription'     // Medical prescription
transaction_type: 'rental'           // Equipment rental
// ... any business activity
```

### 5. **Transaction Lines = Details**
```typescript
// Products in a sale
// Services in an appointment  
// Items in a transfer
// Medications in a prescription
// Equipment in a rental
// Sessions in a registration
// ... any line-level detail
```

## 🚀 The Power of Smart Codes

Smart codes make everything intelligent:

```typescript
// Smart codes tell the system HOW to handle data
'HERA.SALON.APPOINTMENT.v1'     → Salon appointment logic
'HERA.REST.ORDER.DELIVERY.v1'   → Restaurant delivery rules
'HERA.MFG.PRODUCTION.ORDER.v1'  → Manufacturing workflow
'HERA.EDU.ENROLLMENT.COURSE.v1' → Education enrollment

// The system automatically:
- Applies business rules
- Validates data
- Triggers workflows  
- Posts to accounting
- Sends notifications
- Calculates analytics
```

## 📊 Real Implementation Examples

### Creating a Complex Event System
```typescript
// API endpoint for events
export const POST = withErrorHandler(async (request: NextRequest) => {
  const { organizationId, eventData } = await request.json()
  
  // 1. Create event entity
  const event = await supabase
    .from('core_entities')
    .insert({
      organization_id: organizationId,
      entity_type: 'event',
      entity_name: eventData.name,
      entity_code: `EVENT-${Date.now()}`,
      smart_code: 'HERA.EVENT.CONFERENCE.v1',
      metadata: {
        date: eventData.date,
        venue: eventData.venue,
        capacity: eventData.capacity,
        description: eventData.description,
        ticket_types: eventData.ticketTypes
      }
    })
  
  // 2. Create sessions as entities
  for (const session of eventData.sessions) {
    const sessionEntity = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'event_session',
        entity_name: session.title,
        smart_code: 'HERA.EVENT.SESSION.v1',
        metadata: session
      })
    
    // 3. Link session to event
    await supabase
      .from('core_relationships')
      .insert({
        from_entity_id: event.id,
        to_entity_id: sessionEntity.id,
        relationship_type: 'has_session',
        smart_code: 'HERA.EVENT.STRUCTURE.v1'
      })
  }
  
  // 4. Registrations will be transactions
  // 5. Attendance will be relationships
  // 6. Feedback will be dynamic data
  
  return NextResponse.json({ success: true, event })
})
```

### Handling Complex Workflows
```typescript
// Order with multiple statuses and assignments
async function processOrder(orderId: string) {
  // 1. Update status via relationship
  await createRelationship({
    from_entity_id: orderId,
    to_entity_id: inProgressStatus.id,
    relationship_type: 'has_status',
    metadata: { timestamp: new Date() }
  })
  
  // 2. Assign to kitchen
  await createRelationship({
    from_entity_id: orderId,
    to_entity_id: kitchenStation.id,
    relationship_type: 'assigned_to',
    metadata: { priority: 'high' }
  })
  
  // 3. Track preparation steps
  for (const item of orderItems) {
    await createDynamicData({
      entity_id: orderId,
      field_name: `item_${item.id}_status`,
      field_value_text: 'preparing',
      field_metadata: { 
        started_at: new Date(),
        estimated_time: item.prepTime
      }
    })
  }
}
```

## 🎨 UI Automatically Adapts

The beauty is your UI components work for ANY entity type:

```typescript
// This component works for customers, patients, students, vehicles...
function EntityList({ entityType }: { entityType: string }) {
  const [entities, setEntities] = useState([])
  
  useEffect(() => {
    fetch(`/api/v1/universal/entities?type=${entityType}&organization_id=${orgId}`)
      .then(res => res.json())
      .then(data => setEntities(data.entities))
  }, [entityType])
  
  return (
    <div>
      {entities.map(entity => (
        <Card key={entity.id}>
          <CardContent>
            <h3>{entity.name}</h3>
            <p>{entity.code}</p>
            {/* Metadata fields automatically displayed */}
            {Object.entries(entity.metadata || {}).map(([key, value]) => (
              <div key={key}>
                <span>{key}: </span>
                <span>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Use for anything:
<EntityList entityType="customer" />
<EntityList entityType="event" />
<EntityList entityType="product" />
<EntityList entityType="vehicle" />
```

## 🔥 Why This Is Revolutionary

### Traditional System:
```sql
-- Need 50+ tables for a simple business
CREATE TABLE customers (...);
CREATE TABLE appointments (...);
CREATE TABLE services (...);
CREATE TABLE staff (...);
CREATE TABLE appointment_services (...);
CREATE TABLE customer_preferences (...);
CREATE TABLE appointment_status_history (...);
-- ... and it keeps growing
```

### HERA Universal:
```sql
-- Just 6 tables handle EVERYTHING
-- No migrations needed
-- No schema changes
-- Infinite flexibility
-- Perfect for AI/ML
```

## 📋 Quick Patterns

### Adding New Feature = No Schema Change
```typescript
// Want to add gift cards to salon?
// Just create entities with type 'gift_card'
{
  entity_type: 'gift_card',
  entity_name: 'Holiday Special $100',
  metadata: {
    value: 100,
    expires: '2024-12-31',
    terms: 'Not valid with other offers'
  }
}

// Gift card purchase = transaction
// Gift card redemption = transaction
// Balance tracking = dynamic data
```

### Complex Relationships
```typescript
// Medical: Patient → Condition → Treatment → Outcome
// Education: Student → Course → Assignment → Grade  
// Manufacturing: Order → Production → Quality → Shipment
// Real Estate: Property → Tenant → Lease → Payment

// ALL use the same 6 tables!
```

## 🎯 Best Practices

1. **Entity Types**: Use descriptive, consistent types
2. **Smart Codes**: Always include for intelligence
3. **Metadata**: Store all custom fields here
4. **Relationships**: Use for workflows and hierarchies
5. **Transactions**: Every business event is a transaction
6. **Dynamic Data**: For frequently changing values

## 🚀 The Result

- **Zero Migrations**: Add any feature without schema changes
- **Instant Deployment**: New modules work immediately
- **Universal APIs**: Same endpoints work for everything
- **AI-Ready**: Perfect structure for machine learning
- **Cost Savings**: 90% reduction vs traditional ERP

This is why HERA can handle ANY business with just 6 tables!