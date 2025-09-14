# Salon ERP Setup Guide for Supabase

## 🚀 Step-by-Step Instructions

### Prerequisites
- Access to Supabase SQL Editor
- Admin privileges in your Supabase project

### Step 1: Create Organization
1. Open Supabase SQL Editor
2. Run this query first and **save the returned ID**:

```sql
INSERT INTO core_organizations (
    id,
    organization_code,
    organization_name,
    organization_type,
    industry_classification,
    settings,
    status,
    created_at
) VALUES (
    gen_random_uuid(),
    'SALON-ERP-2025',
    'Premium Hair & Beauty Salon',
    'salon',
    'salon',
    jsonb_build_object(
        'industry', 'salon',
        'currency', 'AED',
        'timezone', 'Asia/Dubai',
        'fiscal_year_start', '01-01',
        'working_hours', jsonb_build_object(
            'monday', jsonb_build_object('open', '09:00', 'close', '21:00'),
            'tuesday', jsonb_build_object('open', '09:00', 'close', '21:00'),
            'wednesday', jsonb_build_object('open', '09:00', 'close', '21:00'),
            'thursday', jsonb_build_object('open', '09:00', 'close', '21:00'),
            'friday', jsonb_build_object('open', '09:00', 'close', '22:00'),
            'saturday', jsonb_build_object('open', '09:00', 'close', '22:00'),
            'sunday', jsonb_build_object('open', '10:00', 'close', '20:00')
        )
    ),
    'active',
    NOW()
) RETURNING id;
```

**IMPORTANT**: Copy the returned UUID. You'll need it for all subsequent queries.

### Step 2: Create Variable for Organization ID
Replace `your-uuid-here` with the ID from Step 1:

```sql
DO $$ 
DECLARE 
    org_id uuid := 'your-uuid-here';
BEGIN
    -- This sets a session variable we can use
    PERFORM set_config('app.org_id', org_id::text, false);
END $$;
```

### Step 3: Create Core Entities
Run each section separately to avoid timeouts:

#### 3.1 Services
```sql
INSERT INTO core_entities (
    id, organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, created_at
) VALUES 
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'service', 'Basic Haircut', 'SVC-HAIR-001', 
 'HERA.SALON.SERVICE.HAIRCUT.BASIC.v1', 'active', NOW()),
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'service', 'Premium Hair Color', 'SVC-COLOR-001', 
 'HERA.SALON.SERVICE.COLOR.PREMIUM.v1', 'active', NOW()),
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'service', 'Hair Treatment', 'SVC-TREAT-001', 
 'HERA.SALON.SERVICE.TREATMENT.KERATIN.v1', 'active', NOW()),
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'service', 'Bridal Package', 'SVC-BRIDE-001', 
 'HERA.SALON.SERVICE.PACKAGE.BRIDAL.v1', 'active', NOW()),
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'service_bundle', 'Cut & Color Combo', 'BUNDLE-CC-001', 
 'HERA.SALON.SERVICE.BUNDLE.CUTCOLOR.v1', 'active', NOW());
```

#### 3.2 Products
```sql
INSERT INTO core_entities (
    id, organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, created_at
) VALUES 
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'product', 'Professional Shampoo', 'PROD-SHMP-001', 
 'HERA.SALON.INVENTORY.PRODUCT.SHAMPOO.v1', 'active', NOW()),
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'product', 'Hair Color - Blonde', 'PROD-COLOR-001', 
 'HERA.SALON.INVENTORY.PRODUCT.COLOR.v1', 'active', NOW()),
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'product', 'Hair Serum', 'PROD-SERUM-001', 
 'HERA.SALON.INVENTORY.PRODUCT.SERUM.v1', 'active', NOW());
```

#### 3.3 Staff
```sql
INSERT INTO core_entities (
    id, organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, created_at
) VALUES 
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'stylist', 'Emma Wilson', 'STAFF-001', 
 'HERA.SALON.RESOURCE.STYLIST.SENIOR.v1', 'active', NOW()),
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'stylist', 'Sarah Chen', 'STAFF-002', 
 'HERA.SALON.RESOURCE.STYLIST.JUNIOR.v1', 'active', NOW()),
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'stylist', 'Maria Garcia', 'STAFF-003', 
 'HERA.SALON.RESOURCE.STYLIST.COLORIST.v1', 'active', NOW());
```

#### 3.4 Resources
```sql
INSERT INTO core_entities (
    id, organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, created_at
) VALUES 
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'chair', 'Station 1 - Premium', 'CHAIR-001', 
 'HERA.SALON.RESOURCE.CHAIR.PREMIUM.v1', 'active', NOW()),
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'chair', 'Station 2 - Standard', 'CHAIR-002', 
 'HERA.SALON.RESOURCE.CHAIR.STANDARD.v1', 'active', NOW()),
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'room', 'VIP Treatment Room', 'ROOM-001', 
 'HERA.SALON.RESOURCE.ROOM.VIP.v1', 'active', NOW());
```

#### 3.5 Customers
```sql
INSERT INTO core_entities (
    id, organization_id, entity_type, entity_name, entity_code, 
    smart_code, status, created_at
) VALUES 
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'customer', 'Aisha Mohammed', 'CUST-001', 
 'HERA.SALON.CRM.CUSTOMER.VIP.v1', 'active', NOW()),
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'customer', 'Fatima Al-Rashid', 'CUST-002', 
 'HERA.SALON.CRM.CUSTOMER.REGULAR.v1', 'active', NOW()),
(gen_random_uuid(), current_setting('app.org_id')::uuid, 'customer', 'Noor Abdullah', 'CUST-003', 
 'HERA.SALON.CRM.CUSTOMER.NEW.v1', 'active', NOW());
```

### Step 4: Add Dynamic Data
Run this to add properties to entities:

```sql
-- Service Properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, 
    field_value_text, field_value_number, smart_code, created_at
)
SELECT 
    gen_random_uuid(), current_setting('app.org_id')::uuid, e.id, f.field_name, f.field_type,
    f.field_value_text, f.field_value_number, e.smart_code, NOW()
FROM core_entities e
CROSS JOIN (
    VALUES 
    ('SVC-HAIR-001', 'duration_minutes', 'number', NULL, 45),
    ('SVC-HAIR-001', 'base_price', 'number', NULL, 120.00),
    ('SVC-COLOR-001', 'duration_minutes', 'number', NULL, 90),
    ('SVC-COLOR-001', 'base_price', 'number', NULL, 350.00),
    ('SVC-TREAT-001', 'duration_minutes', 'number', NULL, 60),
    ('SVC-TREAT-001', 'base_price', 'number', NULL, 280.00)
) AS f(entity_code, field_name, field_type, field_value_text, field_value_number)
WHERE e.entity_code = f.entity_code 
  AND e.organization_id = current_setting('app.org_id')::uuid;
```

### Step 5: Create Sample Transaction
Create an appointment booking:

```sql
-- First create the transaction
WITH new_appt AS (
    INSERT INTO universal_transactions (
        id, organization_id, transaction_type, transaction_date, transaction_code,
        smart_code, source_entity_id, target_entity_id, 
        total_amount, transaction_currency_code, business_context, created_at
    )
    SELECT 
        gen_random_uuid(), current_setting('app.org_id')::uuid, 'appointment', 
        NOW() + INTERVAL '2 days', 'APPT-2025-001',
        'HERA.SALON.APPT.BOOK.CREATE.v1',
        c.id, s.id,
        0, 'AED',
        jsonb_build_object(
            'appointment_datetime', (NOW() + INTERVAL '2 days')::text,
            'duration_minutes', 90,
            'status', 'confirmed'
        ),
        NOW()
    FROM core_entities c, core_entities s
    WHERE c.entity_code = 'CUST-001' AND c.organization_id = current_setting('app.org_id')::uuid
      AND s.entity_code = 'STAFF-001' AND s.organization_id = current_setting('app.org_id')::uuid
    RETURNING id
)
-- Then create the lines
INSERT INTO universal_transaction_lines (
    id, organization_id, transaction_id, line_number, line_type,
    entity_id, quantity, unit_amount, line_amount, 
    smart_code, line_data, created_at
)
SELECT 
    gen_random_uuid(), current_setting('app.org_id')::uuid, new_appt.id, 1, 'SERVICE',
    e.id, 1, 350.00, 350.00,
    'HERA.SALON.APPT.LINE.SERVICE.v1',
    jsonb_build_object('duration_minutes', 90),
    NOW()
FROM new_appt, core_entities e
WHERE e.entity_code = 'SVC-COLOR-001' 
  AND e.organization_id = current_setting('app.org_id')::uuid;
```

### Step 6: Verify Your Setup

#### Check entity count:
```sql
SELECT entity_type, COUNT(*) as count 
FROM core_entities 
WHERE organization_id = current_setting('app.org_id')::uuid
GROUP BY entity_type
ORDER BY entity_type;
```

#### Check transactions:
```sql
SELECT transaction_type, transaction_code, total_amount, transaction_currency_code
FROM universal_transactions
WHERE organization_id = current_setting('app.org_id')::uuid
ORDER BY created_at DESC;
```

#### Validate smart codes:
```sql
SELECT entity_type, entity_name, smart_code,
       CASE WHEN smart_code ~ '^HERA\.[A-Z0-9]{3,15}(\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$' 
            THEN '✅ VALID' 
            ELSE '❌ INVALID' 
       END as validity
FROM core_entities 
WHERE organization_id = current_setting('app.org_id')::uuid
ORDER BY entity_type, entity_name;
```

## 📊 Expected Results

After completing all steps, you should have:

- **1 Organization**: Premium Hair & Beauty Salon
- **5 Services**: Including haircut, color, treatment, bridal package
- **3 Products**: Shampoo, hair color, serum
- **3 Staff Members**: Senior stylist, junior stylist, colorist
- **3 Resources**: 2 chairs, 1 VIP room
- **3 Customers**: VIP, regular, and new customer
- **Financial Entities**: Tax profile, payment terms, GL accounts
- **2 Suppliers**: For products and equipment
- **5 Workflow Statuses**: Draft, pending, confirmed, completed, cancelled
- **Sample Transactions**: Appointment booking with service lines

## 🔧 Troubleshooting

1. **Organization ID not found**: Make sure you saved the UUID from Step 1 and set it correctly in Step 2
2. **Duplicate key errors**: Some entities might already exist - you can skip those inserts
3. **Foreign key violations**: Make sure you're running the queries in order
4. **Smart code validation fails**: All smart codes should follow the pattern with 4-9 segments

## 🎯 Next Steps

Once the basic setup is complete, you can:

1. Add more dynamic data (phone numbers, email addresses, etc.)
2. Create more relationships (stylist skills, service-product mappings)
3. Add inventory transactions
4. Create POS sales with inventory consumption
5. Set up financial postings through Finance DNA