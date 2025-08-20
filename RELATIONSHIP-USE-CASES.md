# 🔗 HERA Relationships Table - Critical Use Cases

The `core_relationships` table is one of the **most powerful features** of HERA's universal architecture. Here are the real-world use cases:

## 1. 🏢 Organizational Hierarchies

```sql
-- Department to Sub-Department
from_entity_id: "HR Department"
to_entity_id: "Recruitment Team"
relationship_type: "parent_of"

-- Employee Reporting Structure
from_entity_id: "John Manager"
to_entity_id: "Sarah Employee"
relationship_type: "manages"
```

## 2. 💅 Salon-Specific Relationships (From Your Data)

```sql
-- Customer Favorite Services (Real examples from the data)
from_entity_id: "Customer Jane"
to_entity_id: "Hair Color Service"
relationship_type: "favorite_service"
relationship_data: { service_name: 'Hair Color' }

-- Stylist Specializations
from_entity_id: "Emma Stylist"
to_entity_id: "Color Techniques"
relationship_type: "specializes_in"

-- Product Recommendations
from_entity_id: "Hair Color Service"
to_entity_id: "Premium Color Product"
relationship_type: "requires_product"
```

## 3. 🔄 Status Workflows (Universal Pattern)

```sql
-- Order Status Tracking
from_entity_id: "Order-12345" (entity, not transaction)
to_entity_id: "Confirmed Status"
relationship_type: "has_status"
effective_date: "2024-03-20"

-- Appointment Status
from_entity_id: "Appointment-001"
to_entity_id: "Completed Status"
relationship_type: "has_status"
```

## 4. 🏭 Manufacturing Bill of Materials

```sql
-- Product Assembly
from_entity_id: "Finished Car"
to_entity_id: "Engine Component"
relationship_type: "contains"
relationship_data: { quantity: 1, unit: "piece" }

-- Multi-Level BOM
from_entity_id: "Engine Component"
to_entity_id: "Piston"
relationship_type: "contains"
relationship_data: { quantity: 4, unit: "piece" }
```

## 5. 🏥 Healthcare Patient Relationships

```sql
-- Patient Primary Care
from_entity_id: "Patient Sarah"
to_entity_id: "Dr. Smith"
relationship_type: "primary_physician"

-- Emergency Contacts
from_entity_id: "Patient Sarah"
to_entity_id: "Contact John"
relationship_type: "emergency_contact"
relationship_strength: 1.0  -- Primary contact
```

## 6. 📊 Financial Account Hierarchies

```sql
-- Chart of Accounts
from_entity_id: "1000 - Assets"
to_entity_id: "1100 - Current Assets"
relationship_type: "parent_account"
hierarchy_level: 1

-- Cost Center Assignment
from_entity_id: "Marketing Department"
to_entity_id: "6100 - Marketing Expenses"
relationship_type: "uses_account"
```

## 7. 🛍️ E-Commerce Relationships

```sql
-- Product Bundles
from_entity_id: "Laptop Bundle"
to_entity_id: "Laptop"
relationship_type: "includes"
relationship_data: { quantity: 1, discount: 0 }

from_entity_id: "Laptop Bundle"
to_entity_id: "Mouse"
relationship_type: "includes"
relationship_data: { quantity: 1, discount: 100 }
```

## 8. 📅 Appointment Dependencies

```sql
-- Multi-Service Appointments
from_entity_id: "Color Appointment"
to_entity_id: "Consultation Appointment"
relationship_type: "depends_on"
relationship_data: { lead_time_days: 2 }
```

## 9. 🔐 Permission Relationships

```sql
-- Role to User Assignment
from_entity_id: "Admin Role"
to_entity_id: "User John"
relationship_type: "granted_to"
effective_date: "2024-01-01"
expiration_date: "2024-12-31"

-- Feature Access
from_entity_id: "Premium Features"
to_entity_id: "Organization ABC"
relationship_type: "enabled_for"
```

## 10. 📦 Inventory Relationships

```sql
-- Product Location
from_entity_id: "Hair Color Product"
to_entity_id: "Salon Storage Room"
relationship_type: "stored_in"
relationship_data: { quantity: 25, shelf: "A-3" }

-- Supplier Relationships
from_entity_id: "Vendor ABC"
to_entity_id: "Hair Color Product"
relationship_type: "supplies"
relationship_data: { lead_time_days: 7, min_order: 10 }
```

## 💡 Key Benefits of Relationships Table

1. **No Schema Changes**: Add new relationship types without modifying database
2. **Bidirectional**: Can traverse relationships in both directions
3. **Temporal**: Track when relationships start/end with effective dates
4. **Weighted**: Use relationship_strength for recommendations/priorities
5. **Metadata Rich**: Store any JSON data in relationship_data
6. **Hierarchical**: Build multi-level structures with hierarchy_level
7. **Auditable**: Full history of relationship changes

## 🚀 Working Example: Create Salon Customer-Stylist Preference

```bash
# Create a customer preference for a stylist
node hera-cli.js create-relationship \
  --from "customer-entity-id" \
  --to "stylist-entity-id" \
  --type "prefers_stylist" \
  --data '{"reason": "Great with color", "rating": 5}'

# Query all customer preferences
node hera-cli.js query core_relationships relationship_type:prefers_stylist

# Find all stylists a customer prefers
node hera-cli.js query core_relationships \
  "from_entity_id:customer-id AND relationship_type:prefers_stylist"
```

## 🔄 Status Workflow Pattern (Best Practice)

Instead of status columns, use relationships:

```bash
# 1. Create status entities (one-time setup)
node hera-cli.js create-entity workflow_status "Draft" --code "STATUS-DRAFT"
node hera-cli.js create-entity workflow_status "Active" --code "STATUS-ACTIVE"
node hera-cli.js create-entity workflow_status "Completed" --code "STATUS-COMPLETED"

# 2. Assign status to any entity
node hera-cli.js create-relationship \
  --from "appointment-entity-id" \
  --to "active-status-id" \
  --type "has_status" \
  --data '{"changed_by": "user-123", "reason": "Customer confirmed"}'

# 3. Query current status
node hera-cli.js query core_relationships \
  "from_entity_id:appointment-id AND relationship_type:has_status" \
  --order-by "created_at DESC" \
  --limit 1
```

This is why the relationship table is **SACRED** in HERA - it enables unlimited business complexity without schema changes!